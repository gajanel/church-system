from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.utils.dependencies import get_current_user, only_admin
from app.schemas.member_schema import MemberCreate, MemberUpdate, MemberResponse, MemberPaginatedResponse
from app.services import member_service
from app.services import member_ministry_service
from app.schemas.member_ministry_schema import MemberMinistryAssign
from app.models import member_ministry_model  # asegura que se cree la tabla
from app.services import audit_service
from app.schemas import audit_schema
import shutil
import os
import math
from uuid import uuid4
from typing import List

# Límite máximo de tamaño para fotos de miembros: 5 MB
MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024

router = APIRouter()

@router.get("/members", response_model=MemberPaginatedResponse)
def get_members(
    page: int = 1, 
    size: int = 50, 
    db: Session = Depends(get_db), 
    user=Depends(get_current_user)
):
    skip = (page - 1) * size
    items, total = member_service.get_all_members(db, skip=skip, limit=size)
    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "pages": math.ceil(total / size) if total > 0 else 0
    }

@router.get("/members/{member_id}", response_model=MemberResponse)
def get_member(member_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    member = member_service.get_member_by_id(db, member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")
    return member

@router.post("/members", response_model=MemberResponse)
def create_member(data: MemberCreate, db: Session = Depends(get_db), user=Depends(only_admin)):
    member = member_service.create_member(db, data)
    audit_service.create_audit_log(db, audit_schema.AuditLogCreate(
        user_id=user.id,
        action="CREATE",
        module="Miembros",
        description=f"Creó al miembro {member.first_name} {member.last_name}"
    ))
    return member

@router.put("/members/{member_id}", response_model=MemberResponse)
def update_member(member_id: int, data: MemberUpdate, db: Session = Depends(get_db), user=Depends(only_admin)):
    member = member_service.update_member(db, member_id, data)
    if not member:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")
    
    audit_service.create_audit_log(db, audit_schema.AuditLogCreate(
        user_id=user.id,
        action="UPDATE",
        module="Miembros",
        description=f"Actualizó información de {member.first_name} {member.last_name}"
    ))
    return member

@router.delete("/members/{member_id}")
def delete_member(member_id: int, db: Session = Depends(get_db), user=Depends(only_admin)):
    # Obtener el nombre antes de borrar
    member = member_service.get_member_by_id(db, member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")
    
    member_name = f"{member.first_name} {member.last_name}"
    deleted = member_service.delete_member(db, member_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Error al eliminar")
        
    audit_service.create_audit_log(db, audit_schema.AuditLogCreate(
        user_id=user.id,
        action="DELETE",
        module="Miembros",
        description=f"Eliminó al miembro {member_name}"
    ))
    return {"message": "Miembro eliminado correctamente"}

@router.post("/members/{member_id}/photo")
def upload_member_photo(
    member_id: int, 
    file: UploadFile = File(...), 
    db: Session = Depends(get_db), 
    user=Depends(only_admin)
):
    member = member_service.get_member_by_id(db, member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")

    # Validar tipo de archivo
    allowed_types = [".jpg", ".jpeg", ".png", ".webp"]
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in allowed_types:
        raise HTTPException(status_code=400, detail="Tipo de archivo no permitido. Use JPG, PNG o WEBP.")

    # Validar tamaño (máximo 5 MB)
    contents = file.file.read()
    if len(contents) > MAX_PHOTO_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="La imagen supera el tamaño máximo de 5 MB.")
    file.file.seek(0)  # Resetear el puntero para lectura posterior

    # Asegurar directorio
    os.makedirs("static/members", exist_ok=True)

    # Nombre único para el archivo
    filename = f"member_{member_id}_{uuid4().hex}{ext}"
    filepath = os.path.join("static/members", filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Guardar URL (relativa para que funcione en cualquier host)
    photo_url = f"/static/members/{filename}"
    member_service.update_member_photo(db, member_id, photo_url)

    return {"photo_url": photo_url}

@router.get("/members/{member_id}/ministries")
def get_member_ministries(member_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return member_ministry_service.get_member_ministries(db, member_id)

@router.post("/members/{member_id}/ministries")
def assign_ministry(member_id: int, data: MemberMinistryAssign, db: Session = Depends(get_db), user=Depends(only_admin)):
    result = member_ministry_service.assign_ministry(db, member_id, data)
    if not result:
        raise HTTPException(status_code=400, detail="El miembro ya pertenece a este ministerio")
    return result

@router.delete("/members/{member_id}/ministries/{member_ministry_id}")
def remove_ministry(member_id: int, member_ministry_id: int, db: Session = Depends(get_db), user=Depends(only_admin)):
    deleted = member_ministry_service.remove_ministry(db, member_ministry_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    return {"message": "Ministerio removido correctamente"}