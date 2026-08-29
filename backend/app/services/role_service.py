# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

from sqlalchemy.orm import Session
from app.models.role_model import Role


def create_role(db: Session, name: str):
    # Verificar si ya existe
    existing = db.query(Role).filter(Role.name == name).first()
    if existing:
        raise ValueError(f"El rol '{name}' ya existe.")

    role = Role(name=name)
    db.add(role)
    db.commit()
    db.refresh(role)
    return role

def get_roles(db: Session):
    return db.query(Role).all()
