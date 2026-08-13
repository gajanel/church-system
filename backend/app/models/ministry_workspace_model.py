"""
Ministry Workspace Models
Each ministry has its own configurable sub-modules:
  - finance   : income/expense tracking per ministry
  - attendance: session-based attendance register
  - work_plans: task/plan management
  - gallery   : photo uploads from activities
"""
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime,
    ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.connection import Base


# ── Sub-module configuration per Ministry ─────────────────────────────
class MinistryModuleConfig(Base):
    """Admin-controlled feature flags per ministry."""
    __tablename__ = "ministry_module_configs"

    id            = Column(Integer, primary_key=True, index=True)
    ministry_id   = Column(Integer, ForeignKey("ministries.id", ondelete="CASCADE"), unique=True, nullable=False)
    finance       = Column(Boolean, default=True)
    attendance    = Column(Boolean, default=True)
    work_plans    = Column(Boolean, default=True)
    gallery       = Column(Boolean, default=True)
    updated_at    = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    ministry = relationship("Ministry")


# ── Ministry Finance ───────────────────────────────────────────────────
class MinistryFinanceRecord(Base):
    """Income/expense records scoped to a ministry."""
    __tablename__ = "ministry_finance_records"

    id            = Column(Integer, primary_key=True, index=True)
    ministry_id   = Column(Integer, ForeignKey("ministries.id", ondelete="CASCADE"), nullable=False)
    type          = Column(String(10), nullable=False)   # "income" | "expense"
    category      = Column(String(80), nullable=False)
    amount        = Column(Float, nullable=False)
    description   = Column(String(255), nullable=True)
    date          = Column(String(20), nullable=False)   # ISO date string
    created_by    = Column(String(100), nullable=True)
    created_at    = Column(DateTime, default=datetime.utcnow)

    ministry = relationship("Ministry")


# ── Ministry Attendance ─────────────────────────────────────────────────
class MinistryAttendanceSession(Base):
    """One attendance session (e.g. a meeting or activity)."""
    __tablename__ = "ministry_attendance_sessions"

    id            = Column(Integer, primary_key=True, index=True)
    ministry_id   = Column(Integer, ForeignKey("ministries.id", ondelete="CASCADE"), nullable=False)
    title         = Column(String(150), nullable=False)
    date          = Column(String(20), nullable=False)
    notes         = Column(Text, nullable=True)
    created_at    = Column(DateTime, default=datetime.utcnow)

    ministry = relationship("Ministry")
    records  = relationship("MinistryAttendanceRecord", back_populates="session", cascade="all, delete")


class MinistryAttendanceRecord(Base):
    """Presence/absence per member in a session."""
    __tablename__ = "ministry_attendance_records"

    id            = Column(Integer, primary_key=True, index=True)
    session_id    = Column(Integer, ForeignKey("ministry_attendance_sessions.id", ondelete="CASCADE"), nullable=False)
    member_id     = Column(Integer, ForeignKey("members.id", ondelete="CASCADE"), nullable=False)
    present       = Column(Boolean, default=True)
    note          = Column(String(200), nullable=True)

    session = relationship("MinistryAttendanceSession", back_populates="records")
    member  = relationship("Member")


# ── Ministry Work Plans ────────────────────────────────────────────────
class MinistryWorkPlan(Base):
    """A plan or project within a ministry."""
    __tablename__ = "ministry_work_plans"

    id            = Column(Integer, primary_key=True, index=True)
    ministry_id   = Column(Integer, ForeignKey("ministries.id", ondelete="CASCADE"), nullable=False)
    title         = Column(String(200), nullable=False)
    description   = Column(Text, nullable=True)
    start_date    = Column(String(20), nullable=True)
    end_date      = Column(String(20), nullable=True)
    status        = Column(String(20), default="active")  # active | completed | paused
    created_at    = Column(DateTime, default=datetime.utcnow)

    ministry = relationship("Ministry")
    tasks    = relationship("MinistryWorkTask", back_populates="plan", cascade="all, delete")


class MinistryWorkTask(Base):
    """Task inside a work plan."""
    __tablename__ = "ministry_work_tasks"

    id            = Column(Integer, primary_key=True, index=True)
    plan_id       = Column(Integer, ForeignKey("ministry_work_plans.id", ondelete="CASCADE"), nullable=False)
    title         = Column(String(200), nullable=False)
    assigned_to   = Column(String(100), nullable=True)
    due_date      = Column(String(20), nullable=True)
    completed     = Column(Boolean, default=False)
    created_at    = Column(DateTime, default=datetime.utcnow)

    plan = relationship("MinistryWorkPlan", back_populates="tasks")


# ── Ministry Gallery ───────────────────────────────────────────────────
class MinistryGalleryItem(Base):
    """Photo or file uploaded from a ministry activity."""
    __tablename__ = "ministry_gallery_items"

    id            = Column(Integer, primary_key=True, index=True)
    ministry_id   = Column(Integer, ForeignKey("ministries.id", ondelete="CASCADE"), nullable=False)
    filename      = Column(String(255), nullable=False)
    url           = Column(String(500), nullable=False)
    caption       = Column(String(300), nullable=True)
    activity_date = Column(String(20), nullable=True)
    uploaded_by   = Column(String(100), nullable=True)
    uploaded_at   = Column(DateTime, default=datetime.utcnow)

    ministry = relationship("Ministry")
