from sqlalchemy import Column, Integer, String, Date, DateTime
from datetime import datetime
from app.database.connection import Base


class Member(Base):

    __tablename__ = "members"

    id = Column(Integer, primary_key=True, index=True)

    first_name = Column(String(100), nullable=False)

    last_name = Column(String(100), nullable=False, index=True)

    phone = Column(String(20))

    email = Column(String(100))

    address = Column(String(200))

    birth_date = Column(Date)

    baptism_date = Column(Date)

    status = Column(String(50), default="active", index=True)
    photo_url = Column(String(500), nullable=True)
    
    # Nuevos campos
    gender = Column(String(50), nullable=True)
    marital_status = Column(String(50), nullable=True)
    occupation = Column(String(100), nullable=True)
    join_date = Column(Date, nullable=True)
    emergency_contact = Column(String(100), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)