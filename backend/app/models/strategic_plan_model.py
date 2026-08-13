from sqlalchemy import Column, Integer, String, Text
from app.database.connection import Base
import json

class StrategicPlanArea(Base):
    __tablename__ = "strategic_plan_areas"

    id = Column(Integer, primary_key=True, index=True)
    area_id = Column(Integer, unique=True, index=True)
    name = Column(String, nullable=False)
    responsible = Column(String, nullable=False)
    
    # Store as JSON strings
    indicators_data = Column(Text, default="{}")
    commitments_data = Column(Text, default="{}")

    @property
    def indicators(self):
        try:
            return json.loads(self.indicators_data) if self.indicators_data else {}
        except:
            return {}

    @indicators.setter
    def indicators(self, value):
        self.indicators_data = json.dumps(value)

    @property
    def commitments(self):
        try:
            return json.loads(self.commitments_data) if self.commitments_data else {}
        except:
            return {}

    @commitments.setter
    def commitments(self, value):
        self.commitments_data = json.dumps(value)
