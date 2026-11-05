# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

from sqlalchemy import Column, Integer, String, Date, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.connection import Base

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    service_type = Column(String(100), nullable=False) # e.g., "Culto General", "Culto de Jóvenes"
    
    # Counts
    men = Column(Integer, default=0)
    women = Column(Integer, default=0)
    youth = Column(Integer, default=0)
    children = Column(Integer, default=0)
    teens = Column(Integer, default=0)
    seniors = Column(Integer, default=0)
    visitors = Column(Integer, default=0)
    converts = Column(Integer, default=0)
    
    total = Column(Integer, default=0)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    records = relationship("AttendanceRecord", back_populates="attendance", cascade="all, delete-orphan")

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    attendance_id = Column(Integer, ForeignKey("attendance.id", ondelete="CASCADE"), nullable=False)
    member_id = Column(Integer, ForeignKey("members.id", ondelete="SET NULL"), nullable=True)
    
    person_type = Column(String(50), nullable=False) # Miembro, Visitante, Adherente, Convertido
    person_name = Column(String(150), nullable=True) # Used for visitors/adherents
    is_convert = Column(Boolean, default=False)
    gender = Column(String(20), nullable=True)
    age_group = Column(String(20), nullable=True)
    ministry_ids = Column(String(200), default="[]")
    
    # Relationships
    attendance = relationship("Attendance", back_populates="records")
    member = relationship("Member")
