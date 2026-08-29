# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


class PrivilegeTypeBase(BaseModel):
    name: str
    category: str
    description: Optional[str] = None
    ignore_ministry_day: bool = False

class PrivilegeTypeCreate(PrivilegeTypeBase):
    pass

class PrivilegeTypeUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    ignore_ministry_day: Optional[bool] = None

class PrivilegeTypeResponse(PrivilegeTypeBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True


class PrivilegeProfileCreate(BaseModel):
    member_id: int
    privilege: str

class PrivilegeProfileResponse(BaseModel):
    id: int
    member_id: int
    privilege: str
    created_at: datetime
    class Config:
        from_attributes = True


class ScheduleEntryManual(BaseModel):
    week_start: date
    day_name: str
    privilege: str
    member_id: Optional[int] = None
    notes: Optional[str] = None

class ScheduleEntryResponse(BaseModel):
    id: int
    week_start: date
    day_name: str
    privilege: str
    member_id: Optional[int]
    notes: Optional[str]
    member_name: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True
class AutoGenerateRequest(BaseModel):
    week_start: date
    days: Optional[list[str]] = None

class ServiceDayConfigBase(BaseModel):
    day_name: str
    is_general: bool

class ServiceDayConfigUpdate(BaseModel):
    is_general: bool

class ServiceDayConfigResponse(ServiceDayConfigBase):
    class Config:
        from_attributes = True
