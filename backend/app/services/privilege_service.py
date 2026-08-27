import random
from datetime import date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.privilege_model import MemberPrivilegeProfile, WeeklyPrivilegeSchedule, PrivilegeType
from app.models.member_model import Member
from app.schemas.privilege_schema import (
    PrivilegeTypeCreate, PrivilegeTypeUpdate,
    ServiceDayConfigUpdate, ServiceDayConfigResponse,
    PrivilegeProfileCreate
)
from app.models.ministry_model import Ministry
from app.models.member_ministry_model import MemberMinistry
from app.models.privilege_model import ServiceDayConfig

# ── Constantes ──────────────────────────────────────────────────────────────
DAYS_OF_SERVICE = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

# ── Gestión de Tipos de Privilegios (Catálogo Dinámico) ──────────────────────
def get_privilege_types(db: Session):
    rows = db.query(PrivilegeType).all()
    return rows

def create_privilege_type(db: Session, data: PrivilegeTypeCreate):
    values = data.model_dump()
    if "ignore_ministry_day" in values:
        values["ignore_ministry_day"] = int(values["ignore_ministry_day"])
        
    obj = PrivilegeType(**values)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def update_privilege_type(db: Session, type_id: int, data: PrivilegeTypeUpdate):
    obj = db.query(PrivilegeType).filter(PrivilegeType.id == type_id).first()
    if not obj: return None
    
    values = data.model_dump(exclude_unset=True)
    if "ignore_ministry_day" in values:
        values["ignore_ministry_day"] = int(values["ignore_ministry_day"])
        
    for k, v in values.items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

def delete_privilege_type(db: Session, type_id: int):
    obj = db.query(PrivilegeType).filter(PrivilegeType.id == type_id).first()
    if obj:
        db.delete(obj)
        db.commit()
        return True
    return False

def get_dynamic_catalog(db: Session):
    types = get_privilege_types(db)
    catalog = {}
    for t in types:
        catalog.setdefault(t.category, []).append(t.name)
    return catalog

def initialize_privileges(db: Session):
    defaults = [
        {"category": "General",    "name": "Lectura bíblica"},
        {"category": "General",    "name": "Motivar Ofrenda"},
        {"category": "Liderazgo",  "name": "Dirigir el servicio"},
        {"category": "Música",     "name": "Coros"},
        {"category": "Predicación", "name": "Predica"},
    ]
    for d in defaults:
        if not db.query(PrivilegeType).filter(PrivilegeType.name == d["name"]).first():
            # Predica ignora el día por defecto
            ignore = 1 if d["name"] == "Predica" else 0
            db.add(PrivilegeType(**d, ignore_ministry_day=ignore))
    db.commit()

def get_service_days_config(db: Session):
    rows = db.query(ServiceDayConfig).all()
    if not rows:
        for d in DAYS_OF_SERVICE:
            db.add(ServiceDayConfig(day_name=d, is_general=(d == "Domingo")))
        db.commit()
        rows = db.query(ServiceDayConfig).all()
    return rows

def update_service_day_config(db: Session, day_name: str, is_general: bool):
    obj = db.query(ServiceDayConfig).filter(ServiceDayConfig.day_name == day_name).first()
    if obj:
        obj.is_general = is_general
        db.commit()
        db.refresh(obj)
    return obj


# ── Perfiles de privilegios por miembro ─────────────────────────────────────
def get_all_profiles(db: Session):
    rows = db.query(MemberPrivilegeProfile).all()
    out = {}
    for r in rows:
        key = r.member_id
        if key not in out:
            m = r.member
            out[key] = {
                "member_id": key,
                "member_name": f"{m.first_name} {m.last_name}" if m else "—",
                "privileges": [],
            }
        out[key]["privileges"].append(r.privilege)
    return list(out.values())


def get_member_privileges(db: Session, member_id: int):
    rows = db.query(MemberPrivilegeProfile).filter(
        MemberPrivilegeProfile.member_id == member_id
    ).all()
    return [r.privilege for r in rows]


def set_member_privilege(db: Session, data: PrivilegeProfileCreate):
    existing = db.query(MemberPrivilegeProfile).filter(
        MemberPrivilegeProfile.member_id == data.member_id,
        MemberPrivilegeProfile.privilege == data.privilege
    ).first()
    if existing:
        return existing  # ya existe, no duplicar
    obj = MemberPrivilegeProfile(member_id=data.member_id, privilege=data.privilege)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def remove_member_privilege(db: Session, member_id: int, privilege: str):
    obj = db.query(MemberPrivilegeProfile).filter(
        MemberPrivilegeProfile.member_id == member_id,
        MemberPrivilegeProfile.privilege == privilege
    ).first()
    if obj:
        db.delete(obj)
        db.commit()
        return True
    return False


# ── Programa semanal ─────────────────────────────────────────────────────────
def _week_start(ref: date) -> date:
    """Lunes de la semana que contiene la fecha ref."""
    return ref - timedelta(days=ref.weekday())


def get_schedule(db: Session, week_start: date):
    rows = db.query(WeeklyPrivilegeSchedule).filter(
        WeeklyPrivilegeSchedule.week_start == week_start
    ).all()
    return [_fmt(r) for r in rows]


