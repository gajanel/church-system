# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.user_model import User
from app.schemas.user_schema import UserCreate
from app.utils.security import hash_password

def get_all_users(db: Session):
    return db.query(User).all()

def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def get_user_conflict(db: Session, username: str = None, email: str = None, member_id: int = None, exclude_user_id: int = None):
    query = db.query(User)
    if exclude_user_id is not None:
        query = query.filter(User.id != exclude_user_id)
    if username and query.filter(func.lower(User.username) == username.lower()).first():
        return "El nombre de usuario ya está en uso"
    if email and query.filter(func.lower(User.email) == email.lower()).first():
        return "El correo electrónico ya está en uso"
    if member_id is not None and query.filter(User.member_id == member_id).first():
        return "El miembro seleccionado ya está vinculado a otra cuenta"
    return None

def create_user(db: Session, data: UserCreate):
    user = User(
        name=data.name,
        username=data.username,
        email=data.email,
        password=hash_password(data.password),
        is_admin=data.is_admin,
        is_super_admin=data.is_super_admin,
        modules=data.modules,
        must_change_password=True,
        is_active=True,
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
        if key == "member_id" or value is not None:
            setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user

def delete_user(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return False

    user.is_active = False
    db.commit()
    return True
