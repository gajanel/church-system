# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

from pydantic import BaseModel
from typing import Optional
from datetime import date


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    status: Optional[str] = "Activo"
    budget: float = 0.0
    contributions: float = 0.0
    spent: float = 0.0
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    budget: Optional[float] = None
    contributions: Optional[float] = None
    spent: Optional[float] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    status: str
    budget: float
    contributions: float
    spent: float
    start_date: Optional[date] = None
    end_date: Optional[date] = None

    class Config:
        from_attributes = True
