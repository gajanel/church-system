# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.schemas.offering_schema import OfferingCreate
from app.services.offering_service import create_offering, get_offerings

router = APIRouter()


@router.post("/offerings")
def register_offering(offering: OfferingCreate, db: Session = Depends(get_db)):

    return create_offering(db, offering)


@router.get("/offerings")
def list_offerings(db: Session = Depends(get_db)):

    return get_offerings(db)