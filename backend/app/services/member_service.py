from sqlalchemy.orm import Session
from app.models.member_model import Member
from app.schemas.member_schema import MemberCreate, MemberUpdate

def get_all_members(db: Session, skip: int = 0, limit: int = 100):
    query = db.query(Member)
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return items, total

def get_member_by_id(db: Session, member_id: int):
    return db.query(Member).filter(Member.id == member_id).first()

def create_member(db: Session, data: MemberCreate):
    member = Member(**data.model_dump())
    db.add(member)
    db.commit()
    db.refresh(member)
    return member

def update_member(db: Session, member_id: int, data: MemberUpdate):
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(member, key, value)
    db.commit()
    db.refresh(member)
    return member

def delete_member(db: Session, member_id: int):
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        return False
    
    # 1. Limpiar referencias en finanzas (poner en NULL para no borrar el historial financiero)
    from app.models.finance_model import ChurchOffering, ChurchIncome
    from app.models.offering_model import Offering
    
    db.query(ChurchOffering).filter(ChurchOffering.member_id == member_id).update({"member_id": None})
    db.query(ChurchIncome).filter(ChurchIncome.member_id == member_id).update({"member_id": None})
    db.query(Offering).filter(Offering.member_id == member_id).update({"member_id": None})

    # 2. Borrar asignaciones a ministerios
    from app.models.member_ministry_model import MemberMinistry
    db.query(MemberMinistry).filter(MemberMinistry.member_id == member_id).delete()

    # 3. Borrar perfiles de privilegios y limpiar cronograma
    from app.models.privilege_model import MemberPrivilegeProfile, WeeklyPrivilegeSchedule
    db.query(MemberPrivilegeProfile).filter(MemberPrivilegeProfile.member_id == member_id).delete()
    db.query(WeeklyPrivilegeSchedule).filter(WeeklyPrivilegeSchedule.member_id == member_id).update({"member_id": None})

    # 4. Pasar a estado inactivo en lugar de eliminar
    member.status = "inactive"
    db.commit()
    return True

def update_member_photo(db: Session, member_id: int, photo_url: str):
    member = get_member_by_id(db, member_id)
    if not member:
        return None
    member.photo_url = photo_url
    db.commit()
    db.refresh(member)
    return member