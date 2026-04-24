from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    event_type: Optional[str] = "General"
    status: Optional[str] = "Programado"
    start_datetime: datetime
    end_datetime: Optional[datetime] = None
    all_day: Optional[bool] = False
    recurrent: Optional[bool] = False


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    event_type: Optional[str] = None
    status: Optional[str] = None
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    all_day: Optional[bool] = None
    recurrent: Optional[bool] = None


class EventResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    event_type: str
    status: str
    start_datetime: datetime
    end_datetime: Optional[datetime] = None
    all_day: bool
    recurrent: bool
    created_at: datetime

    class Config:
        from_attributes = True
