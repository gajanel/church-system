# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

class AttendanceBase(BaseModel):
    date: date
    service_type: str
    men: int = 0
    women: int = 0
    youth: int = 0
    children: int = 0
    visitors: int = 0
    converts: int = 0
    notes: Optional[str] = None

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceUpdate(BaseModel):
    date: Optional[date] = None
    service_type: Optional[str] = None
    men: Optional[int] = None
    women: Optional[int] = None
    youth: Optional[int] = None
    children: Optional[int] = None
    visitors: Optional[int] = None
    converts: Optional[int] = None
    notes: Optional[str] = None

class AttendanceResponse(AttendanceBase):
    id: int
    total: int
    created_at: datetime

    class Config:
        from_attributes = True
