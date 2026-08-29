# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SettingsBase(BaseModel):
    church_name: str = "Mi Iglesia"
    church_address: Optional[str] = None
    church_logo_url: Optional[str] = None
    currency_symbol: str = "Q"
    monthly_expense_goal: float = 0.0
    bible_verse: Optional[str] = None
    
    # Brand Customization
    primary_color: str = "#1e3a8a"
    secondary_color: str = "#3b82f6"
    font_family: str = "'Inter', sans-serif"
    app_language: str = "es"
    is_initialized: int = 0

class SettingsUpdate(BaseModel):
    church_name: Optional[str] = None
    church_address: Optional[str] = None
    church_logo_url: Optional[str] = None
    currency_symbol: Optional[str] = None
    monthly_expense_goal: Optional[float] = None
    bible_verse: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    font_family: Optional[str] = None
    app_language: Optional[str] = None
    is_initialized: Optional[int] = None

class SettingsResponse(SettingsBase):
    id: int
    updated_at: datetime

    class Config:
        from_attributes = True
