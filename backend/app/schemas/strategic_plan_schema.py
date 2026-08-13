from pydantic import BaseModel
from typing import Dict, Any, Optional

class StrategicPlanAreaBase(BaseModel):
    area_id: int
    name: str
    responsible: str
    indicators: Dict[str, Any]
    commitments: Dict[str, str]

class StrategicPlanAreaUpdate(BaseModel):
    indicators: Optional[Dict[str, Any]] = None
    commitments: Optional[Dict[str, str]] = None

class StrategicPlanAreaResponse(BaseModel):
    id: int
    area_id: int
    name: str
    responsible: str
    indicators: Dict[str, Any]
    commitments: Dict[str, str]

    class Config:
        from_attributes = True
