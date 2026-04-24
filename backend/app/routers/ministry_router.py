from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.connection import get_db
from app.utils.dependencies import get_current_user, only_admin
from app.schemas.ministry_schema import MinistryCreate, MinistryUpdate, MinistryResponse
from app.services import ministry_service

router = APIRouter()

@router.get("/ministries")
def get_ministries(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return ministry_service.get_all_ministries(db)

@router.get("/ministries/{ministry_id}")
def get_ministry(ministry_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    m = ministry_service.get_ministry_by_id(db, ministry_id)
    if not m:
        raise HTTPException(status_code=404, detail="Ministerio no encontrado")
    return m

@router.post("/ministries")
def create_ministry(data: MinistryCreate, db: Session = Depends(get_db), user=Depends(only_admin)):
    return ministry_service.create_ministry(db, data)

@router.put("/ministries/{ministry_id}")
def update_ministry(ministry_id: int, data: MinistryUpdate, db: Session = Depends(get_db), user=Depends(only_admin)):
    m = ministry_service.update_ministry(db, ministry_id, data)
    if not m:
        raise HTTPException(status_code=404, detail="Ministerio no encontrado")
    return m

@router.delete("/ministries/{ministry_id}")
def delete_ministry(ministry_id: int, db: Session = Depends(get_db), user=Depends(only_admin)):
    deleted = ministry_service.delete_ministry(db, ministry_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Ministerio no encontrado")
    return {"message": "Ministerio eliminado correctamente"}

@router.get("/ministries/{ministry_id}/roles")
def get_ministry_roles(ministry_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    from app.models.ministry_model import MinistryRole
    roles = db.query(MinistryRole).filter(MinistryRole.ministry_id == ministry_id).all()
    return roles