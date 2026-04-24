from sqlalchemy.orm import Session
from sqlalchemy import extract
from app.models.event_model import Event
from app.schemas.event_schema import EventCreate, EventUpdate
from datetime import datetime
from typing import Optional


def get_all_events(db: Session, month: Optional[int] = None, year: Optional[int] = None):
    query = db.query(Event)
    if month and year:
        query = query.filter(
            extract("month", Event.start_datetime) == month,
            extract("year", Event.start_datetime) == year,
        )
    return query.order_by(Event.start_datetime.asc()).all()


def get_event_by_id(db: Session, event_id: int):
    return db.query(Event).filter(Event.id == event_id).first()


def create_event(db: Session, data: EventCreate):
    event = Event(**data.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def update_event(db: Session, event_id: int, data: dict):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        return None
    for key, value in data.items():
        if value is not None:
            setattr(event, key, value)
    event.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(event)
    return event


def delete_event(db: Session, event_id: int):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        return False
    db.delete(event)
    db.commit()
    return True


def get_upcoming_events(db: Session, limit: int = 5):
    now = datetime.utcnow()
    return (
        db.query(Event)
        .filter(Event.start_datetime >= now)
        .filter(Event.status != "Cancelado")
        .order_by(Event.start_datetime.asc())
        .limit(limit)
        .all()
    )


def get_events_summary(db: Session):
    all_events = db.query(Event).all()
    now = datetime.utcnow()
    return {
        "total": len(all_events),
        "programados": sum(1 for e in all_events if e.status == "Programado"),
        "completados": sum(1 for e in all_events if e.status == "Completado"),
        "cancelados": sum(1 for e in all_events if e.status == "Cancelado"),
        "proximos": sum(1 for e in all_events if e.start_datetime >= now and e.status == "Programado"),
    }
