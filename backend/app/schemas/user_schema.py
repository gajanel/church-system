from pydantic import BaseModel, Field, field_validator
from typing import Optional, List

class UserCreate(BaseModel):
    name: str
    username: str
    email: str
    password: str
    is_admin: bool = False
    is_super_admin: bool = False
    modules: List[str] = Field(default_factory=list)
    member_id: Optional[int] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    is_admin: Optional[bool] = None
    is_super_admin: Optional[bool] = None
    modules: Optional[List[str]] = None
    member_id: Optional[int] = None

class UserResponse(BaseModel):
    id: int
    name: str
    username: str
    email: str
    is_admin: bool
    is_super_admin: bool
    modules: List[str]
    must_change_password: bool
    member_id: Optional[int] = None

    class Config:
        from_attributes = True

class LoginSchema(BaseModel):
    username: str
    password: str

class PasswordChangeSchema(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, v):
        import re
        if len(v) < 8:
            raise ValueError("Debe tener al menos 8 caracteres")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Debe contener al menos una mayúscula")
        if not re.search(r"[a-z]", v):
            raise ValueError("Debe contener al menos una minúscula")
        if not re.search(r"\d", v):
            raise ValueError("Debe contener al menos un número")
        if not re.search(r"[\W_]", v):
            raise ValueError("Debe contener al menos un carácter especial")
        return v

class TokenRefreshRequest(BaseModel):
    refresh_token: str
