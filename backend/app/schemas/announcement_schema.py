from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    is_active: bool = True

class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    is_active: Optional[bool] = None

class AnnouncementResponse(BaseModel):
    id: int
    title: str
    content: str
    is_active: bool
    is_published: bool
    created_at: datetime

    class Config:
        from_attributes = True
