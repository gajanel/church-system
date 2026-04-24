from sqlalchemy import Column, Integer, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from datetime import date
from app.database.connection import Base
from app.models.offering_type_model import OfferingType

class Offering(Base):
    __tablename__ = "offerings"

    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("members.id"), index=True)
    offering_type_id = Column(Integer, ForeignKey("offering_types.id"))
    amount = Column(Float, nullable=False)
    date = Column(Date, default=date.today, index=True)

    member = relationship("Member")
    offering_type = relationship("OfferingType")  # relación con la tabla offering_types
