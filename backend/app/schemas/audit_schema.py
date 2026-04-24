from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any, Dict

class AuditLogBase(BaseModel):
    action: str
    module: str
    description: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None

class AuditLogCreate(AuditLogBase):
    user_id: Optional[int] = None

class AuditLog(AuditLogBase):
    id: int
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
