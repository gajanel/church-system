# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

import logging
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError, ExpiredSignatureError
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user_model import User
from app.utils.jwt import SECRET_KEY, ALGORITHM

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
    return user

def only_admin(current_user=Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="No autorizado")
    return current_user

def only_finance(current_user=Depends(get_current_user)):
    if not current_user.is_admin and "finance" not in (current_user.modules or []):
        raise HTTPException(status_code=403, detail="No autorizado")
    return current_user