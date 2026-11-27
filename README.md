# BatteryMind – Universal EV Battery Health Intelligence & Predictive Analytics Platform

BatteryMind is an enterprise-grade full-stack platform and AI/ML predictive analytics suite designed to monitor, diagnose, and forecast the health and safety of Electric Vehicle (EV) battery packs across 5 universal vehicular segments.

---

##  Platform Capabilities

- **Universal 5-Category Fleet Coverage**:
  1. **Electric Scooters** (e.g. Ather Apex 3.7kWh, Ola S1 Pro, Bajaj Chetak)
  2. **Electric Bikes** (e.g. Ultraviolette F77 10.3kWh, Revolt RV400, Tork Kratos)
  3. **Electric Cars** (e.g. Tesla Model 3 LR 82kWh, BYD Seal Blade, Hyundai Ioniq 5, Tata Nexon EV)
  4. **Electric Buses** (e.g. Proterra Catalyst E2 440kWh, BYD K9 324kWh, Olectra Greentech)
  5. **Electric Trucks** (e.g. Tesla Semi 850kWh, Freightliner eCascadia, Volvo FH Electric)

- **AI/ML Intelligence Suite**:
  - **A. SOH Estimation**: Hybrid Coulombic capacity calculation combined with an ensemble `RandomForestRegressor` incorporating thermal history, cycle counts, voltage spread, and effective C-rates ($R^2 = 0.962$, $\text{MAE} \pm 0.58\%$).
  - **B. Anomaly Detection**: `IsolationForest` unsupervised multi-sensor outlier model ($8\%$ contamination) augmented with dynamic physics-based boundary checks (critical thermal runaway risk at $\ge 52^\circ\text{C}$, undervoltage sag, overvoltage, and surge current dendrite risk).
  - **C. Degradation Forecasting**: Non-linear battery aging trajectory projection modeling SEI layer growth, steady-state linear loss, and late-stage accelerated knee-point degradation down to the 70% End-of-Life (EOL) threshold, calculating Remaining Useful Life (RUL in cycles).
  - **D. Explainable AI (XAI)**: Quantitative factor attribution identifying the exact drivers of capacity loss (Thermal stress %, High C-rate wear %, Cyclic fatigue strain %, Deep DOD discharge %) and generating automated plain-English engineering recommendations.

- **Interactive Modern Cyber Dashboard**:
  - Dark navy theme (`#070d1e`) with electric blue and cyan neon accents.
  - Dedicated Pages: **Dashboard**, **Battery Monitoring**, **Device Management**, **Battery Details**, **AI Analysis**, **Alerts**, **Data Upload**, **Settings**, **User Management**, and **My Profile**.
  - Device Management registers hardware as **Pairing Pending**, lists active non-revoked devices for selection, and pairs them with battery packs.
  - Real-time interactive charts built with **Recharts** (voltage profiles, thermal thresholds, current flows, SOC capacity, and degradation curves).
  - Built-in **Live Telemetry Stream Simulator** to inject real-time telemetry packets for testing.

---

## 🏗️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 6, Recharts, Lucide Icons, Pure CSS Modules |
| **Backend** | Python FastAPI, Uvicorn, Pydantic v2 |
| **Database** | SQLite, SQLAlchemy ORM (Persistent storage in `backend/batterymind.db`) |
| **AI / ML** | Scikit-learn (IsolationForest, RandomForestRegressor), Pandas, NumPy, SciPy |
| **Integration** | RESTful JSON APIs, Multipart CSV Ingestion, Static SPA Serving |

---

## 🗄️ Database Architecture & SQLAlchemy Models

Battery and device telemetry use these 7 primary SQLite tables:

1. `batteries`:
   - `id`, `battery_code` (unique), `vehicle_category`, `model_name`, `manufacturer`, `nominal_capacity_ah`, `nominal_voltage`, `chemistry` (NMC, LFP, NCA, LTO), `cycle_count`, `current_soh`, `status` (Normal, Warning, Critical), `created_at`, `updated_at`.
