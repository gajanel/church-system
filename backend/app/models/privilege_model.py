from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.connection import Base

# Configuración de días de servicio (¿Cuáles son participación general?)
class ServiceDayConfig(Base):
    __tablename__ = "service_day_configs"

    day_name = Column(String(20), primary_key=True)
    is_general = Column(Boolean, default=False)



# Catálogo dinámico de tipos de privilegios
class PrivilegeType(Base):
    __tablename__ = "privilege_types"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String(100), unique=True, nullable=False)
    category    = Column(String(100), nullable=False) # General, Liderazgo, etc.
    description = Column(String(200), nullable=True)
    ignore_ministry_day = Column(Integer, default=0) # 0=falso, 1=verdadero (Boolean simulado o real según DB)
    created_at  = Column(DateTime, default=datetime.utcnow)


# Qué privilegios puede realizar cada miembro
class MemberPrivilegeProfile(Base):
    __tablename__ = "member_privilege_profiles"

    id           = Column(Integer, primary_key=True, index=True)
    member_id    = Column(Integer, ForeignKey("members.id"), nullable=False)
    privilege    = Column(String(100), nullable=False)   # Nombre (redundancia historica/texto)
    privilege_id = Column(Integer, ForeignKey("privilege_types.id"), nullable=True)
    created_at   = Column(DateTime, default=datetime.utcnow)

    member = relationship("Member", foreign_keys=[member_id])
    privilege_type = relationship("PrivilegeType")


# Programa semanal de privilegios (una fila por privilegio/día/semana)
class WeeklyPrivilegeSchedule(Base):
    __tablename__ = "weekly_privilege_schedules"

    id           = Column(Integer, primary_key=True, index=True)
    week_start   = Column(Date, nullable=False)        # Lunes de la semana
    day_name     = Column(String(20), nullable=False)  # Martes, Viernes, Sábado, Domingo
    privilege    = Column(String(100), nullable=False) # Nombre (redundancia historica/texto)
    privilege_id = Column(Integer, ForeignKey("privilege_types.id"), nullable=True)
    member_id    = Column(Integer, ForeignKey("members.id"), nullable=True)
    notes        = Column(String(200), nullable=True)
    created_by   = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at   = Column(DateTime, default=datetime.utcnow)

    member          = relationship("Member", foreign_keys=[member_id])
    created_by_user = relationship("User", foreign_keys=[created_by])
    privilege_type  = relationship("PrivilegeType")
