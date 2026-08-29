# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import date

from app.database.connection import get_db
from app.utils.dependencies import get_current_user
from app.schemas.privilege_schema import (
    PrivilegeProfileCreate, AutoGenerateRequest,
    PrivilegeTypeCreate, PrivilegeTypeUpdate,
    ServiceDayConfigUpdate
)
from app.services import privilege_service

router = APIRouter(prefix="/privileges", tags=["Privileges"])


# ── Catálogo de Privilegios Dinámico ─────────────────────────────────────────
@router.get("/catalog")
def get_catalog(db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Devuelve los privilegios agrupados por categoría desde la DB."""
    return privilege_service.get_dynamic_catalog(db)

@router.get("/types")
def get_types(db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Lista todos los tipos de privilegios registrados."""
    return privilege_service.get_privilege_types(db)

@router.post("/types")
def create_type(data: PrivilegeTypeCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return privilege_service.create_privilege_type(db, data)

@router.put("/types/{type_id}")
def update_type(type_id: int, data: PrivilegeTypeUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    obj = privilege_service.update_privilege_type(db, type_id, data)
    if not obj: raise HTTPException(status_code=404, detail="Tipo no encontrado")
    return obj

@router.delete("/types/{type_id}")
def delete_type(type_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    ok = privilege_service.delete_privilege_type(db, type_id)
    if not ok: raise HTTPException(status_code=404, detail="Tipo no encontrado")
    return {"message": "Tipo de privilegio eliminado"}
    
@router.get("/config/days")
def get_service_days(db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Obtiene la configuración de los días de la semana."""
    return privilege_service.get_service_days_config(db)

@router.put("/config/days/{day_name}")
def update_service_day(day_name: str, data: ServiceDayConfigUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Actualiza si un día es de participación general."""
    return privilege_service.update_service_day_config(db, day_name, data.is_general)


# ── Perfiles de miembros ─────────────────────────────────────────────────────
@router.get("/profiles")
def get_all_profiles(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return privilege_service.get_all_profiles(db)


@router.get("/profiles/{member_id}")
def get_member_privileges(member_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return {"member_id": member_id, "privileges": privilege_service.get_member_privileges(db, member_id)}


@router.post("/profiles")
def add_privilege(data: PrivilegeProfileCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return privilege_service.set_member_privilege(db, data)


@router.delete("/profiles/{member_id}/{privilege}")
def remove_privilege(member_id: int, privilege: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    ok = privilege_service.remove_member_privilege(db, member_id, privilege)
    if not ok:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")
    return {"message": "Privilegio removido"}


# ── Programa Semanal ─────────────────────────────────────────────────────────
@router.get("/schedule")
def get_schedule(week_start: date = Query(...), db: Session = Depends(get_db), user=Depends(get_current_user)):
    return privilege_service.get_schedule(db, week_start)


@router.post("/schedule/auto")
def auto_generate(data: AutoGenerateRequest, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return privilege_service.auto_generate_schedule(db, data.week_start, user.id, data.days)


@router.put("/schedule/{entry_id}")
def update_entry(entry_id: int, member_id: int = Query(...), notes: str = Query(None),
                 db: Session = Depends(get_db), user=Depends(get_current_user)):
    obj = privilege_service.update_schedule_entry(db, entry_id, member_id, notes)
    if not obj:
        raise HTTPException(status_code=404, detail="Entrada no encontrada")
    return obj


@router.delete("/schedule")
def delete_schedule(week_start: date = Query(...), db: Session = Depends(get_db), user=Depends(get_current_user)):
    privilege_service.delete_schedule(db, week_start)
    return {"message": "Programa eliminado"}
