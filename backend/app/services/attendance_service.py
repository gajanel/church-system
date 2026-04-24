from sqlalchemy.orm import Session
from app.models.attendance_model import Attendance
from app.schemas.attendance_schema import AttendanceCreate, AttendanceUpdate
from datetime import date

def get_all(db: Session):
    return db.query(Attendance).order_by(Attendance.created_at.desc()).all()

def create(db: Session, data: AttendanceCreate):
    # Calculate total
    total = data.men + data.women + data.youth + data.children + data.visitors
    
    db_obj = Attendance(
        date=data.date,
        service_type=data.service_type,
        men=data.men,
        women=data.women,
        youth=data.youth,
        children=data.children,
        visitors=data.visitors,
        converts=data.converts,
        total=total,
        notes=data.notes
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update(db: Session, attendance_id: int, data: AttendanceUpdate):
    db_obj = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not db_obj:
        return None
    
    update_data = data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_obj, key, value)
        
    # Recalculate total if any of the counts changed
    db_obj.total = db_obj.men + db_obj.women + db_obj.youth + db_obj.children + db_obj.visitors
    
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete(db: Session, attendance_id: int):
    db_obj = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if db_obj:
        db.delete(db_obj)
        db.commit()
        return True
    return False
