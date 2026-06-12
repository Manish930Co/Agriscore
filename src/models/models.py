import enum
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, DateTime, Enum, ForeignKey, Boolean
)
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()

class Role(str, enum.Enum):
    FARMER = "FARMER"
    ADMIN = "ADMIN"

class OwnershipType(str, enum.Enum):
    OWNED = "OWNED"
    LEASED = "LEASED"
    SHARED = "SHARED"

class KYCStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class LoanStatus(str, enum.Enum):
    PENDING = "PENDING"
    OFFERED = "OFFERED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    DISBURSED = "DISBURSED"

class Severity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(Role), default=Role.FARMER, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    farmer = relationship("Farmer", back_populates="user", uselist=False, cascade="all, delete-orphan")


class Farmer(Base):
    __tablename__ = "farmers"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    full_name = Column(String, nullable=False)
    mobile = Column(String, nullable=False)
    dob = Column(DateTime, nullable=False)
    gender = Column(String, nullable=False)
    address = Column(String, nullable=False)
    village = Column(String, nullable=False)
    district = Column(String, nullable=False)
    state = Column(String, nullable=False)
    gps_lat = Column(Float, nullable=True)
    gps_lon = Column(Float, nullable=True)
    kyc_id_type = Column(String, nullable=False)
    kyc_id_number = Column(String, unique=True, nullable=False)
    kyc_status = Column(Enum(KYCStatus), default=KYCStatus.PENDING, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="farmer")
    farm_details = relationship("FarmDetails", back_populates="farmer", uselist=False, cascade="all, delete-orphan")
    crop_images = relationship("CropImage", back_populates="farmer", cascade="all, delete-orphan")
    credit_scores = relationship("CreditScore", back_populates="farmer", cascade="all, delete-orphan")
    loan_applications = relationship("LoanApplication", back_populates="farmer", cascade="all, delete-orphan")


class FarmDetails(Base):
    __tablename__ = "farm_details"

    id = Column(String, primary_key=True, index=True)
    farmer_id = Column(String, ForeignKey("farmers.id", ondelete="CASCADE"), unique=True, nullable=False)
    size_acres = Column(Float, nullable=False)
    ownership_type = Column(Enum(OwnershipType), nullable=False)
    crop_type = Column(String, nullable=False)
    sowing_date = Column(DateTime, nullable=False)
    harvest_date = Column(DateTime, nullable=False)
    soil_type = Column(String, nullable=False)
    irrigation_type = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    farmer = relationship("Farmer", back_populates="farm_details")


class CropImage(Base):
    __tablename__ = "crop_images"

    id = Column(String, primary_key=True, index=True)
    farmer_id = Column(String, ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False)
    image_url = Column(String, nullable=False)
    disease_detected = Column(String, nullable=False)
    confidence_score = Column(Float, nullable=False)
    severity = Column(Enum(Severity), nullable=False)
    treatment_recommendation = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    farmer = relationship("Farmer", back_populates="crop_images")


class CreditScore(Base):
    __tablename__ = "credit_scores"

    id = Column(String, primary_key=True, index=True)
    farmer_id = Column(String, ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False)
    score = Column(Integer, nullable=False)  # 0 to 100
    grade = Column(String, nullable=False)  # e.g., "A+"
    risk_rating = Column(String, nullable=False)  # "LOW", "MEDIUM", "HIGH"
    crop_health_score = Column(Float, nullable=False)
    yield_stability_score = Column(Float, nullable=False)
    climate_risk_score = Column(Float, nullable=False)
    farming_practice_score = Column(Float, nullable=False)
    financial_capability_score = Column(Float, nullable=False)
    trust_verification_score = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    farmer = relationship("Farmer", back_populates="credit_scores")


class LoanApplication(Base):
    __tablename__ = "loan_applications"

    id = Column(String, primary_key=True, index=True)
    farmer_id = Column(String, ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Float, nullable=False)
    tenure_months = Column(Integer, nullable=False)
    interest_rate = Column(Float, nullable=False)
    status = Column(Enum(LoanStatus), default=LoanStatus.PENDING, nullable=False)
    emi = Column(Float, nullable=False)
    bank_name = Column(String, nullable=False)
    offered_interest_rate = Column(Float, nullable=True)
    offered_tenure_months = Column(Integer, nullable=True)
    admin_remarks = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    farmer = relationship("Farmer", back_populates="loan_applications")
