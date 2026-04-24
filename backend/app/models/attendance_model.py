from sqlalchemy import Column, Integer, String, Date, DateTime, Text
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
    visitors = Column(Integer, default=0)
    converts = Column(Integer, default=0)
    
    total = Column(Integer, default=0)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
