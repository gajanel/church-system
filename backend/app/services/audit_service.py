from sqlalchemy.orm import Session
from app.models.audit_model import AuditLog
from app.models.user_model import User
from app.schemas.audit_schema import AuditLogCreate
from sqlalchemy import desc

def create_audit_log(db: Session, audit_in: AuditLogCreate):
    db_obj = AuditLog(**audit_in.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_audit_logs(db: Session, skip: int = 0, limit: int = 100):
    # Joineamos con User para obtener el nombre
    logs = db.query(AuditLog, User.name.label("user_name"))\
             .outerjoin(User, AuditLog.user_id == User.id)\
             .order_by(desc(AuditLog.created_at))\
             .offset(skip).limit(limit).all()
    
    # Mapeamos a un formato plano para el schema
    result = []
    for log, user_name in logs:
        log_dict = {c.name: getattr(log, c.name) for c in log.__table__.columns}
        log_dict["user_name"] = user_name or "Sistema / Desconocido"
        result.append(log_dict)
        
    return result
