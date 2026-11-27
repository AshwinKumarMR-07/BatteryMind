from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class BatteryBase(BaseModel):
    battery_code: str
    vehicle_category: str
    model_name: str
    manufacturer: str
    nominal_capacity_ah: float
    nominal_voltage: float
    chemistry: Optional[str] = "NMC"
    cycle_count: Optional[int] = 0
    current_soh: Optional[float] = 100.0
    status: Optional[str] = "Normal"

class BatteryCreate(BatteryBase):
    pass

class BatteryResponse(BatteryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DeviceCreate(BaseModel):
    device_identifier: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=100)


class DevicePairRequest(BaseModel):
    battery_id: int = Field(gt=0)


class DeviceResponse(BaseModel):
    id: int
    device_identifier: str
    name: str
    is_active: bool
    is_revoked: bool
    pairing_status: str
    battery_id: Optional[int] = None
    registered_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ReadingBase(BaseModel):
    voltage: float
    current: float
    temperature: float
    soc: float
    capacity_remaining_ah: float
    cycle_index: Optional[int] = 0
    is_anomaly: Optional[bool] = False

class ReadingCreate(ReadingBase):
    battery_id: int
    timestamp: Optional[datetime] = None

class ReadingResponse(ReadingBase):
    id: int
    battery_id: int
    timestamp: datetime

    class Config:
        from_attributes = True

class HealthPredictionResponse(BaseModel):
    id: int
    battery_id: int
    timestamp: datetime
    estimated_soh: float
    confidence_score: float
    predicted_eol_cycles: int
    degradation_rate_pct_per_100cycles: float
    feature_importance: Optional[Dict[str, float]] = None

    class Config:
        from_attributes = True

class AnomalyRecordResponse(BaseModel):
    id: int
    battery_id: int
    reading_id: Optional[int] = None
    timestamp: datetime
    anomaly_score: float
    anomaly_type: str
    severity: str
    explanation: str

    class Config:
        from_attributes = True

class AlertBase(BaseModel):
    battery_id: int
    alert_type: str
    severity: str
    message: str
    status: Optional[str] = "Active"

class AlertCreate(AlertBase):
    pass

class AlertResponse(AlertBase):
    id: int
    timestamp: datetime
    battery_code: Optional[str] = None
    vehicle_category: Optional[str] = None

    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_batteries: int
    average_soh: float
    warning_count: int
    critical_count: int
    normal_count: int
    category_counts: Dict[str, int]
    chemistry_counts: Dict[str, int]
    fleet_health_distribution: Dict[str, int]
    average_temperature: float
    average_cycles: int

class ForecastPoint(BaseModel):
    cycle: int
    soh: float
    type: str # 'historical', 'forecast', 'eol_threshold'
    lower_bound: Optional[float] = None
    upper_bound: Optional[float] = None

class ForecastResponse(BaseModel):
    battery_id: int
    battery_code: str
    current_cycle: int
    current_soh: float
    predicted_eol_cycle: int # cycle when SOH hits 70%
    remaining_useful_cycles: int
    degradation_rate_per_100_cycles: float
    forecast_curve: List[ForecastPoint]
    model_r2_score: float

class AnomalyDetectionResult(BaseModel):
    total_readings_analyzed: int
    anomalies_detected: int
    anomaly_percentage: float
    model_method: str
    detected_anomalies: List[Dict[str, Any]]

class XAIExplanation(BaseModel):
    battery_id: int
    battery_code: str
    estimated_soh: float
    nominal_capacity_ah: float
    measured_capacity_ah: float
    capacity_ratio_soh: float
    ml_estimated_soh: float
    factors: List[Dict[str, Any]]
    recommendations: List[str]
    summary: str


class LoginRequest(BaseModel):
    username: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=8, max_length=255)


class RegistrationRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=200)
    username: str = Field(min_length=3, max_length=100)
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=8, max_length=72)
    confirm_password: str = Field(min_length=8, max_length=72)


class UserResponse(BaseModel):
    id: int
    username: str
    full_name: str
    email: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=100)
    full_name: str = Field(min_length=2, max_length=200)
    email: Optional[str] = Field(default=None, min_length=5, max_length=255)
    password: str = Field(min_length=8, max_length=255)
    role: str = Field(pattern="^(Admin|Operator|Viewer)$")


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=200)
    email: Optional[str] = Field(default=None, min_length=5, max_length=255)
    role: Optional[str] = Field(default=None, pattern="^(Admin|Operator|Viewer)$")
    is_active: Optional[bool] = None


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=200)
    email: Optional[str] = Field(default=None, min_length=5, max_length=255)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=8, max_length=72)
    new_password: str = Field(min_length=8, max_length=72)
    confirm_new_password: str = Field(min_length=8, max_length=72)
