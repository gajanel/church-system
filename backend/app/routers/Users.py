# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.user_model import User
from app.schemas.user_schema import UserCreate, UserResponse
from app.utils.dependencies import get_current_user, only_admin
import bcrypt

# ─────────────────────────────────────────────────────────────────────────────
# DEPRECATED ROUTER — SEC-03 FIX
# Este router fue el original sin autenticación.
# Ahora TODOS los endpoints requieren autenticación.
# Migrar al router definitivo: app/routers/user_router.py
# ─────────────────────────────────────────────────────────────────────────────

router = APIRouter()

# CREATE — solo admins pueden crear usuarios
@router.post("/usuarios", response_model=UserResponse)
def crear_usuario(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user=Depends(only_admin)
):
    # Verificar si ya existe el correo
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")

    hashed_pw = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt())
    nuevo_usuario = User(
        name=user.name,
        email=user.email,
        password=hashed_pw.decode('utf-8'),
        role_id=user.role_id
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario

# READ (listar todos) — requiere autenticación
@router.get("/usuarios", response_model=list[UserResponse])
def listar_usuarios(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return db.query(User).all()

# READ (obtener por id) — requiere autenticación
@router.get("/usuarios/{user_id}", response_model=UserResponse)
def obtener_usuario(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    usuario = db.query(User).filter(User.id == user_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario

# UPDATE — solo admins
@router.put("/usuarios/{user_id}", response_model=UserResponse)
def actualizar_usuario(
    user_id: int,
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user=Depends(only_admin)
):
    usuario = db.query(User).filter(User.id == user_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    usuario.name = user.name
    usuario.email = user.email
    usuario.role_id = user.role_id

    # Si envía nueva contraseña, la actualizamos
    if user.password:
        hashed_pw = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt())
        usuario.password = hashed_pw.decode('utf-8')

    db.commit()
    db.refresh(usuario)
    return usuario

# DELETE — solo admins
@router.delete("/usuarios/{user_id}")
def eliminar_usuario(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(only_admin)
):
    usuario = db.query(User).filter(User.id == user_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    db.delete(usuario)
    db.commit()
    return {"detail": "Usuario eliminado correctamente"}
