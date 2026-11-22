from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import io
import csv
import json
import pandas as pd
import numpy as np

from database import engine, Base, get_db
from models import Battery, BatteryReading, HealthPrediction, AnomalyRecord, Alert, UploadedDataset
import schemas
from ml_models import ai_engine
from seed_data import seed_database

# Initialize SQLite tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="BatteryMind API",
    description="Universal EV Battery Health Intelligence & Predictive Analytics Platform Backend",
    version="1.0.0"
)

# CORS middleware for React Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seed initial data on startup
@app.on_event("startup")
def startup_event():
    db = next(get_db())
    seed_database(db)

# ==========================================
# 1. Dashboard Statistics API
# ==========================================
@app.get("/api/dashboard/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    batteries = db.query(Battery).all()
    total = len(batteries)
    if total == 0:
        return schemas.DashboardStats(
            total_batteries=0,
            average_soh=0.0,
            warning_count=0,
            critical_count=0,
            normal_count=0,
            category_counts={},
            chemistry_counts={},
            fleet_health_distribution={"90-100%": 0, "80-89%": 0, "70-79%": 0, "<70%": 0},
            average_temperature=28.0,
            average_cycles=0
        )

    avg_soh = sum(b.current_soh for b in batteries) / total
    warning_count = sum(1 for b in batteries if b.status == "Warning")
    critical_count = sum(1 for b in batteries if b.status == "Critical")
    normal_count = sum(1 for b in batteries if b.status == "Normal")

    cat_counts: Dict[str, int] = {}
    chem_counts: Dict[str, int] = {}
    dist = {"90-100%": 0, "80-89%": 0, "70-79%": 0, "<70%": 0}

    for b in batteries:
        cat_counts[b.vehicle_category] = cat_counts.get(b.vehicle_category, 0) + 1
        chem_counts[b.chemistry] = chem_counts.get(b.chemistry, 0) + 1
        if b.current_soh >= 90:
            dist["90-100%"] += 1
        elif b.current_soh >= 80:
            dist["80-89%"] += 1
        elif b.current_soh >= 70:
            dist["70-79%"] += 1
        else:
            dist["<70%"] += 1

    # Average temperature across latest readings
    latest_readings = db.query(BatteryReading.temperature).order_by(desc(BatteryReading.timestamp)).limit(100).all()
    avg_temp = (sum(r[0] for r in latest_readings) / len(latest_readings)) if latest_readings else 31.5
    avg_cycles = int(sum(b.cycle_count for b in batteries) / total)

    return schemas.DashboardStats(
        total_batteries=total,
        average_soh=round(avg_soh, 2),
        warning_count=warning_count,
        critical_count=critical_count,
        normal_count=normal_count,
        category_counts=cat_counts,
        chemistry_counts=chem_counts,
        fleet_health_distribution=dist,
        average_temperature=round(avg_temp, 1),
        average_cycles=avg_cycles
    )

# ==========================================
# 2. Battery Registration & Retrieval
# ==========================================
@app.get("/api/batteries", response_model=List[schemas.BatteryResponse])
def get_batteries(
    category: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Battery)
    if category and category != "All":
        query = query.filter(Battery.vehicle_category == category)
    if status and status != "All":
        query = query.filter(Battery.status == status)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Battery.battery_code.ilike(search_filter)) |
            (Battery.model_name.ilike(search_filter)) |
            (Battery.manufacturer.ilike(search_filter))
        )
    return query.order_by(Battery.id).all()

@app.get("/api/batteries/{battery_id}", response_model=schemas.BatteryResponse)
def get_battery(battery_id: int, db: Session = Depends(get_db)):
    battery = db.query(Battery).filter(Battery.id == battery_id).first()
    if not battery:
        raise HTTPException(status_code=404, detail="Battery not found")
    return battery

