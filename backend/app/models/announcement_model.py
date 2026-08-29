# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
from app.database.connection import Base

class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(String(1000), nullable=False)
    is_active = Column(Boolean, default=True)      # Active un system (for CRUD)
    is_published = Column(Boolean, default=False)  # Being projected right now
    created_at = Column(DateTime, default=datetime.utcnow)
