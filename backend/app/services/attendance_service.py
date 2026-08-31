# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

from sqlalchemy.orm import Session
from app.models.attendance_model import Attendance, AttendanceRecord
from app.models.member_model import Member
from app.schemas.attendance_schema import AttendanceCreate, AttendanceUpdate
from app.models.member_ministry_model import MemberMinistry
from datetime import date
import json

def get_all(db: Session):
    return db.query(Attendance).order_by(Attendance.created_at.desc()).all()

def _calculate_aggregates(db: Session, records_data):
    men = women = youth = children = visitors = converts = 0
    total = len(records_data)
    
    for r in records_data:
        if getattr(r, "is_convert", False):
            converts += 1
            
        if r.person_type == "Visitante":
            visitors += 1
        elif r.person_type == "Miembro" and r.member_id:
            member = db.query(Member).filter(Member.id == r.member_id).first()
            if member:
                age = 30
                if member.birth_date:
                    today = date.today()
                    age = today.year - member.birth_date.year - ((today.month, today.day) < (member.birth_date.month, member.birth_date.day))
                
                if age < 13:
                    children += 1
                elif age < 30:
                    youth += 1
                else:
                    if member.gender == "Masculino":
                        men += 1
                    else:
                        women += 1

    return men, women, youth, children, visitors, converts, total

def create(db: Session, data: AttendanceCreate):
    records_data = data.records or []
    men, women, youth, children, visitors, converts, total = _calculate_aggregates(db, records_data)
    
    db_obj = Attendance(
        date=data.date,
        service_type=data.service_type,
        men=men, women=women, youth=youth, children=children,
        visitors=visitors, converts=converts, total=total,
        notes=data.notes
    )
    db.add(db_obj)
    db.flush()
    
    for r in records_data:
        m_ids = []
        if r.person_type == "Miembro" and r.member_id:
            mms = db.query(MemberMinistry).filter(MemberMinistry.member_id == r.member_id).all()
            m_ids = [mm.ministry_id for mm in mms]
            
        rec = AttendanceRecord(
            attendance_id=db_obj.id,
            member_id=r.member_id,
            person_type=r.person_type,
            person_name=r.person_name,
            is_convert=r.is_convert,
            ministry_ids=json.dumps(m_ids)
        )
        db.add(rec)
        
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update(db: Session, attendance_id: int, data: AttendanceUpdate):
    db_obj = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not db_obj:
        return None
    
    if data.date: db_obj.date = data.date
    if data.service_type: db_obj.service_type = data.service_type
    if data.notes is not None: db_obj.notes = data.notes
    
    if data.records is not None:
        db.query(AttendanceRecord).filter(AttendanceRecord.attendance_id == attendance_id).delete()
        for r in data.records:
            m_ids = []
            if r.person_type == "Miembro" and r.member_id:
                mms = db.query(MemberMinistry).filter(MemberMinistry.member_id == r.member_id).all()
                m_ids = [mm.ministry_id for mm in mms]

            rec = AttendanceRecord(
                attendance_id=db_obj.id,
                member_id=r.member_id,
                person_type=r.person_type,
                person_name=r.person_name,
                is_convert=r.is_convert,
                ministry_ids=json.dumps(m_ids)
            )
            db.add(rec)
        
        men, women, youth, children, visitors, converts, total = _calculate_aggregates(db, data.records)
        db_obj.men = men
        db_obj.women = women
        db_obj.youth = youth
        db_obj.children = children
        db_obj.visitors = visitors
        db_obj.converts = converts
        db_obj.total = total
    
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
