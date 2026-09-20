# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

from pydantic import BaseModel, Field, field_validator, model_validator
from datetime import date, datetime
from typing import Optional, List
import json

class AttendanceRecordBase(BaseModel):
    member_id: Optional[int] = None
    person_type: str
    person_name: Optional[str] = None
    is_convert: bool = False
    gender: Optional[str] = None
    age_group: Optional[str] = None

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, value):
        if value is None:
            return None
        normalized = value.strip().lower()
        aliases = {
            "m": "Masculino", "masculino": "Masculino", "hombre": "Masculino",
            "f": "Femenino", "femenino": "Femenino", "mujer": "Femenino",
        }
        if normalized not in aliases:
            raise ValueError("Género inválido")
        return aliases[normalized]

    @field_validator("age_group")
    @classmethod
    def validate_age_group(cls, value):
        if value is None:
            return None
        normalized = value.strip().lower()
        aliases = {
            "adult": "Adulto", "adulto": "Adulto",
            "youth": "Joven", "joven": "Joven",
            "child": "Niño", "niño": "Niño", "nino": "Niño",
            "teen": "Adolescente", "teenager": "Adolescente", "adolescente": "Adolescente",
            "senior": "Adulto Mayor", "adulto mayor": "Adulto Mayor",
        }
        if normalized not in aliases:
            raise ValueError("Grupo de edad inválido")
        return aliases[normalized]

class AttendanceRecordCreate(AttendanceRecordBase):
    pass

class AttendanceRecordResponse(AttendanceRecordBase):
    id: int
    attendance_id: int
    ministry_ids: List[int] = Field(default_factory=list)

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
    teens: int = 0
    seniors: int = 0
    visitors: int = 0
    converts: int = 0
    notes: Optional[str] = None

class AttendanceCreate(AttendanceBase):
    records: List[AttendanceRecordCreate] = Field(default_factory=list)

class AttendanceUpdate(BaseModel):
    date: Optional[date] = None
    service_type: Optional[str] = None
    notes: Optional[str] = None
    records: Optional[List[AttendanceRecordCreate]] = None

class AttendanceResponse(AttendanceBase):
    id: int
    total: int
    created_at: datetime
    records: List[AttendanceRecordResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True
