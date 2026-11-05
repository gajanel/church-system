# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

from sqlalchemy.orm import Session, joinedload
from app.models.ministry_model import Ministry, MinistryRole
from app.models.member_ministry_model import MemberMinistry
from app.models.member_model import Member
from app.schemas.ministry_schema import MinistryCreate, MinistryUpdate, MinistryMemberAssign

def get_all_ministries(db: Session):
    return db.query(Ministry).options(joinedload(Ministry.roles)).all()

def get_ministry_by_id(db: Session, ministry_id: int):
    return db.query(Ministry).options(joinedload(Ministry.roles)).filter(Ministry.id == ministry_id).first()

def create_ministry(db: Session, data: MinistryCreate):
    if data.service_day:
        existing = db.query(Ministry).filter(Ministry.service_day == data.service_day).first()
        if existing:
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail=f"El día {data.service_day} ya está asignado al ministerio: {existing.name}")

    ministry = Ministry(name=data.name, service_day=data.service_day)
    db.add(ministry)
    db.flush()  # Obtener el ID del ministerio antes de agregar los roles
    for role in data.roles:
        db.add(MinistryRole(ministry_id=ministry.id, role=role))
    db.commit()
    db.refresh(ministry)
    return ministry

def update_ministry(db: Session, ministry_id: int, data: MinistryUpdate):
    ministry = db.query(Ministry).filter(Ministry.id == ministry_id).first()
    if not ministry:
        return None
    if data.name:
        ministry.name = data.name
    if data.service_day is not None:
        if data.service_day:
            existing = db.query(Ministry).filter(Ministry.service_day == data.service_day, Ministry.id != ministry_id).first()
            if existing:
                from fastapi import HTTPException
                raise HTTPException(status_code=400, detail=f"El día {data.service_day} ya está asignado al ministerio: {existing.name}")
        ministry.service_day = data.service_day if data.service_day else None

    if data.roles is not None:
        current_roles = db.query(MinistryRole).filter(MinistryRole.ministry_id == ministry_id).all()
        current_names = [r.role for r in current_roles]
        
        # Guardamos los Nombres de roles a mantener
        roles_to_set = set(data.roles)
        
        # Eliminar roles que ya no están en la lista
        for r_obj in current_roles:
            if r_obj.role not in roles_to_set:
                db.delete(r_obj)
        
        # Agregar roles nuevos que no están en la lista actual
        for r_name in roles_to_set:
            if r_name not in current_names:
                db.add(MinistryRole(ministry_id=ministry_id, role=r_name))
    db.commit()
    db.refresh(ministry)
    return ministry

def delete_ministry(db: Session, ministry_id: int):
    ministry = db.query(Ministry).filter(Ministry.id == ministry_id).first()
    if not ministry:
        return False
    db.delete(ministry)
    db.commit()
    return True

def get_ministry_members(db: Session, ministry_id: int):
    results = db.query(MemberMinistry, Member).join(Member, MemberMinistry.member_id == Member.id).filter(MemberMinistry.ministry_id == ministry_id).all()
    out = []
    for mm, m in results:
        out.append({
            "id": mm.id,
            "member_id": mm.member_id,
            "ministry_id": mm.ministry_id,
            "ministry_role_id": mm.ministry_role_id,
            "member_name": f"{m.first_name} {m.last_name}"
        })
    return out

def assign_member_to_role(db: Session, ministry_id: int, data: MinistryMemberAssign):
    # Si el miembro ya está en este ministerio, solo actualizamos su rol
    existing = db.query(MemberMinistry).filter(MemberMinistry.member_id == data.member_id, MemberMinistry.ministry_id == ministry_id).first()
    if existing:
        existing.ministry_role_id = data.ministry_role_id
        db.commit()
        db.refresh(existing)
        mm = existing
    else:
        mm = MemberMinistry(
            member_id=data.member_id,
            ministry_id=ministry_id,
            ministry_role_id=data.ministry_role_id
        )
        db.add(mm)
        db.commit()
        db.refresh(mm)
        
    m = db.query(Member).filter(Member.id == mm.member_id).first()
    return {
        "id": mm.id,
        "member_id": mm.member_id,
        "ministry_id": mm.ministry_id,
        "ministry_role_id": mm.ministry_role_id,
        "member_name": f"{m.first_name} {m.last_name}" if m else ""
    }

def unassign_member(db: Session, member_ministry_id: int):
    mm = db.query(MemberMinistry).filter(MemberMinistry.id == member_ministry_id).first()
    if mm:
        db.delete(mm)
        db.commit()
        return True
    return False