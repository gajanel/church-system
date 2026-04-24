from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.sql import func
from app.database.connection import Base

class Settings(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    church_name = Column(String, default="Mi Iglesia")
    church_address = Column(String, nullable=True)
    church_logo_url = Column(String, nullable=True)
    currency_symbol = Column(String, default="Q")
    monthly_expense_goal = Column(Float, default=0.0)
    bible_verse = Column(Text, nullable=True, default='"Porque de tal manera amó Dios al mundo..." — Juan 3:16')
    
    # Brand & Professional Customization
    primary_color = Column(String, default="#1e3a8a") # Navy Blue
    secondary_color = Column(String, default="#3b82f6") # Blue
    font_family = Column(String, default="'Inter', sans-serif")
    app_language = Column(String, default="es")
    is_initialized = Column(Integer, default=0) # 0 = New, 1 = Configured

    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
