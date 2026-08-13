"""
Ministry Workspace Router
All endpoints are scoped to /ministry-workspace/{ministry_id}/...
Admin-only endpoints: config toggle
"""
import os
import shutil
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.utils.dependencies import get_current_user
from app.models.ministry_workspace_model import (
    MinistryModuleConfig, MinistryFinanceRecord,
    MinistryAttendanceSession, MinistryAttendanceRecord,
    MinistryWorkPlan, MinistryWorkTask, MinistryGalleryItem,
)
from app.models.ministry_model import Ministry
from app.models.member_ministry_model import MemberMinistry
from app.models.member_model import Member
from app.schemas.ministry_workspace_schema import (
    ModuleConfigOut, ModuleConfigUpdate,
    FinanceRecordIn, FinanceRecordOut,
    AttendanceSessionIn, AttendanceSessionOut, BulkAttendanceIn, AttendanceRecordOut,
    WorkPlanIn, WorkPlanOut, WorkTaskIn, WorkTaskOut,
    GalleryItemOut,
)

router = APIRouter(prefix="/ministry-workspace", tags=["Ministry Workspace"])

UPLOAD_DIR = "static/uploads/ministry_gallery"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ── Helpers ─────────────────────────────────────────────────────────────
def get_ministry_or_404(ministry_id: int, db: Session) -> Ministry:
    m = db.query(Ministry).filter(Ministry.id == ministry_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Ministerio no encontrado")
    return m

def get_config(ministry_id: int, db: Session) -> MinistryModuleConfig:
    cfg = db.query(MinistryModuleConfig).filter(MinistryModuleConfig.ministry_id == ministry_id).first()
    if not cfg:
        # Create default (all enabled)
        cfg = MinistryModuleConfig(ministry_id=ministry_id)
        db.add(cfg); db.commit(); db.refresh(cfg)
    return cfg

def require_module(cfg: MinistryModuleConfig, module: str):
    if not getattr(cfg, module, False):
        raise HTTPException(status_code=403, detail=f"El módulo '{module}' está deshabilitado para este ministerio")


# ══════════════════════════════════════════════════════════════
#  MODULE CONFIG (admin only)
# ══════════════════════════════════════════════════════════════
@router.get("/{ministry_id}/config", response_model=ModuleConfigOut)
def get_module_config(ministry_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    get_ministry_or_404(ministry_id, db)
    return get_config(ministry_id, db)


@router.put("/{ministry_id}/config", response_model=ModuleConfigOut)
def update_module_config(
    ministry_id: int,
    payload: ModuleConfigUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Solo los administradores pueden modificar la configuración")
    get_ministry_or_404(ministry_id, db)
    cfg = get_config(ministry_id, db)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(cfg, field, value)
    db.commit(); db.refresh(cfg)
    return cfg


# ══════════════════════════════════════════════════════════════
#  MINISTRY LIST (for sidebar/workspace index)
# ══════════════════════════════════════════════════════════════
@router.get("/list")
def list_ministries_workspace(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Return all ministries with their module config."""
    ministries = db.query(Ministry).all()
    result = []
    for m in ministries:
        cfg = get_config(m.id, db)
        result.append({
            "id":          m.id,
            "name":        m.name,
            "service_day": m.service_day,
            "config": {
                "finance":    cfg.finance,
                "attendance": cfg.attendance,
                "work_plans": cfg.work_plans,
                "gallery":    cfg.gallery,
            }
        })
    return result


# ══════════════════════════════════════════════════════════════
#  FINANCE
# ══════════════════════════════════════════════════════════════
@router.get("/{ministry_id}/finance", response_model=List[FinanceRecordOut])
def list_finance(ministry_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    cfg = get_config(ministry_id, db)
    require_module(cfg, "finance")
    return db.query(MinistryFinanceRecord).filter(MinistryFinanceRecord.ministry_id == ministry_id)\
             .order_by(MinistryFinanceRecord.date.desc()).all()


@router.post("/{ministry_id}/finance", response_model=FinanceRecordOut)
def create_finance(
    ministry_id: int,
    payload: FinanceRecordIn,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    get_ministry_or_404(ministry_id, db)
    cfg = get_config(ministry_id, db)
    require_module(cfg, "finance")
    record = MinistryFinanceRecord(**payload.model_dump(), ministry_id=ministry_id, created_by=current_user.name)
    db.add(record); db.commit(); db.refresh(record)
    return record


@router.delete("/{ministry_id}/finance/{record_id}")
def delete_finance(ministry_id: int, record_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    rec = db.query(MinistryFinanceRecord).filter(
        MinistryFinanceRecord.id == record_id,
        MinistryFinanceRecord.ministry_id == ministry_id
    ).first()
    if not rec:
        raise HTTPException(404, "Registro no encontrado")
    db.delete(rec); db.commit()
    return {"ok": True}


# ══════════════════════════════════════════════════════════════
#  ATTENDANCE
# ══════════════════════════════════════════════════════════════
@router.get("/{ministry_id}/attendance", response_model=List[AttendanceSessionOut])
def list_sessions(ministry_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    cfg = get_config(ministry_id, db)
    require_module(cfg, "attendance")
    sessions = db.query(MinistryAttendanceSession)\
                 .filter(MinistryAttendanceSession.ministry_id == ministry_id)\
                 .order_by(MinistryAttendanceSession.date.desc()).all()
    # Enrich with member names
    for s in sessions:
        for r in s.records:
            member = db.query(Member).filter(Member.id == r.member_id).first()
            r.member_name = f"{member.first_name} {member.last_name}" if member else "—"
    return sessions


@router.post("/{ministry_id}/attendance", response_model=AttendanceSessionOut)
def create_session(
    ministry_id: int,
    payload: AttendanceSessionIn,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    get_ministry_or_404(ministry_id, db)
    cfg = get_config(ministry_id, db)
    require_module(cfg, "attendance")
    session = MinistryAttendanceSession(**payload.model_dump(), ministry_id=ministry_id)
    db.add(session); db.commit(); db.refresh(session)
    return session


@router.post("/{ministry_id}/attendance/{session_id}/records")
def save_attendance_records(
    ministry_id: int,
    session_id: int,
    payload: BulkAttendanceIn,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Upsert bulk attendance records for a session."""
    session = db.query(MinistryAttendanceSession).filter(
        MinistryAttendanceSession.id == session_id,
        MinistryAttendanceSession.ministry_id == ministry_id
    ).first()
    if not session:
        raise HTTPException(404, "Sesión no encontrada")

    # Delete existing records for this session, then re-insert
    db.query(MinistryAttendanceRecord).filter(MinistryAttendanceRecord.session_id == session_id).delete()
    for r in payload.records:
        rec = MinistryAttendanceRecord(session_id=session_id, **r.model_dump())
        db.add(rec)
    db.commit()
    return {"ok": True, "count": len(payload.records)}


@router.delete("/{ministry_id}/attendance/{session_id}")
def delete_session(ministry_id: int, session_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    s = db.query(MinistryAttendanceSession).filter(
        MinistryAttendanceSession.id == session_id,
        MinistryAttendanceSession.ministry_id == ministry_id
    ).first()
    if not s:
        raise HTTPException(404, "Sesión no encontrada")
    db.delete(s); db.commit()
    return {"ok": True}


# ══════════════════════════════════════════════════════════════
#  WORK PLANS
# ══════════════════════════════════════════════════════════════
@router.get("/{ministry_id}/plans", response_model=List[WorkPlanOut])
def list_plans(ministry_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    cfg = get_config(ministry_id, db)
    require_module(cfg, "work_plans")
    return db.query(MinistryWorkPlan).filter(MinistryWorkPlan.ministry_id == ministry_id)\
             .order_by(MinistryWorkPlan.created_at.desc()).all()


@router.post("/{ministry_id}/plans", response_model=WorkPlanOut)
def create_plan(
    ministry_id: int,
    payload: WorkPlanIn,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    get_ministry_or_404(ministry_id, db)
    cfg = get_config(ministry_id, db)
    require_module(cfg, "work_plans")
    plan = MinistryWorkPlan(**payload.model_dump(), ministry_id=ministry_id)
    db.add(plan); db.commit(); db.refresh(plan)
    return plan


@router.put("/{ministry_id}/plans/{plan_id}", response_model=WorkPlanOut)
def update_plan(
    ministry_id: int, plan_id: int,
    payload: WorkPlanIn,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    plan = db.query(MinistryWorkPlan).filter(
        MinistryWorkPlan.id == plan_id, MinistryWorkPlan.ministry_id == ministry_id
    ).first()
    if not plan:
        raise HTTPException(404, "Plan no encontrado")
    for k, v in payload.model_dump().items():
        setattr(plan, k, v)
    db.commit(); db.refresh(plan)
    return plan


@router.delete("/{ministry_id}/plans/{plan_id}")
def delete_plan(ministry_id: int, plan_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    plan = db.query(MinistryWorkPlan).filter(
        MinistryWorkPlan.id == plan_id, MinistryWorkPlan.ministry_id == ministry_id
    ).first()
    if not plan:
        raise HTTPException(404, "Plan no encontrado")
    db.delete(plan); db.commit()
    return {"ok": True}


@router.post("/{ministry_id}/plans/{plan_id}/tasks", response_model=WorkTaskOut)
def add_task(
    ministry_id: int, plan_id: int,
    payload: WorkTaskIn,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    plan = db.query(MinistryWorkPlan).filter(
        MinistryWorkPlan.id == plan_id, MinistryWorkPlan.ministry_id == ministry_id
    ).first()
    if not plan:
        raise HTTPException(404, "Plan no encontrado")
    task = MinistryWorkTask(**payload.model_dump(), plan_id=plan_id)
    db.add(task); db.commit(); db.refresh(task)
    return task


@router.patch("/{ministry_id}/plans/{plan_id}/tasks/{task_id}", response_model=WorkTaskOut)
def toggle_task(
    ministry_id: int, plan_id: int, task_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    task = db.query(MinistryWorkTask).filter(MinistryWorkTask.id == task_id, MinistryWorkTask.plan_id == plan_id).first()
    if not task:
        raise HTTPException(404, "Tarea no encontrada")
    task.completed = not task.completed
    db.commit(); db.refresh(task)
    return task


@router.delete("/{ministry_id}/plans/{plan_id}/tasks/{task_id}")
def delete_task(ministry_id: int, plan_id: int, task_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    task = db.query(MinistryWorkTask).filter(MinistryWorkTask.id == task_id, MinistryWorkTask.plan_id == plan_id).first()
    if not task:
        raise HTTPException(404, "Tarea no encontrada")
    db.delete(task); db.commit()
    return {"ok": True}


# ══════════════════════════════════════════════════════════════
#  GALLERY
# ══════════════════════════════════════════════════════════════
@router.get("/{ministry_id}/gallery", response_model=List[GalleryItemOut])
def list_gallery(ministry_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    cfg = get_config(ministry_id, db)
    require_module(cfg, "gallery")
    return db.query(MinistryGalleryItem).filter(MinistryGalleryItem.ministry_id == ministry_id)\
             .order_by(MinistryGalleryItem.uploaded_at.desc()).all()


@router.post("/{ministry_id}/gallery", response_model=GalleryItemOut)
async def upload_gallery(
    ministry_id: int,
    file: UploadFile = File(...),
    caption: str = Form(""),
    activity_date: str = Form(""),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    get_ministry_or_404(ministry_id, db)
    cfg = get_config(ministry_id, db)
    require_module(cfg, "gallery")

    # Validate file type
    allowed = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed:
        raise HTTPException(400, "Solo se permiten imágenes (JPEG, PNG, WEBP, GIF)")

    # Save file
    ext = file.filename.rsplit(".", 1)[-1].lower()
    import uuid
    unique_name = f"{ministry_id}_{uuid.uuid4().hex}.{ext}"
    path = os.path.join(UPLOAD_DIR, unique_name)
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    url = f"/static/uploads/ministry_gallery/{unique_name}"
    item = MinistryGalleryItem(
        ministry_id=ministry_id,
        filename=file.filename,
        url=url,
        caption=caption or None,
        activity_date=activity_date or None,
        uploaded_by=current_user.name,
    )
    db.add(item); db.commit(); db.refresh(item)
    return item


@router.delete("/{ministry_id}/gallery/{item_id}")
def delete_gallery_item(
    ministry_id: int, item_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    item = db.query(MinistryGalleryItem).filter(
        MinistryGalleryItem.id == item_id,
        MinistryGalleryItem.ministry_id == ministry_id
    ).first()
    if not item:
        raise HTTPException(404, "Imagen no encontrada")
    # Delete file
    path = item.url.lstrip("/")
    if os.path.exists(path):
        os.remove(path)
    db.delete(item); db.commit()
    return {"ok": True}
