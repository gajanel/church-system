# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

class MemberCreate(BaseModel):
    first_name: str
    last_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    birth_date: Optional[date] = None
    baptism_date: Optional[date] = None
    status: Optional[str] = "active"
    photo_url: Optional[str] = None
    
    gender: Optional[str] = None
    marital_status: Optional[str] = None
    occupation: Optional[str] = None
    join_date: Optional[date] = None
    emergency_contact: Optional[str] = None
    church_role: Optional[str] = None

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