@app.post("/api/batteries", response_model=schemas.BatteryResponse)
def create_battery(battery_in: schemas.BatteryCreate, db: Session = Depends(get_db)):
    existing = db.query(Battery).filter(Battery.battery_code == battery_in.battery_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Battery code already exists")
    
    battery = Battery(**battery_in.dict())
    db.add(battery)
    db.commit()
    db.refresh(battery)

    # Initial forecast prediction
    forecast = ai_engine.forecast_degradation(battery.cycle_count, battery.current_soh, battery.chemistry)
    pred = HealthPrediction(
        battery_id=battery.id,
        timestamp=datetime.utcnow(),
        estimated_soh=battery.current_soh,
        confidence_score=0.95,
        predicted_eol_cycles=forecast["predicted_eol_cycle"],
        degradation_rate_pct_per_100cycles=forecast["degradation_rate_per_100_cycles"]
    )
    db.add(pred)
    db.commit()

    return battery

# ==========================================
# 3. Battery Sensor Readings
# ==========================================
@app.get("/api/batteries/{battery_id}/readings", response_model=List[schemas.ReadingResponse])
def get_battery_readings(battery_id: int, limit: int = 50, db: Session = Depends(get_db)):
    readings = db.query(BatteryReading)\
        .filter(BatteryReading.battery_id == battery_id)\
        .order_by(desc(BatteryReading.timestamp))\
        .limit(limit)\
        .all()
    # return ascending order for charts
    return list(reversed(readings))

@app.post("/api/readings", response_model=schemas.ReadingResponse)
def add_reading(reading_in: schemas.ReadingCreate, db: Session = Depends(get_db)):
    battery = db.query(Battery).filter(Battery.id == reading_in.battery_id).first()
    if not battery:
        raise HTTPException(status_code=404, detail="Battery not found")
    
    timestamp = reading_in.timestamp or datetime.utcnow()
    reading = BatteryReading(
        battery_id=reading_in.battery_id,
        timestamp=timestamp,
        voltage=reading_in.voltage,
        current=reading_in.current,
        temperature=reading_in.temperature,
        soc=reading_in.soc,
        capacity_remaining_ah=reading_in.capacity_remaining_ah,
        cycle_index=reading_in.cycle_index or battery.cycle_count,
        is_anomaly=reading_in.is_anomaly or False
    )
    db.add(reading)

    # Dynamic check for critical anomaly or alert
    if reading.temperature > 52.0:
        reading.is_anomaly = True
        battery.status = "Critical"
        alert = Alert(
            battery_id=battery.id,
            alert_type="Thermal Spike Alert",
            severity="Critical",
            message=f"Excessive cell temperature {reading.temperature:.1f}°C detected on {battery.battery_code}!",
            status="Active",
            timestamp=timestamp
        )
        db.add(alert)

    db.commit()
    db.refresh(reading)
    return reading

# ==========================================
# 4. AI Analysis: SOH Estimation
# ==========================================
@app.get("/api/ai/soh-estimation/{battery_id}")
def get_soh_estimation(battery_id: int, db: Session = Depends(get_db)):
    battery = db.query(Battery).filter(Battery.id == battery_id).first()
    if not battery:
        raise HTTPException(status_code=404, detail="Battery not found")
    
    readings = db.query(BatteryReading)\
        .filter(BatteryReading.battery_id == battery_id)\
        .order_by(desc(BatteryReading.timestamp))\
        .limit(40)\
        .all()
    
    readings_dict = [
        {
            "id": r.id,
            "voltage": r.voltage,
            "current": r.current,
            "temperature": r.temperature,
            "soc": r.soc,
            "capacity_remaining_ah": r.capacity_remaining_ah,
            "timestamp": str(r.timestamp)
        }
        for r in readings
    ]

    res = ai_engine.estimate_soh(battery.nominal_capacity_ah, readings_dict, battery.cycle_count)
    res["battery_id"] = battery.id
    res["battery_code"] = battery.battery_code
    res["vehicle_category"] = battery.vehicle_category
    res["nominal_capacity_ah"] = battery.nominal_capacity_ah
    res["current_recorded_soh"] = battery.current_soh
    return res

# ==========================================
# 5. AI Analysis: Anomaly Detection
# ==========================================
@app.get("/api/ai/anomalies/{battery_id}", response_model=schemas.AnomalyDetectionResult)
def get_battery_anomalies(battery_id: int, db: Session = Depends(get_db)):
    battery = db.query(Battery).filter(Battery.id == battery_id).first()
    if not battery:
        raise HTTPException(status_code=404, detail="Battery not found")

    readings = db.query(BatteryReading)\
        .filter(BatteryReading.battery_id == battery_id)\
        .order_by(BatteryReading.timestamp)\
        .all()

    readings_dict = [
        {
            "id": r.id,
            "voltage": r.voltage,
            "current": r.current,
            "temperature": r.temperature,
            "soc": r.soc,
            "capacity_remaining_ah": r.capacity_remaining_ah,
            "timestamp": r.timestamp.strftime("%Y-%m-%d %H:%M")
        }
        for r in readings
    ]

    return ai_engine.detect_anomalies(readings_dict, battery.nominal_voltage)

# ==========================================
# 6. AI Analysis: Degradation Forecasting
# ==========================================
@app.get("/api/ai/forecast/{battery_id}", response_model=schemas.ForecastResponse)
def get_battery_forecast(battery_id: int, db: Session = Depends(get_db)):
    battery = db.query(Battery).filter(Battery.id == battery_id).first()
    if not battery:
        raise HTTPException(status_code=404, detail="Battery not found")

    forecast = ai_engine.forecast_degradation(battery.cycle_count, battery.current_soh, battery.chemistry)
    return schemas.ForecastResponse(
        battery_id=battery.id,
        battery_code=battery.battery_code,
        current_cycle=battery.cycle_count,
        current_soh=battery.current_soh,
        predicted_eol_cycle=forecast["predicted_eol_cycle"],
        remaining_useful_cycles=forecast["remaining_useful_cycles"],
        degradation_rate_per_100_cycles=forecast["degradation_rate_per_100_cycles"],
        forecast_curve=forecast["forecast_curve"],
        model_r2_score=forecast["model_r2_score"]
    )

# ==========================================
# 7. AI Analysis: Explainable AI (XAI)
# ==========================================
@app.get("/api/ai/xai/{battery_id}", response_model=schemas.XAIExplanation)
def get_xai_explanation(battery_id: int, db: Session = Depends(get_db)):
    battery = db.query(Battery).filter(Battery.id == battery_id).first()
    if not battery:
        raise HTTPException(status_code=404, detail="Battery not found")

    readings = db.query(BatteryReading)\
        .filter(BatteryReading.battery_id == battery_id)\
        .order_by(desc(BatteryReading.timestamp))\
        .limit(30)\
        .all()

    readings_dict = [
        {"temperature": r.temperature, "current": r.current, "voltage": r.voltage}
        for r in readings
    ]

    res = ai_engine.explain_battery_health(
        battery.battery_code,
        battery.vehicle_category,
        battery.nominal_capacity_ah,
        battery.current_soh,
        battery.cycle_count,
        readings_dict
    )
    res["battery_id"] = battery.id
    return res

# ==========================================
# 8. Alerts Management APIs
# ==========================================
@app.get("/api/alerts", response_model=List[schemas.AlertResponse])
def get_alerts(severity: Optional[str] = None, status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Alert).join(Battery)
    if severity and severity != "All":
        query = query.filter(Alert.severity == severity)
    if status and status != "All":
        query = query.filter(Alert.status == status)

    alerts = query.order_by(desc(Alert.timestamp)).all()
    res = []
    for a in alerts:
        res.append(schemas.AlertResponse(
            id=a.id,
            battery_id=a.battery_id,
            alert_type=a.alert_type,
            severity=a.severity,
            message=a.message,
            status=a.status,
            timestamp=a.timestamp,
            battery_code=a.battery.battery_code if a.battery else "Unknown",
            vehicle_category=a.battery.vehicle_category if a.battery else "General"
        ))
    return res

@app.post("/api/alerts", response_model=schemas.AlertResponse)
def create_alert(alert_in: schemas.AlertCreate, db: Session = Depends(get_db)):
    alert = Alert(**alert_in.dict(), timestamp=datetime.utcnow())
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return schemas.AlertResponse(
        id=alert.id,
        battery_id=alert.battery_id,
        alert_type=alert.alert_type,
        severity=alert.severity,
        message=alert.message,
        status=alert.status,
        timestamp=alert.timestamp,
        battery_code=alert.battery.battery_code if alert.battery else "N/A",
        vehicle_category=alert.battery.vehicle_category if alert.battery else "N/A"
    )

@app.patch("/api/alerts/{alert_id}/status")
def update_alert_status(alert_id: int, status_update: Dict[str, str], db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    new_status = status_update.get("status", "Acknowledged")
    alert.status = new_status
    db.commit()
    return {"message": "Status updated successfully", "alert_id": alert_id, "new_status": new_status}

# ==========================================
# 9. CSV Data Upload & Processing
# ==========================================
@app.get("/api/uploaded-datasets")
def get_uploaded_datasets(db: Session = Depends(get_db)):
    return db.query(UploadedDataset).order_by(desc(UploadedDataset.uploaded_at)).all()

@app.get("/api/sample-csv")
def download_sample_csv():
    """Generates a downloadable sample CSV dataset matching BatteryMind schema"""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "battery_code", "vehicle_category", "model_name", "nominal_voltage",
        "nominal_capacity_ah", "chemistry", "voltage", "current", "temperature",
        "soc", "capacity_remaining_ah", "cycle_index"
    ])

    sample_rows = [
        ["BM-SCOOT-CSV1", "Electric scooters", "Ather Apex Ultra", 51.1, 72.0, "NMC", 50.4, 28.5, 31.2, 82.0, 59.0, 180],
        ["BM-SCOOT-CSV1", "Electric scooters", "Ather Apex Ultra", 51.1, 72.0, "NMC", 49.8, 42.0, 34.8, 76.5, 55.1, 180],
        ["BM-SCOOT-CSV1", "Electric scooters", "Ather Apex Ultra", 51.1, 72.0, "NMC", 49.1, 15.2, 33.1, 71.0, 51.1, 180],
        ["BM-BIKE-CSV2", "Electric bikes", "Ultraviolette F77 Sport", 72.0, 140.0, "NMC", 71.2, 52.0, 36.4, 88.0, 123.2, 290],
        ["BM-BIKE-CSV2", "Electric bikes", "Ultraviolette F77 Sport", 72.0, 140.0, "NMC", 70.5, 68.0, 39.1, 82.5, 115.5, 290],
        ["BM-CAR-CSV3", "Electric cars", "Tesla Model 3 LR", 355.0, 230.0, "NMC", 352.0, 110.0, 33.5, 78.0, 179.4, 380],
        ["BM-CAR-CSV3", "Electric cars", "Tesla Model 3 LR", 355.0, 230.0, "NMC", 348.5, 125.0, 35.8, 72.0, 165.6, 380],
        ["BM-BUS-CSV4", "Electric buses", "Proterra Catalyst E2", 680.0, 650.0, "NMC", 674.0, 180.0, 37.2, 85.0, 552.5, 640],
        ["BM-TRUCK-CSV5", "Electric trucks", "Freightliner eCascadia", 650.0, 680.0, "LFP", 645.0, 220.0, 36.0, 81.0, 550.8, 510]
    ]

    for r in sample_rows:
        writer.writerow(r)

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=batterymind_sample_telemetry.csv"}
    )

