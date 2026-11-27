from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import numpy as np
import random
from models import Battery, BatteryReading, HealthPrediction, AnomalyRecord, Alert, UploadedDataset
from ml_models import ai_engine
import json

def seed_database(db: Session, owner_id: int):
    # Check if already seeded
    if db.query(Battery).count() > 0:
        return

    print("Seeding BatteryMind database with realistic EV fleet data...")

    fleet_templates = [
        # Electric Scooters
        {
            "battery_code": "BM-SCOOT-101",
            "vehicle_category": "Electric scooters",
            "model_name": "Ather Apex HyperPack 3.7",
            "manufacturer": "Ather Energy",
            "nominal_capacity_ah": 72.0,
            "nominal_voltage": 51.1,
            "chemistry": "NMC",
            "cycle_count": 310,
            "current_soh": 94.6,
            "status": "Normal"
        },
        {
            "battery_code": "BM-SCOOT-102",
            "vehicle_category": "Electric scooters",
            "model_name": "Ola S1 Pro Gen 2",
            "manufacturer": "Ola Electric",
            "nominal_capacity_ah": 78.0,
            "nominal_voltage": 51.8,
            "chemistry": "NMC",
            "cycle_count": 520,
            "current_soh": 88.2,
            "status": "Warning"
        },
        {
            "battery_code": "BM-SCOOT-103",
            "vehicle_category": "Electric scooters",
            "model_name": "Bajaj Chetak Premium",
            "manufacturer": "Bajaj Auto",
            "nominal_capacity_ah": 60.0,
            "nominal_voltage": 48.0,
            "chemistry": "LFP",
            "cycle_count": 680,
            "current_soh": 91.5,
            "status": "Normal"
        },
        # Electric Bikes
        {
            "battery_code": "BM-BIKE-201",
            "vehicle_category": "Electric bikes",
            "model_name": "Ultraviolette F77 Recon 10.3kWh",
            "manufacturer": "Ultraviolette Automotive",
            "nominal_capacity_ah": 142.0,
            "nominal_voltage": 72.0,
            "chemistry": "NMC",
            "cycle_count": 420,
            "current_soh": 92.4,
            "status": "Normal"
        },
        {
            "battery_code": "BM-BIKE-202",
            "vehicle_category": "Electric bikes",
            "model_name": "Revolt RV400 Urban",
            "manufacturer": "Revolt Motors",
            "nominal_capacity_ah": 45.0,
            "nominal_voltage": 72.0,
            "chemistry": "LFP",
            "cycle_count": 890,
            "current_soh": 84.1,
            "status": "Warning"
        },
        {
            "battery_code": "BM-BIKE-203",
            "vehicle_category": "Electric bikes",
            "model_name": "Tork Kratos R",
            "manufacturer": "Tork Motors",
            "nominal_capacity_ah": 80.0,
            "nominal_voltage": 48.0,
            "chemistry": "LFP",
            "cycle_count": 210,
            "current_soh": 96.8,
            "status": "Normal"
        },
        # Electric Cars
        {
            "battery_code": "BM-CAR-301",
            "vehicle_category": "Electric cars",
            "model_name": "Tesla Model 3 Long Range 82kWh",
            "manufacturer": "Tesla Motors",
            "nominal_capacity_ah": 230.0,
            "nominal_voltage": 355.0,
            "chemistry": "NMC",
            "cycle_count": 460,
            "current_soh": 93.8,
            "status": "Normal"
        },
        {
            "battery_code": "BM-CAR-302",
            "vehicle_category": "Electric cars",
            "model_name": "BYD Seal Blade 82.5kWh",
            "manufacturer": "BYD Auto",
            "nominal_capacity_ah": 150.0,
            "nominal_voltage": 550.0,
            "chemistry": "LFP",
            "cycle_count": 740,
            "current_soh": 95.1,
            "status": "Normal"
        },
        {
            "battery_code": "BM-CAR-303",
            "vehicle_category": "Electric cars",
            "model_name": "Hyundai Ioniq 5 Ultra 77kWh",
            "manufacturer": "Hyundai Motors",
            "nominal_capacity_ah": 111.0,
            "nominal_voltage": 697.0,
            "chemistry": "NMC",
            "cycle_count": 1150,
            "current_soh": 76.4,
            "status": "Critical"
        },
        {
            "battery_code": "BM-CAR-304",
            "vehicle_category": "Electric cars",
            "model_name": "Tata Nexon EV Max 40.5kWh",
            "manufacturer": "Tata Motors",
            "nominal_capacity_ah": 128.0,
            "nominal_voltage": 320.0,
            "chemistry": "LFP",
            "cycle_count": 390,
            "current_soh": 93.0,
            "status": "Normal"
        },
        # Electric Buses
        {
            "battery_code": "BM-BUS-401",
            "vehicle_category": "Electric buses",
            "model_name": "Proterra Catalyst E2 440kWh",
            "manufacturer": "Proterra",
            "nominal_capacity_ah": 650.0,
            "nominal_voltage": 680.0,
            "chemistry": "NMC",
            "cycle_count": 830,
            "current_soh": 85.9,
            "status": "Warning"
        },
        {
            "battery_code": "BM-BUS-402",
            "vehicle_category": "Electric buses",
            "model_name": "BYD K9 City Transit 324kWh",
            "manufacturer": "BYD Auto",
            "nominal_capacity_ah": 600.0,
            "nominal_voltage": 540.0,
            "chemistry": "LFP",
            "cycle_count": 1420,
            "current_soh": 89.2,
            "status": "Normal"
        },
        {
            "battery_code": "BM-BUS-403",
            "vehicle_category": "Electric buses",
            "model_name": "Olectra Greentech eBus 280kWh",
            "manufacturer": "Olectra",
            "nominal_capacity_ah": 480.0,
            "nominal_voltage": 580.0,
            "chemistry": "LFP",
            "cycle_count": 1820,
            "current_soh": 72.8,
            "status": "Critical"
        },
        # Electric Trucks
        {
            "battery_code": "BM-TRUCK-501",
            "vehicle_category": "Electric trucks",
            "model_name": "Tesla Semi MegaPack 850kWh",
            "manufacturer": "Tesla Motors",
            "nominal_capacity_ah": 850.0,
            "nominal_voltage": 1000.0,
            "chemistry": "NMC",
            "cycle_count": 380,
            "current_soh": 94.0,
            "status": "Normal"
        },
        {
            "battery_code": "BM-TRUCK-502",
            "vehicle_category": "Electric trucks",
            "model_name": "Freightliner eCascadia 438kWh",
            "manufacturer": "Daimler Truck",
            "nominal_capacity_ah": 680.0,
            "nominal_voltage": 650.0,
            "chemistry": "LFP",
            "cycle_count": 720,
            "current_soh": 91.8,
            "status": "Normal"
        },
        {
            "battery_code": "BM-TRUCK-503",
            "vehicle_category": "Electric trucks",
            "model_name": "Volvo FH Electric Hauler 540kWh",
            "manufacturer": "Volvo Group",
            "nominal_capacity_ah": 900.0,
            "nominal_voltage": 600.0,
            "chemistry": "NMC",
            "cycle_count": 910,
            "current_soh": 81.3,
            "status": "Warning"
        }
    ]

    now = datetime.utcnow()
    created_batteries = []

    for item in fleet_templates:
        bat = Battery(**item, owner_id=owner_id)
        db.add(bat)
        created_batteries.append(bat)

    db.commit()

    # Now generate realistic readings, health predictions, anomalies, and alerts for each battery
    for bat in created_batteries:
        # Generate 35 continuous sensor telemetry points over past 24 hours
        readings_list = []
        base_v = bat.nominal_voltage
        base_cap = bat.nominal_capacity_ah * (bat.current_soh / 100.0)

        # Introduce special conditions if battery is Warning or Critical
        is_warning = bat.status == "Warning"
        is_critical = bat.status == "Critical"

        for i in range(35):
            t = now - timedelta(minutes=(35 - i) * 25)
            # Simulate a driving/charging cycle pattern
            cycle_phase = np.sin(i / 4.0)
            soc = np.clip(85.0 - (i * 1.4) + (cycle_phase * 10.0), 12.0, 98.0)
            
            # Voltage fluctuates with SOC and IR drop
            v_var = (soc / 100.0 - 0.5) * (base_v * 0.12)
            noise_v = random.gauss(0, 0.4)
            reading_v = round(base_v + v_var + noise_v, 2)

            # Current: discharge is positive, charge is negative
            current_amp = round((cycle_phase * 45.0) + random.gauss(15.0, 8.0), 2)
            
            # Temperature
            ambient_temp = 28.0
            heat_gen = abs(current_amp) * 0.12
            temp = ambient_temp + heat_gen + random.gauss(0, 1.2)
            
            # Inject an anomaly reading in warning or critical packs
            is_anomaly = False
            if (is_warning and i == 22) or (is_critical and i in [15, 29]):
                is_anomaly = True
                temp += 21.0 # High thermal excursion (49°C - 58°C)
                reading_v -= (base_v * 0.18) # Severe voltage sag

            remaining_ah = round(base_cap * (soc / 100.0), 2)

            reading = BatteryReading(
                battery_id=bat.id,
                timestamp=t,
                voltage=reading_v,
                current=current_amp,
                temperature=round(temp, 2),
                soc=round(soc, 1),
                capacity_remaining_ah=remaining_ah,
                cycle_index=bat.cycle_count,
                is_anomaly=is_anomaly
            )
            db.add(reading)
            readings_list.append({
                "voltage": reading_v,
                "current": current_amp,
                "temperature": round(temp, 2),
                "soc": round(soc, 1),
                "capacity_remaining_ah": remaining_ah,
                "timestamp": str(t)
            })

        db.commit()

        # Generate Health Prediction
        forecast_res = ai_engine.forecast_degradation(bat.cycle_count, bat.current_soh, bat.chemistry)
        prediction = HealthPrediction(
            battery_id=bat.id,
            timestamp=now,
            estimated_soh=bat.current_soh,
            confidence_score=0.96 if bat.status == "Normal" else 0.88,
            predicted_eol_cycles=forecast_res["predicted_eol_cycle"],
            degradation_rate_pct_per_100cycles=forecast_res["degradation_rate_per_100_cycles"],
            feature_importance_json=json.dumps({
                "thermal_stress": 0.32,
                "c_rate_wear": 0.28,
                "cycle_strain": 0.25,
                "dod_depth": 0.15
            })
        )
        db.add(prediction)

        # Generate Anomaly Records if any
        if is_warning:
            db.add(AnomalyRecord(
                battery_id=bat.id,
                timestamp=now - timedelta(hours=3),
                anomaly_score=0.82,
                anomaly_type="Thermal Excursion",
                severity="Warning",
                explanation=f"Transient module thermal elevation detected (50.4°C) during sustained 1.4C discharge climb."
            ))
            db.add(Alert(
                battery_id=bat.id,
                alert_type="High Temperature Warning",
                severity="Warning",
                message=f"Pack temperature reached 50.4°C, surpassing standard advisory limits. Cooling boost engaged.",
                status="Active",
                timestamp=now - timedelta(hours=3)
            ))

        if is_critical:
            db.add(AnomalyRecord(
                battery_id=bat.id,
                timestamp=now - timedelta(hours=1),
                anomaly_score=0.94,
                anomaly_type="Severe Voltage Sag & Degradation Knee",
                severity="Critical",
                explanation=f"Critical capacity loss with sharp cell string voltage drop under 100A load. SOH is at {bat.current_soh}%."
            ))
            db.add(Alert(
                battery_id=bat.id,
                alert_type="Critical SOH & Cell Imbalance",
                severity="Critical",
                message=f"Battery {bat.battery_code} SOH dropped to {bat.current_soh}%. End of Life (EOL) safety threshold reached. Urgent inspection required.",
                status="Active",
                timestamp=now - timedelta(hours=1)
            ))
            db.add(Alert(
                battery_id=bat.id,
                alert_type="Thermal Runaway Risk Alert",
                severity="Critical",
                message=f"Multiple thermal spike events recorded above 54°C. BMS throttling recommended.",
                status="Active",
                timestamp=now - timedelta(hours=5)
            ))

    # Add a recorded dataset entry
    db.add(UploadedDataset(
        filename="ev_fleet_benchmark_telemetry_2026.csv",
        owner_id=owner_id,
        row_count=560,
        status="Processed",
        uploaded_at=now - timedelta(days=2),
        summary_notes="Standard multi-category fleet telemetry including 16 distinct EV packs with synchronized BMS stream."
    ))

    db.commit()
    print("Database successfully seeded!")
