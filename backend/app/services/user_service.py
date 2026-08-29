# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

from sqlalchemy.orm import Session
from app.models.user_model import User
from app.schemas.user_schema import UserCreate
from app.utils.security import hash_password

def get_all_users(db: Session):
    return db.query(User).all()

def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def create_user(db: Session, data: UserCreate):
    existing = db.query(User).filter((User.name == data.name) | (User.username == data.username)).first()
    if existing:
        return None
    user = User(
        name=data.name,
        username=data.username,
        email=data.email,
        password=hash_password(data.password),
        is_admin=data.is_admin,
        is_super_admin=data.is_super_admin,
        modules=data.modules,
        must_change_password=True,
        member_id=data.member_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def update_user(db: Session, user_id: int, data: dict):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    for key, value in data.items():
        if key == "password" and value:
            value = hash_password(value)
            user.must_change_password = True
        if value is not None:
            setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user

def delete_user(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return False

    # ── Remove all FK references before deleting the user ──────────────
    # Audit logs
    from app.models.audit_model import AuditLog
    db.query(AuditLog).filter(AuditLog.user_id == user_id).delete()

    # Finance records created by this user (nullify or delete)
    from app.models.finance_model import (
        ChurchOffering, ChurchIncome, ChurchExpense, FixedExpense, BankDeposit
    )
    db.query(ChurchOffering).filter(ChurchOffering.created_by == user_id).delete()
    db.query(ChurchIncome).filter(ChurchIncome.created_by == user_id).delete()
    db.query(ChurchExpense).filter(ChurchExpense.created_by == user_id).delete()
    db.query(FixedExpense).filter(FixedExpense.created_by == user_id).delete()
    db.query(BankDeposit).filter(BankDeposit.created_by == user_id).delete()

    # Ministry/privilege records if any
    try:
        from app.models.privilege_model import MinistryRole
        db.query(MinistryRole).filter(MinistryRole.created_by == user_id).delete()
    except Exception:
        pass

    db.delete(user)
    db.commit()
    return True