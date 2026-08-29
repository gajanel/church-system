# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.connection import get_db
from app.schemas.event_schema import EventCreate, EventUpdate, EventResponse
from app.services import event_service
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/events", tags=["events"])


@router.get("/", response_model=List[EventResponse])
def list_events(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2000),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return event_service.get_all_events(db, month=month, year=year)


@router.get("/summary")
def events_summary(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return event_service.get_events_summary(db)


@router.get("/upcoming")
def upcoming_events(
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return event_service.get_upcoming_events(db, limit=limit)


@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    event = event_service.get_event_by_id(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    return event


@router.post("/", response_model=EventResponse)
def create_event(data: EventCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return event_service.create_event(db, data)


@router.put("/{event_id}", response_model=EventResponse)
def update_event(
    event_id: int,
    data: EventUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    updated = event_service.update_event(db, event_id, data.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    return updated


@router.delete("/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    deleted = event_service.delete_event(db, event_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    return {"message": "Evento eliminado correctamente"}
