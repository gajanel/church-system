# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

"""
Ministry Workspace Router
All endpoints are scoped to /ministry-workspace/{ministry_id}/...
Admin-only endpoints: config toggle
"""
import os
import shutil
import uuid
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
from app.models.ministry_monthly_report_model import MinistryMonthlyReport
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
from app.schemas.ministry_monthly_report_schema import MonthlyReportOut

router = APIRouter(prefix="/ministry-workspace", tags=["Ministry Workspace"])

UPLOAD_DIR         = "static/uploads/ministry_gallery"
REPORT_UPLOAD_DIR  = "static/uploads/ministry_reports"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(REPORT_UPLOAD_DIR, exist_ok=True)


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
                "finance":        cfg.finance,
                "attendance":     cfg.attendance,
                "work_plans":     cfg.work_plans,
                "gallery":        cfg.gallery,
                "monthly_report": getattr(cfg, "monthly_report", True),
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


# ══════════════════════════════════════════════════════════════
#  MONTHLY REPORTS
# ══════════════════════════════════════════════════════════════

@router.get("/all-monthly-reports", response_model=List[MonthlyReportOut])
def list_all_monthly_reports(
    month: Optional[str] = None,
    ministry_name: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Admin endpoint: returns monthly reports across all ministries."""
    q = db.query(MinistryMonthlyReport)
    if month:
        q = q.filter(MinistryMonthlyReport.report_month == month)
    if ministry_name:
        q = q.filter(MinistryMonthlyReport.ministry_name == ministry_name)
    return q.order_by(MinistryMonthlyReport.created_at.desc()).all()


@router.get("/{ministry_id}/monthly-reports", response_model=List[MonthlyReportOut])
def list_monthly_reports(
    ministry_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    cfg = get_config(ministry_id, db)
    require_module(cfg, "monthly_report")
    return (
        db.query(MinistryMonthlyReport)
        .filter(MinistryMonthlyReport.ministry_id == ministry_id)
        .order_by(MinistryMonthlyReport.created_at.desc())
        .all()
    )


@router.post("/{ministry_id}/monthly-reports", response_model=MonthlyReportOut)
async def create_monthly_report(
    ministry_id: int,
    # ── Sección 1
    reporter_name:       str = Form(...),
    report_month:        str = Form(...),
    ministry_name:       str = Form(...),
    # ── Sección 2 — Membresía
    mem_children:        int = Form(0),
    mem_teens:           int = Form(0),
    mem_youth:           int = Form(0),
    mem_women:           int = Form(0),
    mem_men:             int = Form(0),
    mem_seniors:         int = Form(0),
    # ── Sección 3 — Asistencia
    att_children:        int = Form(0),
    att_teens:           int = Form(0),
    att_youth:           int = Form(0),
    att_women:           int = Form(0),
    att_men:             int = Form(0),
    att_seniors:         int = Form(0),
    # ── Sección 4 — Actividades
    act_scheduled:       int = Form(0),
    act_done:            int = Form(0),
    act_services:        int = Form(0),
    act_fasts:           int = Form(0),
    act_visits:          int = Form(0),
    act_sales:           int = Form(0),
    act_reconciled:      int = Form(0),
    act_meetings:        int = Form(0),
    # ── Sección 5 — Sermones
    sermon_week1:        Optional[str] = Form(None),
    sermon_week2:        Optional[str] = Form(None),
    sermon_week3:        Optional[str] = Form(None),
    sermon_week4:        Optional[str] = Form(None),
    sermon_week5:        Optional[str] = Form(None),
    # ── Sección 6 — Financiero
    fin_offerings:       float = Form(0.0),
    fin_sales:           float = Form(0.0),
    fin_special:         float = Form(0.0),
    fin_social_expense:  float = Form(0.0),
    fin_project_expense: float = Form(0.0),
    # ── Adjunto
    financial_report:    Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    get_ministry_or_404(ministry_id, db)
    cfg = get_config(ministry_id, db)
    require_module(cfg, "monthly_report")

    # Handle optional file upload
    fin_report_url = None
    if financial_report and financial_report.filename:
        allowed_types = {"application/pdf", "image/jpeg", "image/png", "image/webp"}
        if financial_report.content_type not in allowed_types:
            raise HTTPException(400, "Solo se permiten PDF o imágenes para el reporte financiero")
        ext = financial_report.filename.rsplit(".", 1)[-1].lower()
        unique_name = f"{ministry_id}_{uuid.uuid4().hex}.{ext}"
        path = os.path.join(REPORT_UPLOAD_DIR, unique_name)
        with open(path, "wb") as f:
            shutil.copyfileobj(financial_report.file, f)
        fin_report_url = f"/static/uploads/ministry_reports/{unique_name}"

    report = MinistryMonthlyReport(
        ministry_id=ministry_id,
        reporter_name=reporter_name,
        report_month=report_month,
        ministry_name=ministry_name,
        mem_children=mem_children,
        mem_teens=mem_teens,
        mem_youth=mem_youth,
        mem_women=mem_women,
        mem_men=mem_men,
        mem_seniors=mem_seniors,
        att_children=att_children,
        att_teens=att_teens,
        att_youth=att_youth,
        att_women=att_women,
        att_men=att_men,
        att_seniors=att_seniors,
        act_scheduled=act_scheduled,
        act_done=act_done,
        act_services=act_services,
        act_fasts=act_fasts,
        act_visits=act_visits,
        act_sales=act_sales,
        act_reconciled=act_reconciled,
        act_meetings=act_meetings,
        sermon_week1=sermon_week1,
        sermon_week2=sermon_week2,
        sermon_week3=sermon_week3,
        sermon_week4=sermon_week4,
        sermon_week5=sermon_week5,
        fin_offerings=fin_offerings,
        fin_sales=fin_sales,
        fin_special=fin_special,
        fin_social_expense=fin_social_expense,
        fin_project_expense=fin_project_expense,
        fin_report_url=fin_report_url,
        created_by=current_user.name,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("/{ministry_id}/monthly-reports/{report_id}", response_model=MonthlyReportOut)
def get_monthly_report(
    ministry_id: int,
    report_id:   int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    report = db.query(MinistryMonthlyReport).filter(
        MinistryMonthlyReport.id == report_id,
        MinistryMonthlyReport.ministry_id == ministry_id,
    ).first()
    if not report:
        raise HTTPException(404, "Reporte no encontrado")
    return report


@router.delete("/{ministry_id}/monthly-reports/{report_id}")
def delete_monthly_report(
    ministry_id: int,
    report_id:   int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    report = db.query(MinistryMonthlyReport).filter(
        MinistryMonthlyReport.id == report_id,
        MinistryMonthlyReport.ministry_id == ministry_id,
    ).first()
    if not report:
        raise HTTPException(404, "Reporte no encontrado")
    # Delete attached file if any
    if report.fin_report_url:
        path = report.fin_report_url.lstrip("/")
        if os.path.exists(path):
            os.remove(path)
    db.delete(report)
    db.commit()
    return {"ok": True}
