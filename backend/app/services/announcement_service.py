from sqlalchemy.orm import Session
from app.models.announcement_model import Announcement
from app.schemas.announcement_schema import AnnouncementCreate, AnnouncementUpdate

def get_all(db: Session):
    return db.query(Announcement).order_by(Announcement.id.desc()).all()

def get_many(db: Session, ids: list[int]):
    return db.query(Announcement).filter(Announcement.id.in_(ids)).all()

def get_active_published(db: Session):
    return db.query(Announcement).filter(
        Announcement.is_published == True, 
        Announcement.is_active == True
    ).first()

def create(db: Session, data: AnnouncementCreate):
    obj = Announcement(**data.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def update(db: Session, ann_id: int, data: AnnouncementUpdate):
    obj = db.query(Announcement).filter(Announcement.id == ann_id).first()
    if not obj:
        return None
    update_data = data.dict(exclude_unset=True)
    for k, v in update_data.items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

def delete(db: Session, ann_id: int):
    obj = db.query(Announcement).filter(Announcement.id == ann_id).first()
    if obj:
        db.delete(obj)
        db.commit()
        return True
    return False

def publish(db: Session, ann_id: int):
    """Establece este anuncio como el único publicado."""
    # Despublicar todos
    db.query(Announcement).update({"is_published": False})
    
    # Publicar el indicado (si ann_id > 0)
    published_obj = None
    if ann_id > 0:
        obj = db.query(Announcement).filter(Announcement.id == ann_id).first()
        if obj:
            obj.is_published = True
            published_obj = obj
            
    db.commit()
    
    return published_obj
