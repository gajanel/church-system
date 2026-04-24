from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Ministry(Base):
    __tablename__ = "ministries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    service_day = Column(String(20), nullable=True, unique=True)

    roles = relationship("MinistryRole", back_populates="ministry", cascade="all, delete")

class MinistryRole(Base):
    __tablename__ = "ministry_roles"

    id = Column(Integer, primary_key=True, index=True)
    ministry_id = Column(Integer, ForeignKey("ministries.id"), nullable=False)
    role = Column(String(50), nullable=False)

    ministry = relationship("Ministry", back_populates="roles")