@app.post("/api/upload-csv")
async def upload_csv_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")

    required_cols = {"battery_code", "voltage", "current", "temperature"}
    if not required_cols.issubset(set(df.columns)):
        raise HTTPException(
            status_code=400,
            detail=f"CSV is missing essential telemetry columns: {required_cols - set(df.columns)}"
        )

    rows_inserted = 0
    now = datetime.utcnow()

    # Process grouped by battery_code
    for code, group in df.groupby("battery_code"):
        bat = db.query(Battery).filter(Battery.battery_code == code).first()
        if not bat:
            first_row = group.iloc[0]
            cat = str(first_row.get("vehicle_category", "Electric cars"))
            model = str(first_row.get("model_name", "EV Pack " + str(code)))
            nom_v = float(first_row.get("nominal_voltage", group["voltage"].mean()))
            nom_cap = float(first_row.get("nominal_capacity_ah", 100.0))
            chem = str(first_row.get("chemistry", "NMC"))

            bat = Battery(
                battery_code=str(code),
                vehicle_category=cat,
                model_name=model,
                manufacturer="Imported Dataset",
                nominal_capacity_ah=nom_cap,
                nominal_voltage=nom_v,
                chemistry=chem,
                cycle_count=int(first_row.get("cycle_index", 100)),
                current_soh=95.0,
                status="Normal"
            )
            db.add(bat)
            db.commit()
            db.refresh(bat)

        # Ingest readings
        for _, row in group.iterrows():
            v = float(row["voltage"])
            c = float(row["current"])
            t = float(row["temperature"])
            soc = float(row.get("soc", 80.0))
            cap = float(row.get("capacity_remaining_ah", bat.nominal_capacity_ah * (soc / 100.0)))
            cycle = int(row.get("cycle_index", bat.cycle_count))

            is_anomaly = bool(t > 48.0 or v > (bat.nominal_voltage * 1.2) or v < (bat.nominal_voltage * 0.8))

            r = BatteryReading(
                battery_id=bat.id,
                timestamp=now - timedelta(minutes=(len(group) - rows_inserted) * 10),
                voltage=round(v, 2),
                current=round(c, 2),
                temperature=round(t, 2),
                soc=round(soc, 1),
                capacity_remaining_ah=round(cap, 2),
                cycle_index=cycle,
                is_anomaly=is_anomaly
            )
            db.add(r)
            rows_inserted += 1

    # Record uploaded dataset entry
    dataset_rec = UploadedDataset(
        filename=file.filename,
        row_count=rows_inserted,
        status="Processed",
        uploaded_at=now,
        summary_notes=f"Successfully ingested {rows_inserted} sensor readings across {len(df['battery_code'].unique())} battery packs."
    )
    db.add(dataset_rec)
    db.commit()

    return {
        "status": "success",
        "filename": file.filename,
        "rows_processed": rows_inserted,
        "batteries_affected": len(df["battery_code"].unique())
    }

