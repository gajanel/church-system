# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

from pydantic import BaseModel
from datetime import date
from typing import Optional

class ExpenseCreate(BaseModel):

    description: str
    amount: float
    date: Optional[date] = None