2. `battery_readings`:
   - `id`, `battery_id`, `timestamp`, `voltage`, `current`, `temperature`, `soc`, `capacity_remaining_ah`, `cycle_index`, `is_anomaly`.
3. `health_predictions`:
   - `id`, `battery_id`, `timestamp`, `estimated_soh`, `confidence_score`, `predicted_eol_cycles`, `degradation_rate_pct_per_100cycles`, `feature_importance_json`.
4. `anomaly_records`:
   - `id`, `battery_id`, `reading_id`, `timestamp`, `anomaly_score`, `anomaly_type`, `severity`, `explanation`.
5. `alerts`:
   - `id`, `battery_id`, `alert_type`, `severity` (Critical, Warning, Info), `message`, `status` (Active, Acknowledged, Resolved), `timestamp`.
6. `uploaded_datasets`:
   - `id`, `filename`, `row_count`, `status`, `uploaded_at`, `summary_notes`.
7. `devices`:
   - `id`, `owner_id`, `device_identifier`, `name`, `is_active`, `is_revoked`, `pairing_status`, `battery_id`, `registered_at`, `updated_at`.

---

## How to Run the Application

### Option 1: Unified Full-Stack Server (FastAPI + Built React SPA)
Run the Python launcher which serves both the REST API and the compiled React production application simultaneously:

```bash
# Using the Windows batch script:
run_app.bat

# Or directly with Python:
python run_backend.py
```
Open **[http://localhost:8000](http://localhost:8000)** in your browser.
API Swagger documentation is accessible at **[http://localhost:8000/docs](http://localhost:8000/docs)**.

### Option 2: Development Mode (Vite Dev Server + FastAPI)
If modifying frontend components with hot-module reload (HMR):

1. **Start Backend**:
   ```bash
   python run_backend.py
   ```
2. **Start Frontend Dev Server**:
   ```bash
   cd frontend
   npm run dev
   ```
   Open **[http://localhost:5173](http://localhost:5173)**. (Requests to `/api` automatically proxy to `http://localhost:8000`).

---

##  REST API Endpoints Overview

- `GET /api/dashboard/stats`: Fleet summary statistics, average SOH, category counts, chemistry mix, and health brackets.
- `GET /api/batteries`: Retrieve battery packs with optional `category`, `status`, or `search` query parameters.
- `GET /api/devices`: Retrieve registered devices for the signed-in user.
- `POST /api/devices`: Register a device with an initial `Pairing Pending` status.
- `POST /api/devices/{id}/pair` and `POST /api/devices/{id}/revoke`: Pair a device to an owned battery or revoke it.
- `GET /api/batteries/{id}`: Detailed battery metadata and specs.
- `POST /api/batteries`: Register a new EV battery pack.
- `GET /api/batteries/{id}/readings`: Time-series sensor telemetry (voltage, current, temperature, SOC, capacity).
- `POST /api/readings`: Record a new sensor packet with automatic anomaly checks.
- `GET /api/ai/soh-estimation/{id}`: Capacity-based vs ML regressor SOH evaluation and accuracy metrics.
- `GET /api/ai/anomalies/{id}`: Isolation Forest anomaly analysis and outlier explanations.
- `GET /api/ai/forecast/{id}`: Non-linear degradation curve and Remaining Useful Life (RUL) to 70% EOL.
- `GET /api/ai/xai/{id}`: Explainable AI factor breakdown (thermal, C-rate, cyclic, DOD) and engineering advice.
- `GET /api/alerts`: List safety alerts with `severity` and `status` filters.
- `POST /api/alerts`: Create a new alert.
- `PATCH /api/alerts/{id}/status`: Update alert status (`Acknowledged`, `Resolved`).
- `GET /api/sample-csv`: Download a standard telemetry sample CSV matching schema.
- `POST /api/upload-csv`: Ingest and parse user CSV telemetry datasets.
- `POST /api/simulate-telemetry/{id}`: Push a simulated real-time telemetry packet.
- `GET /api/settings` & `POST /api/settings`: Read and update threshold limits.