def _fmt(r):
    name = None
    if r.member:
        name = f"{r.member.first_name} {r.member.last_name}"
    return {
        "id": r.id,
        "week_start": str(r.week_start),
        "day_name": r.day_name,
        "privilege": r.privilege,
        "member_id": r.member_id,
        "member_name": name,
        "notes": r.notes,
        "created_at": r.created_at,
    }


def auto_generate_schedule(db: Session, week_start: date, user_id: int, days: list[str] = None):
    """
    Genera automáticamente el programa de la semana.
    Reglas:
      - Solo asigna miembros habilitados para el privilegio.
      - En cada día, intenta no repetir la misma persona.
      - Distribuye equitativamente entre semanas (evita las asignaciones más recientes).
    """
    # 1. Limpiar programa existente de la semana
    db.query(WeeklyPrivilegeSchedule).filter(
        WeeklyPrivilegeSchedule.week_start == week_start
    ).delete()
    db.commit()

    # 2. Obtener pool por privilegio {privilege: [member_id, ...]}
    all_profiles = db.query(MemberPrivilegeProfile).all()
    pool = {}
    for p in all_profiles:
        pool.setdefault(p.privilege, []).append(p.member_id)

    # 3. Calcular frecuencia reciente (últimas 4 semanas) por miembro
    four_weeks_ago = week_start - timedelta(weeks=4)
    freq_rows = db.query(
        WeeklyPrivilegeSchedule.member_id,
        func.count(WeeklyPrivilegeSchedule.id).label("cnt")
    ).filter(
        WeeklyPrivilegeSchedule.week_start >= four_weeks_ago,
        WeeklyPrivilegeSchedule.member_id.isnot(None)
    ).group_by(WeeklyPrivilegeSchedule.member_id).all()
    recent_count = {r.member_id: r.cnt for r in freq_rows}

    # 4. Obtener Mapeo de Días de Ministerio por Miembro
    # member_ministry_days = {member_id: "Lunes"}
    ministry_mapping = db.query(
        MemberMinistry.member_id, 
        Ministry.service_day
    ).join(Ministry, MemberMinistry.ministry_id == Ministry.id).all()
    member_ministry_days = {m.member_id: m.service_day for m in ministry_mapping}

    # 5. Obtener Configuración de Días Generales y Tipos de Privilegio
    general_days = {d.day_name for d in get_service_days_config(db) if d.is_general}
    privilege_types = {t.name: t.ignore_ministry_day for t in get_privilege_types(db)}

    # 6. Asignar
    target_days = days if days else DAYS_OF_SERVICE
    all_privileges = [p.name for p in get_privilege_types(db)]
    
    new_entries = []
    for day in target_days:
        assigned_today = set()
        is_general_day = day in general_days

        for privilege in all_privileges:
            ignore_day_constraint = privilege_types.get(privilege, 0) == 1
            candidates = pool.get(privilege, [])
            
            if not candidates:
                new_entries.append(WeeklyPrivilegeSchedule(
                    week_start=week_start,
                    day_name=day,
                    privilege=privilege,
                    member_id=None,
                    notes="Sin miembros habilitados",
                    created_by=user_id,
                ))
                continue

            # --- FILTRADO POR DÍA DE MINISTERIO ---
            # Si no es un día general Y el privilegio NO ignora el día
            if not is_general_day and not ignore_day_constraint:
                # Solo miembros cuyo día de ministerio coincida con el día actual
                # Se permite también a miembros sin ministerio (member_ministry_days.get(c) is None)
                candidates = [
                    c for c in candidates 
                    if member_ministry_days.get(c) == day or member_ministry_days.get(c) is None
                ]

            if not candidates:
                new_entries.append(WeeklyPrivilegeSchedule(
                    week_start=week_start,
                    day_name=day,
                    privilege=privilege,
                    member_id=None,
                    notes="Sin candidatos disponibles para este día",
                    created_by=user_id,
                ))
                continue

            # Filtrar: preferir no repetir en el mismo día
            not_today = [c for c in candidates if c not in assigned_today]
            pool_candidates = not_today if not_today else candidates

            # Ordenar por menor frecuencia reciente (distribución equitativa)
            pool_candidates.sort(key=lambda mid: recent_count.get(mid, 0))

            # Entre los de menor frecuencia, escoger aleatoriamente
            min_freq = recent_count.get(pool_candidates[0], 0)
            least_used = [c for c in pool_candidates if recent_count.get(c, 0) == min_freq]
            chosen = random.choice(least_used)

            assigned_today.add(chosen)
            recent_count[chosen] = recent_count.get(chosen, 0) + 1

            new_entries.append(WeeklyPrivilegeSchedule(
                week_start=week_start,
                day_name=day,
                privilege=privilege,
                member_id=chosen,
                created_by=user_id,
            ))

    db.add_all(new_entries)
    db.commit()

    return get_schedule(db, week_start)


def update_schedule_entry(db: Session, entry_id: int, member_id: int, notes: str = None):
    obj = db.query(WeeklyPrivilegeSchedule).filter(
        WeeklyPrivilegeSchedule.id == entry_id
    ).first()
    if not obj:
        return None
    obj.member_id = member_id
    obj.notes = notes
    db.commit()
    db.refresh(obj)
    return _fmt(obj)


def delete_schedule(db: Session, week_start: date):
    db.query(WeeklyPrivilegeSchedule).filter(
        WeeklyPrivilegeSchedule.week_start == week_start
    ).delete()
    db.commit()
    return True
