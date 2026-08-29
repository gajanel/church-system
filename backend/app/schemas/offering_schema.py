# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

from pydantic import BaseModel
from datetime import date
from typing import Optional

class OfferingCreate(BaseModel):

    member_id: int
    offering_type_id: int
    amount: float
    date: Optional[date] = None