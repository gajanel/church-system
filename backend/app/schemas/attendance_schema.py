# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

from pydantic import BaseModel, model_validator
from datetime import date, datetime
from typing import Optional, List
import json

class AttendanceRecordBase(BaseModel):
    member_id: Optional[int] = None
    person_type: str
    person_name: Optional[str] = None
    is_convert: bool = False

class AttendanceRecordCreate(AttendanceRecordBase):
    pass

class AttendanceRecordResponse(AttendanceRecordBase):
    id: int
    attendance_id: int
    ministry_ids: List[int] = []

    @model_validator(mode="before")
    @classmethod
    def parse_ministry_ids(cls, data):
        # Si data es un objeto SQLAlchemy, se accede como atributo
        if hasattr(data, 'ministry_ids') and isinstance(data.ministry_ids, str):
            try:
                data.ministry_ids = json.loads(data.ministry_ids)
            except:
                data.ministry_ids = []
        return data

    class Config:
        from_attributes = True

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
    records: List[AttendanceRecordCreate] = []

class AttendanceUpdate(BaseModel):
    date: Optional[date] = None
    service_type: Optional[str] = None
    notes: Optional[str] = None
    records: Optional[List[AttendanceRecordCreate]] = None

class AttendanceResponse(AttendanceBase):
    id: int
    total: int
    created_at: datetime
    records: List[AttendanceRecordResponse] = []

    class Config:
        from_attributes = True
