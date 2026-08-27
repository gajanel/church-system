"""
Ministry Monthly Report Model
Stores the complete monthly statistical report submitted by a ministry.
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.connection import Base


MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]


class MinistryMonthlyReport(Base):
    """Full monthly report for a ministry."""
    __tablename__ = "ministry_monthly_reports"

    id = Column(Integer, primary_key=True, index=True)
    ministry_id = Column(Integer, ForeignKey("ministries.id", ondelete="CASCADE"), nullable=False)

    # ── Sección 1: Datos Generales ─────────────────────────────────────────
    reporter_name   = Column(String(150), nullable=False)
    report_month    = Column(String(20),  nullable=False)   # e.g. "Julio"
    ministry_name   = Column(String(150), nullable=False)   # name at time of report

    # ── Sección 2: Membresía Actual ────────────────────────────────────────
    mem_children    = Column(Integer, default=0)   # 4-12 años
    mem_teens       = Column(Integer, default=0)   # 13-17 años
    mem_youth       = Column(Integer, default=0)   # 18-35 años
    mem_women       = Column(Integer, default=0)   # mujeres 36-60
    mem_men         = Column(Integer, default=0)   # hombres 36-60
    mem_seniors     = Column(Integer, default=0)   # 61+

    # ── Sección 3: Promedio de Asistencia Mensual ──────────────────────────
    att_children    = Column(Integer, default=0)
    att_teens       = Column(Integer, default=0)
    att_youth       = Column(Integer, default=0)
    att_women       = Column(Integer, default=0)
    att_men         = Column(Integer, default=0)
    att_seniors     = Column(Integer, default=0)

    # ── Sección 4: Reporte General de Actividades ──────────────────────────
    act_scheduled   = Column(Integer, default=0)   # actividades agendadas
    act_done        = Column(Integer, default=0)   # actividades realizadas
    act_services    = Column(Integer, default=0)   # servicios
    act_fasts       = Column(Integer, default=0)   # ayunos
    act_visits      = Column(Integer, default=0)   # visitas
    act_sales       = Column(Integer, default=0)   # ventas
    act_reconciled  = Column(Integer, default=0)   # reconciliados
    act_meetings    = Column(Integer, default=0)   # reuniones de trabajo

    # ── Sección 5: Sermones Predicados ────────────────────────────────────
    sermon_week1    = Column(String(300), nullable=True)
    sermon_week2    = Column(String(300), nullable=True)
    sermon_week3    = Column(String(300), nullable=True)
    sermon_week4    = Column(String(300), nullable=True)
    sermon_week5    = Column(String(300), nullable=True)

    # ── Sección 6: Área Financiera ────────────────────────────────────────
    fin_offerings       = Column(Float, default=0.0)   # ingresos ofrendas
    fin_sales           = Column(Float, default=0.0)   # ingresos ventas
    fin_special         = Column(Float, default=0.0)   # ofrendas especiales
    fin_social_expense  = Column(Float, default=0.0)   # egresos acción social
    fin_project_expense = Column(Float, default=0.0)   # egresos proyectos especiales
    fin_report_url      = Column(String(500), nullable=True)  # adjunto PDF

    # ── Meta ──────────────────────────────────────────────────────────────
    created_by  = Column(String(100), nullable=True)
    created_at  = Column(DateTime, default=datetime.utcnow)

    ministry = relationship("Ministry")
