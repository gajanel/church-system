from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.connection import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String(200), nullable=True)
    event_type = Column(String(50), nullable=False, default="General")  # Culto, Reunión, Especial, Aniversario, Conferencia, General
    status = Column(String(50), nullable=False, default="Programado")   # Programado, En Curso, Completado, Cancelado
    start_datetime = Column(DateTime, nullable=False)
    end_datetime = Column(DateTime, nullable=True)
    all_day = Column(Boolean, default=False)
    recurrent = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
