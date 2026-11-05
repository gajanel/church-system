# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

from sqlalchemy.orm import Session
from app.models.attendance_model import Attendance, AttendanceRecord
from app.models.member_model import Member
from app.schemas.attendance_schema import AttendanceCreate, AttendanceUpdate
from app.models.member_ministry_model import MemberMinistry
from app.utils.attendance_demographics import age_group as age_group_for_member, normalize_gender
import json

def get_all(db: Session):
    return db.query(Attendance).order_by(Attendance.created_at.desc()).all()

def _classify_record(db: Session, record, attendance_date):
    gender = normalize_gender(getattr(record, "gender", None))
    age_group = getattr(record, "age_group", None)
    if record.person_type == "Miembro" and record.member_id:
        member = db.query(Member).filter(Member.id == record.member_id).first()
        if member:
            gender = normalize_gender(member.gender)
            age_group = age_group_for_member(member.birth_date, attendance_date)
    return gender, age_group


def _calculate_aggregates(db: Session, records_data, attendance_date):
    men = women = youth = children = teens = seniors = visitors = converts = 0
    total = len(records_data)
    
    for r in records_data:
        if getattr(r, "is_convert", False):
            converts += 1
            
        if r.person_type == "Visitante":
            visitors += 1

        gender, age_group = _classify_record(db, r, attendance_date)
        if age_group == "Niño":
            children += 1
        elif age_group == "Adolescente":
            teens += 1
        elif age_group == "Joven":
            youth += 1
        elif age_group == "Adulto Mayor":
            seniors += 1
        elif gender == "Masculino":
            men += 1
        elif gender == "Femenino":
            women += 1

    return men, women, youth, children, teens, seniors, visitors, converts, total

def create(db: Session, data: AttendanceCreate):
    records_data = data.records or []
    men, women, youth, children, teens, seniors, visitors, converts, total = _calculate_aggregates(db, records_data, data.date)
    
    db_obj = Attendance(
        date=data.date,
        service_type=data.service_type,
        men=men, women=women, youth=youth, children=children,
        teens=teens, seniors=seniors,
        visitors=visitors, converts=converts, total=total,
        notes=data.notes
    )
    db.add(db_obj)
    db.flush()
    
    for r in records_data:
        gender, age_group = _classify_record(db, r, data.date)
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
            gender=gender,
            age_group=age_group,
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
            record_date = data.date or db_obj.date
            gender, age_group = _classify_record(db, r, record_date)
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
                gender=gender,
                age_group=age_group,
                ministry_ids=json.dumps(m_ids)
            )
            db.add(rec)
        
        men, women, youth, children, teens, seniors, visitors, converts, total = _calculate_aggregates(
            db, data.records, data.date or db_obj.date
        )
        db_obj.men = men
        db_obj.women = women
        db_obj.youth = youth
        db_obj.children = children
        db_obj.teens = teens
        db_obj.seniors = seniors
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
