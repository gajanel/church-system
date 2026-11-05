# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.connection import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="Activo")  # Activo, Pausado, Completado, Cancelado
    budget = Column(Float, nullable=False, default=0.0)
    contributions = Column(Float, nullable=False, default=0.0)
    spent = Column(Float, nullable=False, default=0.0)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
