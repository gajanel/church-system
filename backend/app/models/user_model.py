from sqlalchemy import Column, Integer, String, Boolean, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.database.connection import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    username = Column(String, unique=True, nullable=True)
    email = Column(String, nullable=False)
    password = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False)
    is_super_admin = Column(Boolean, default=False)
    modules = Column(JSON, default=list)
    must_change_password = Column(Boolean, default=True)
    member_id = Column(Integer, ForeignKey("members.id", ondelete="SET NULL"), nullable=True)

    member = relationship("Member")