# ==========================================
# 10. Live Telemetry Simulator Endpoint
# ==========================================
@app.post("/api/simulate-telemetry/{battery_id}")
def simulate_telemetry_step(battery_id: int, db: Session = Depends(get_db)):
    """Simulates real-time telemetry streaming packet for live demonstrations"""
    battery = db.query(Battery).filter(Battery.id == battery_id).first()
    if not battery:
        raise HTTPException(status_code=404, detail="Battery not found")

    latest = db.query(BatteryReading)\
        .filter(BatteryReading.battery_id == battery_id)\
        .order_by(desc(BatteryReading.timestamp))\
        .first()

    base_v = battery.nominal_voltage
    curr_soc = latest.soc if latest else 80.0
    new_soc = max(5.0, curr_soc - 0.25)
    
    # Introduce dynamic oscillation
    noise_v = np.random.normal(0, 0.4)
    v = round(base_v * (0.92 + (new_soc / 100.0) * 0.16) + noise_v, 2)
    current = round(np.random.normal(32.0, 12.0), 2)
    temp = round(29.0 + (abs(current) * 0.1) + np.random.normal(0, 0.6), 2)
    rem_cap = round(battery.nominal_capacity_ah * (new_soc / 100.0), 2)

    new_reading = BatteryReading(
        battery_id=battery.id,
        timestamp=datetime.utcnow(),
        voltage=v,
        current=current,
        temperature=temp,
        soc=round(new_soc, 1),
        capacity_remaining_ah=rem_cap,
        cycle_index=battery.cycle_count,
        is_anomaly=(temp > 49.0 or v < base_v * 0.82)
    )
    db.add(new_reading)
    db.commit()
    db.refresh(new_reading)

    return {
        "message": "Telemetry packet received",
        "reading": {
            "id": new_reading.id,
            "voltage": new_reading.voltage,
            "current": new_reading.current,
            "temperature": new_reading.temperature,
            "soc": new_reading.soc,
            "capacity_remaining_ah": new_reading.capacity_remaining_ah,
            "timestamp": new_reading.timestamp
        }
    }

