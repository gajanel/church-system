# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

from pydantic import BaseModel

class MemberMinistryAssign(BaseModel):
    ministry_id: int
    ministry_role_id: int

class MemberMinistryResponse(BaseModel):
    id: int
    ministry_id: int
    ministry_name: str
    role: str

    class Config:
        from_attributes = True