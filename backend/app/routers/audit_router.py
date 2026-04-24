from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.services import audit_service
from app.schemas import audit_schema
from app.routers.user_router import get_current_user
from typing import List

router = APIRouter(prefix="/audit", tags=["Audit"])

@router.get("/", response_model=List[audit_schema.AuditLog])
def read_audit_logs(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="No tienes permisos para ver los logs de auditoría")
    return audit_service.get_audit_logs(db, skip=skip, limit=limit)