# ==========================================
# 11. Settings & Platform Preferences
# ==========================================
SYSTEM_SETTINGS = {
    "categories": [
        {"name": "Electric scooters", "voltage_range": "48V - 72V", "typical_capacity": "30Ah - 90Ah", "icon": "Zap"},
        {"name": "Electric bikes", "voltage_range": "60V - 96V", "typical_capacity": "40Ah - 160Ah", "icon": "Compass"},
        {"name": "Electric cars", "voltage_range": "350V - 800V", "typical_capacity": "100Ah - 250Ah", "icon": "Car"},
        {"name": "Electric buses", "voltage_range": "500V - 750V", "typical_capacity": "400Ah - 700Ah", "icon": "Bus"},
        {"name": "Electric trucks", "voltage_range": "600V - 1000V", "typical_capacity": "500Ah - 1000Ah", "icon": "Truck"}
    ],
    "thresholds": {
        "warning_temperature_c": 46.0,
        "critical_temperature_c": 52.0,
        "voltage_tolerance_pct": 18.0,
        "critical_soh_pct": 75.0,
        "warning_soh_pct": 85.0,
        "anomaly_contamination": 0.08
    },
    "simulation": {
        "auto_stream_active": True,
        "poll_interval_seconds": 10
    }
}

@app.get("/api/settings")
def get_settings():
    return SYSTEM_SETTINGS

@app.post("/api/settings")
def update_settings(payload: Dict[str, Any]):
    global SYSTEM_SETTINGS
    if "thresholds" in payload:
        SYSTEM_SETTINGS["thresholds"].update(payload["thresholds"])
    if "simulation" in payload:
        SYSTEM_SETTINGS["simulation"].update(payload["simulation"])
    return {"status": "success", "settings": SYSTEM_SETTINGS}

# ==========================================
# 12. Mount Built Frontend for Unified Full-Stack Serving
# ==========================================
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

DIST_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend", "dist")
if os.path.exists(DIST_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST_DIR, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend_spa(full_path: str):
        file_path = os.path.join(DIST_DIR, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(DIST_DIR, "index.html"))

