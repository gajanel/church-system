from pydantic import BaseModel
from datetime import date
from typing import Optional

class OfferingCreate(BaseModel):

    member_id: int
    offering_type_id: int
    amount: float
    date: Optional[date] = None