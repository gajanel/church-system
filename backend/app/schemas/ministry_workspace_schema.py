# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

"""
Ministry Workspace — Pydantic Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ═══════════════════════════════════════════════
#  MODULE CONFIG
# ═══════════════════════════════════════════════
class ModuleConfigOut(BaseModel):
    ministry_id:    int
    finance:        bool
    attendance:     bool
    work_plans:     bool
    gallery:        bool
    monthly_report: bool = True
    updated_at:     Optional[datetime] = None

    class Config:
        from_attributes = True


class ModuleConfigUpdate(BaseModel):
    finance:        Optional[bool] = None
    attendance:     Optional[bool] = None
    work_plans:     Optional[bool] = None
    gallery:        Optional[bool] = None
    monthly_report: Optional[bool] = None


# ═══════════════════════════════════════════════
#  FINANCE
# ═══════════════════════════════════════════════
class FinanceRecordIn(BaseModel):
    type:        str = Field(..., pattern="^(income|expense)$")
    category:    str
    amount:      float
    description: Optional[str] = None
    date:        str

class FinanceRecordOut(FinanceRecordIn):
    id:         int
    ministry_id: int
    created_by:  Optional[str] = None
    created_at:  Optional[datetime] = None

    class Config:
        from_attributes = True


# ═══════════════════════════════════════════════
#  ATTENDANCE
# ═══════════════════════════════════════════════
class AttendanceRecordIn(BaseModel):
    member_id: int
    present:   bool = True
    note:      Optional[str] = None

class AttendanceRecordOut(AttendanceRecordIn):
    id:          int
    session_id:  int
    member_name: Optional[str] = None

    class Config:
        from_attributes = True

class AttendanceSessionIn(BaseModel):
    title: str
    date:  str
    notes: Optional[str] = None

class AttendanceSessionOut(AttendanceSessionIn):
    id:          int
    ministry_id: int
    created_at:  Optional[datetime] = None
    records:     List[AttendanceRecordOut] = []

    class Config:
        from_attributes = True

class BulkAttendanceIn(BaseModel):
    session_id: int
    records:    List[AttendanceRecordIn]


# ═══════════════════════════════════════════════
#  WORK PLANS
# ═══════════════════════════════════════════════
class WorkTaskIn(BaseModel):
    title:       str
    assigned_to: Optional[str] = None
    due_date:    Optional[str] = None
    completed:   bool = False

class WorkTaskOut(WorkTaskIn):
    id:      int
    plan_id: int

    class Config:
        from_attributes = True

class WorkPlanIn(BaseModel):
    title:       str
    description: Optional[str] = None
    start_date:  Optional[str] = None
    end_date:    Optional[str] = None
    status:      str = "active"

class WorkPlanOut(WorkPlanIn):
    id:          int
    ministry_id: int
    created_at:  Optional[datetime] = None
    tasks:       List[WorkTaskOut] = []

    class Config:
        from_attributes = True


# ═══════════════════════════════════════════════
#  GALLERY
# ═══════════════════════════════════════════════
class GalleryItemOut(BaseModel):
    id:            int
    ministry_id:   int
    filename:      str
    url:           str
    caption:       Optional[str] = None
    activity_date: Optional[str] = None
    uploaded_by:   Optional[str] = None
    uploaded_at:   Optional[datetime] = None

    class Config:
        from_attributes = True
