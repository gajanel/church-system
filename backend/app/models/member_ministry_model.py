from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database.connection import Base

class MemberMinistry(Base):
    __tablename__ = "member_ministries"

    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("members.id", ondelete="CASCADE"), nullable=False)
    ministry_id = Column(Integer, ForeignKey("ministries.id", ondelete="CASCADE"), nullable=False)
    ministry_role_id = Column(Integer, ForeignKey("ministry_roles.id", ondelete="CASCADE"), nullable=False)

    __table_args__ = (
        UniqueConstraint("member_id", "ministry_id", name="uq_member_ministry"),
    )

    member = relationship("Member")
    ministry = relationship("Ministry")
    ministry_role = relationship("MinistryRole")