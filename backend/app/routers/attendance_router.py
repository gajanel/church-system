from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.connection import get_db
from app.utils.dependencies import get_current_user
from app.schemas.attendance_schema import AttendanceCreate, AttendanceUpdate, AttendanceResponse
from app.services import attendance_service

router = APIRouter(prefix="/attendance", tags=["Attendance"])

@router.get("", response_model=List[AttendanceResponse])
def get_attendance(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return attendance_service.get_all(db)

@router.post("", response_model=AttendanceResponse)
def create_attendance(data: AttendanceCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return attendance_service.create(db, data)

@router.put("/{attendance_id}", response_model=AttendanceResponse)
def update_attendance(attendance_id: int, data: AttendanceUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    updated = attendance_service.update(db, attendance_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    return updated

@router.delete("/{attendance_id}")
def delete_attendance(attendance_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if not attendance_service.delete(db, attendance_id):
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    return {"message": "Registro eliminado"}
