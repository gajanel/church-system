# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.schemas.user_schema import LoginSchema, UserCreate, UserUpdate, UserResponse
from app.database.connection import get_db
from app.models.user_model import User
from app.utils.security import verify_password
from app.utils.jwt import create_access_token, create_refresh_token, SECRET_KEY, ALGORITHM
from app.utils.dependencies import get_current_user, only_admin
from app.services import user_service
from app.schemas.user_schema import PasswordChangeSchema, TokenRefreshRequest
from jose import jwt
from app.services import audit_service
from app.schemas import audit_schema

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()

@router.post("/login")
@limiter.limit("5/minute")  # máximo 5 intentos por minuto por IP
def login(request: Request, data: LoginSchema, db: Session = Depends(get_db)):
    # Mensaje genérico para evitar user enumeration
    _auth_error = HTTPException(status_code=401, detail="Credenciales inválidas")
    user = db.query(User).filter(User.username == data.username).first()
    if not user:
        raise _auth_error
    if not getattr(user, 'is_active', True):
        raise HTTPException(status_code=401, detail="Usuario desactivado. Contacte a un administrador.")
    if not verify_password(data.password, user.password):
        raise _auth_error
    
    access_token = create_access_token(data={"sub": user.username})
    refresh_token = create_refresh_token(data={"sub": user.username})
    
    # Log de Auditoría: Inicio de sesión
    audit_service.create_audit_log(db, audit_schema.AuditLogCreate(
        user_id=user.id,
        action="LOGIN",
        module="Seguridad",
        description="Inicio de sesión exitoso",
        ip_address=request.client.host,
        device=request.headers.get("user-agent", "Desconocido")
    ))
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "username": user.username,
            "is_admin": user.is_admin,
            "is_super_admin": user.is_super_admin,
            "modules": user.modules,
            "must_change_password": user.must_change_password
        }
    }

@router.post("/refresh")
def refresh_token(data: TokenRefreshRequest, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(data.refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        token_type = payload.get("type")
        
        if token_type != "refresh":
            raise HTTPException(status_code=401, detail="Tipo de token inválido")
            
        user = db.query(User).filter(User.username == username).first()
        if not user:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")
            
        new_access_token = create_access_token(data={"sub": user.username})
        return {
            "access_token": new_access_token,
            "token_type": "bearer"
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail="Token de refresco inválido o expirado")

@router.post("/change-password")
def change_password(data: PasswordChangeSchema, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    from app.utils.security import hash_password, verify_password
    
    # Validar contraseña actual
    if not verify_password(data.current_password, current_user.password):
        raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")
        
    current_user.password = hash_password(data.new_password)
    current_user.must_change_password = False
    db.commit()

    audit_service.create_audit_log(db, audit_schema.AuditLogCreate(
        user_id=current_user.id,
        action="UPDATE",
        module="Seguridad",
        description="Cambió su propia contraseña"
    ))

    return {"message": "Contraseña actualizada exitosamente"}

@router.get("/users", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db), user=Depends(only_admin)):
    return user_service.get_all_users(db)

@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    u = user_service.get_user_by_id(db, user_id)
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return u

@router.post("/users", response_model=UserResponse)
def create_user(data: UserCreate, db: Session = Depends(get_db), user=Depends(only_admin)):
    u = user_service.create_user(db, data)
    if not u:
        raise HTTPException(status_code=400, detail="El usuario ya existe")
    
    audit_service.create_audit_log(db, audit_schema.AuditLogCreate(
        user_id=user.id,
        action="CREATE",
        module="Gestión Usuarios",
        description=f"Creó al usuario {u.username} ({u.name})"
    ))
    return u

@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(user_id: int, data: UserUpdate, db: Session = Depends(get_db), user=Depends(only_admin)):
    target_user = user_service.get_user_by_id(db, user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    # Un admin no puede editar a otro admin (solo super admin, o a sí mismo)
    if target_user.is_admin and not user.is_super_admin and user.id != target_user.id:
        raise HTTPException(status_code=403, detail="No tienes permisos para modificar a otro administrador")

    # Un admin regular no puede otorgar/quitar el rol de admin o super_admin
    if not user.is_super_admin:
        if data.is_admin is not None and data.is_admin != target_user.is_admin:
            raise HTTPException(status_code=403, detail="No tienes permisos para cambiar el rol de administrador")
        if data.is_super_admin is not None and data.is_super_admin != target_user.is_super_admin:
            raise HTTPException(status_code=403, detail="No tienes permisos para cambiar el rol de súper administrador")

    u = user_service.update_user(db, user_id, data.model_dump(exclude_unset=True))
    return u

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), user=Depends(only_admin)):
    target_user = user_service.get_user_by_id(db, user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    # Un admin no puede eliminar/desactivar a otro admin (solo super admin, y no a sí mismo)
    if target_user.is_admin and not user.is_super_admin:
        raise HTTPException(status_code=403, detail="No tienes permisos para desactivar a otro administrador")
        
    username = target_user.username
    deleted = user_service.delete_user(db, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Error al eliminar")

    audit_service.create_audit_log(db, audit_schema.AuditLogCreate(
        user_id=user.id,
        action="UPDATE",
        module="Gestión Usuarios",
        description=f"Desactivó al usuario {username}"
    ))
    return {"message": "Usuario desactivado correctamente"}