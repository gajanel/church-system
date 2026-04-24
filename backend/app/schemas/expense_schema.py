from pydantic import BaseModel
from datetime import date
from typing import Optional

class ExpenseCreate(BaseModel):

    description: str
    amount: float
    date: Optional[date] = None