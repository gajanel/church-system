# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

import re

from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, List


def validate_password_strength(value: str):
    if len(value) < 8:
        raise ValueError("Debe tener al menos 8 caracteres")
    if not re.search(r"[A-Z]", value):
        raise ValueError("Debe contener al menos una mayúscula")
    if not re.search(r"[a-z]", value):
        raise ValueError("Debe contener al menos una minúscula")
    if not re.search(r"\d", value):
        raise ValueError("Debe contener al menos un número")
    if not re.search(r"[\W_]", value):
        raise ValueError("Debe contener al menos un carácter especial")
    return value


def normalize_required_text(value: str, label: str):
    normalized = (value or "").strip()
    if not normalized:
        raise ValueError(f"{label} es obligatorio")
    return normalized

class UserCreate(BaseModel):
    name: str
    username: str
    email: str
    password: str
    is_admin: bool = False
    is_super_admin: bool = False
    modules: List[str] = Field(default_factory=list)
    member_id: Optional[int] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value):
        return normalize_required_text(value, "El nombre")

    @field_validator("username")
    @classmethod
    def validate_username(cls, value):
        normalized = normalize_required_text(value, "El usuario").lower()
        if not re.fullmatch(r"[a-z0-9._-]{3,40}", normalized):
            raise ValueError("Usa de 3 a 40 letras, números, puntos, guiones o guiones bajos")
        return normalized

    @field_validator("email")
    @classmethod
    def validate_email(cls, value):
        normalized = normalize_required_text(value, "El correo").lower()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", normalized):
            raise ValueError("El correo electrónico no es válido")
        return normalized

    @field_validator("password")
    @classmethod
    def validate_password(cls, value):
        return validate_password_strength(value)

    @model_validator(mode="after")
    def normalize_access(self):
        if self.is_super_admin:
            self.is_admin = True
        if self.is_admin:
            self.modules = []
        return self

class UserUpdate(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    is_admin: Optional[bool] = None
    is_super_admin: Optional[bool] = None
    modules: Optional[List[str]] = None
    is_active: Optional[bool] = None
    member_id: Optional[int] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value):
        return normalize_required_text(value, "El nombre") if value is not None else None

    @field_validator("username")
    @classmethod
    def validate_username(cls, value):
        if value is None:
            return None
        normalized = normalize_required_text(value, "El usuario").lower()
        if not re.fullmatch(r"[a-z0-9._-]{3,40}", normalized):
            raise ValueError("Usa de 3 a 40 letras, números, puntos, guiones o guiones bajos")
        return normalized

    @field_validator("email")
    @classmethod
    def validate_email(cls, value):
        if value is None:
            return None
        normalized = normalize_required_text(value, "El correo").lower()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", normalized):
            raise ValueError("El correo electrónico no es válido")
        return normalized

    @field_validator("password")
    @classmethod
    def validate_password(cls, value):
        if value in (None, ""):
            return None
        return validate_password_strength(value)

    @model_validator(mode="after")
    def normalize_access(self):
        if self.is_super_admin is True:
            self.is_admin = True
        if self.is_admin is True:
            self.modules = []
        return self

class UserResponse(BaseModel):
    id: int
    name: str
    username: str
    email: str
    is_admin: bool
    is_super_admin: bool
    modules: List[str]
    must_change_password: bool
    is_active: bool = True
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
        return validate_password_strength(v)

class TokenRefreshRequest(BaseModel):
    refresh_token: str
