# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

from sqlalchemy.orm import Session, joinedload
from app.models.ministry_model import Ministry, MinistryRole
from app.schemas.ministry_schema import MinistryCreate, MinistryUpdate

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