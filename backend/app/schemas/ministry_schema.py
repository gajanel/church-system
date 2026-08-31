# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

from pydantic import BaseModel
from typing import List, Optional

class MinistryCreate(BaseModel):
    name: str
    roles: List[str]
    service_day: Optional[str] = None

class MinistryUpdate(BaseModel):
    name: Optional[str] = None
    roles: Optional[List[str]] = None
    service_day: Optional[str] = None

class MinistryRoleResponse(BaseModel):
    id: int
    role: str

    class Config:
        from_attributes = True

class MinistryResponse(BaseModel):
    id: int
    name: str
    service_day: Optional[str] = None
    roles: List[MinistryRoleResponse] = []

    class Config:
        from_attributes = True

class MinistryMemberAssign(BaseModel):
    member_id: int
    ministry_role_id: int

class MinistryMemberResponse(BaseModel):
    id: int
    member_id: int
    ministry_id: int
    ministry_role_id: int
    member_name: str
    
    class Config:
        from_attributes = True