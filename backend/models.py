from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Battery(Base):
    __tablename__ = "batteries"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    battery_code = Column(String(50), unique=True, index=True, nullable=False)
    vehicle_category = Column(String(50), index=True, nullable=False) # 'Electric scooters', 'Electric bikes', 'Electric cars', 'Electric buses', 'Electric trucks'
    model_name = Column(String(100), nullable=False)
    manufacturer = Column(String(100), nullable=False)
    nominal_capacity_ah = Column(Float, nullable=False)
    nominal_voltage = Column(Float, nullable=False)
    chemistry = Column(String(50), default="NMC") # NMC, LFP, NCA, LTO
    cycle_count = Column(Integer, default=0)
    current_soh = Column(Float, default=100.0)
    status = Column(String(20), default="Normal") # Normal, Warning, Critical
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    readings = relationship("BatteryReading", back_populates="battery", cascade="all, delete-orphan")
    predictions = relationship("HealthPrediction", back_populates="battery", cascade="all, delete-orphan")
    anomalies = relationship("AnomalyRecord", back_populates="battery", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="battery", cascade="all, delete-orphan")
    paired_devices = relationship("Device", back_populates="paired_battery")
    owner = relationship("User", back_populates="batteries")

class BatteryReading(Base):
    __tablename__ = "battery_readings"

    id = Column(Integer, primary_key=True, index=True)
    battery_id = Column(Integer, ForeignKey("batteries.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    voltage = Column(Float, nullable=False) # Volts
    current = Column(Float, nullable=False) # Amperes
    temperature = Column(Float, nullable=False) # Celsius
    soc = Column(Float, nullable=False) # % (0 - 100)
    capacity_remaining_ah = Column(Float, nullable=False) # Ah
    cycle_index = Column(Integer, default=0)
    is_anomaly = Column(Boolean, default=False)

    battery = relationship("Battery", back_populates="readings")

class HealthPrediction(Base):
    __tablename__ = "health_predictions"

    id = Column(Integer, primary_key=True, index=True)
    battery_id = Column(Integer, ForeignKey("batteries.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    estimated_soh = Column(Float, nullable=False)
    confidence_score = Column(Float, default=0.95)
    predicted_eol_cycles = Column(Integer, nullable=False) # cycles until 70% SOH
    degradation_rate_pct_per_100cycles = Column(Float, nullable=False)
    feature_importance_json = Column(Text, nullable=True) # JSON of driving factors

    battery = relationship("Battery", back_populates="predictions")

class AnomalyRecord(Base):
    __tablename__ = "anomaly_records"

    id = Column(Integer, primary_key=True, index=True)
    battery_id = Column(Integer, ForeignKey("batteries.id"), nullable=False, index=True)
    reading_id = Column(Integer, ForeignKey("battery_readings.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    anomaly_score = Column(Float, nullable=False)
    anomaly_type = Column(String(100), nullable=False) # e.g., 'Thermal Overheat', 'Cell Voltage Imbalance', 'Current Spike'
    severity = Column(String(20), default="Warning") # Warning, Critical
    explanation = Column(Text, nullable=False)

    battery = relationship("Battery", back_populates="anomalies")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    battery_id = Column(Integer, ForeignKey("batteries.id"), nullable=False, index=True)
    alert_type = Column(String(100), nullable=False)
    severity = Column(String(20), default="Warning") # Info, Warning, Critical
    message = Column(Text, nullable=False)
    status = Column(String(20), default="Active") # Active, Acknowledged, Resolved
    timestamp = Column(DateTime, default=datetime.utcnow)

    battery = relationship("Battery", back_populates="alerts")

class UploadedDataset(Base):
    __tablename__ = "uploaded_datasets"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    row_count = Column(Integer, default=0)
    status = Column(String(50), default="Processed")
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    summary_notes = Column(Text, nullable=True)
    owner = relationship("User", back_populates="uploaded_datasets")


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    device_identifier = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    is_revoked = Column(Boolean, nullable=False, default=False)
    pairing_status = Column(String(30), nullable=False, default="Pairing Pending")
    battery_id = Column(Integer, ForeignKey("batteries.id"), nullable=True)
    registered_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    owner = relationship("User", back_populates="devices")
    paired_battery = relationship("Battery", back_populates="paired_devices")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(200), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="Viewer")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    batteries = relationship("Battery", back_populates="owner", cascade="all, delete-orphan")
    uploaded_datasets = relationship("UploadedDataset", back_populates="owner", cascade="all, delete-orphan")
    devices = relationship("Device", back_populates="owner", cascade="all, delete-orphan")


class PlatformSetting(Base):
    __tablename__ = "platform_settings"

    id = Column(Integer, primary_key=True)
    key = Column(String(100), unique=True, nullable=False, index=True)
    value_json = Column(Text, nullable=False)
