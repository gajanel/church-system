from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey
from sqlalchemy.sql import func
from app.database.connection import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)  # e.g., "CREATE", "UPDATE", "DELETE", "LOGIN"
    module = Column(String, nullable=False)  # e.g., "Members", "Finance", "Settings"
    description = Column(String, nullable=True) # human readable description
    details = Column(JSON, nullable=True)    # optional technical details (old/new values)
    ip_address = Column(String, nullable=True)
    device = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
