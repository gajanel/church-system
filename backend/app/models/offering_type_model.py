from sqlalchemy import Column, Integer, String
from app.database.connection import Base

class OfferingType(Base):
    __tablename__ = "offering_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(200), nullable=True)
