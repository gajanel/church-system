# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

from pydantic import BaseModel, field_validator
from datetime import date, datetime
from typing import Optional


def normalize_member_gender(value):
    normalized = (value or "").strip().lower()
    if normalized in {"m", "masculino", "hombre"}:
        return "Masculino"
    if normalized in {"f", "femenino", "mujer"}:
        return "Femenino"
    if not normalized:
        return None
    raise ValueError("El género debe ser Masculino o Femenino")

class MemberCreate(BaseModel):
    first_name: str
    last_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    birth_date: date
    baptism_date: Optional[date] = None
    status: Optional[str] = "active"
    photo_url: Optional[str] = None
    
    gender: str
    marital_status: Optional[str] = None
    occupation: Optional[str] = None
    join_date: Optional[date] = None
    emergency_contact: Optional[str] = None
    church_role: Optional[str] = None

    @field_validator("gender", mode="before")
    @classmethod
    def validate_gender(cls, value):
        normalized = normalize_member_gender(value)
        if normalized is None:
            raise ValueError("El género es obligatorio")
        return normalized

class MemberUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    birth_date: Optional[date] = None
    baptism_date: Optional[date] = None
    status: Optional[str] = None
    photo_url: Optional[str] = None
    
    gender: Optional[str] = None
    marital_status: Optional[str] = None
    occupation: Optional[str] = None
    join_date: Optional[date] = None
    emergency_contact: Optional[str] = None
    church_role: Optional[str] = None

    @field_validator("gender", mode="before")
    @classmethod
    def validate_gender(cls, value):
        return normalize_member_gender(value)

class MemberResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    phone: Optional[str]
    email: Optional[str]
    address: Optional[str]
    birth_date: Optional[date]
    baptism_date: Optional[date]
    status: str
    photo_url: Optional[str] = None
    
    gender: Optional[str]
    marital_status: Optional[str]
    occupation: Optional[str]
    join_date: Optional[date]
    emergency_contact: Optional[str]
    church_role: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class MemberPaginatedResponse(BaseModel):
    items: list[MemberResponse]
    total: int
    page: int
    size: int
    pages: int
