# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

from sqlalchemy.orm import Session, joinedload
from app.models.member_ministry_model import MemberMinistry
from app.schemas.member_ministry_schema import MemberMinistryAssign

def get_member_ministries(db: Session, member_id: int):
    rows = db.query(MemberMinistry).options(
        joinedload(MemberMinistry.ministry),
        joinedload(MemberMinistry.ministry_role)
    ).filter(MemberMinistry.member_id == member_id).all()
    return [
        {
            "id": r.id,
            "ministry_id": r.ministry_id,
            "ministry_name": r.ministry.name,
            "role": r.ministry_role.role,
        }
        for r in rows
    ]

def assign_ministry(db: Session, member_id: int, data: MemberMinistryAssign):
    existing = db.query(MemberMinistry).filter(
        MemberMinistry.member_id == member_id,
        MemberMinistry.ministry_id == data.ministry_id
    ).first()
    if existing:
        return None
    mm = MemberMinistry(
        member_id=member_id,
        ministry_id=data.ministry_id,
        ministry_role_id=data.ministry_role_id
    )
    db.add(mm)
    db.commit()
    db.refresh(mm)
    return mm

def remove_ministry(db: Session, member_ministry_id: int):
    mm = db.query(MemberMinistry).filter(MemberMinistry.id == member_ministry_id).first()
    if not mm:
        return False
    db.delete(mm)
    db.commit()
    return True