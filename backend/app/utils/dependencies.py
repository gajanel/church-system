# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

import logging
from fastapi import Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError, ExpiredSignatureError
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user_model import User
from app.utils.jwt import SECRET_KEY, ALGORITHM
from app.utils.access import has_module_access

logger = logging.getLogger("church_system")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    # BUG-04: Captura específica de errores JWT en lugar de except desnudo
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        token_type = payload.get("type")
        if token_type != "access":
            raise HTTPException(status_code=401, detail="Tipo de token inválido")
    except HTTPException:
        raise
    except ExpiredSignatureError:
        logger.warning("Intento de acceso con token expirado")
        raise HTTPException(status_code=401, detail="El token ha expirado. Inicia sesión nuevamente.")
    except JWTError as e:
        logger.warning(f"JWT inválido detectado: {e}")
        raise HTTPException(status_code=401, detail="Token inválido")
    except Exception as e:
        logger.error(f"Error inesperado al validar token: {e}", exc_info=True)
        raise HTTPException(status_code=401, detail="Error al validar autenticación")

    if not username:
        raise HTTPException(status_code=401, detail="Token sin identidad")

    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    if not user.is_active:
        raise HTTPException(status_code=401, detail="Usuario desactivado")
    return user

def only_admin(current_user=Depends(get_current_user)):
    if not (current_user.is_admin or current_user.is_super_admin):
        raise HTTPException(status_code=403, detail="No autorizado")
    return current_user

def only_finance(current_user=Depends(get_current_user)):
    if not (current_user.is_admin or current_user.is_super_admin) and "finance" not in (current_user.modules or []):
        raise HTTPException(status_code=403, detail="No autorizado")
    return current_user

def require_module(module_id: str):
    """Exige acceso al modulo, respetando permisos generales y subsecciones."""
    def dependency(current_user=Depends(get_current_user)):
        if has_module_access(current_user, module_id):
            return current_user
        raise HTTPException(status_code=403, detail="No tienes acceso a este módulo")

    return dependency


def require_scoped_module(parent: str, path_rules: dict[str, str]):
    """Aplica el permiso de una subseccion según la ruta solicitada."""
    ordered_rules = sorted(path_rules.items(), key=lambda item: len(item[0]), reverse=True)

    def dependency(request: Request, current_user=Depends(get_current_user)):
        required = parent
        for path_prefix, module_id in ordered_rules:
            if request.url.path.startswith(path_prefix):
                required = module_id
                break
        if has_module_access(current_user, required):
            return current_user
        raise HTTPException(status_code=403, detail="No tienes acceso a esta sección")

    return dependency
