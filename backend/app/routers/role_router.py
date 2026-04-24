# role_router.py
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.services.role_service import create_role, get_roles
from app.schemas.role_schema import RoleCreate, RoleResponse

router = APIRouter()

@router.post("/roles")
def create_new_role(role: RoleCreate, db: Session = Depends(get_db)):
    try:
        new_role = create_role(db, role.name)
        return new_role
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/roles", response_model=List[RoleResponse])
def list_roles(db: Session = Depends(get_db)):
    return get_roles(db)