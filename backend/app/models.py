from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from datetime import datetime
from app.database import Base

class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    language = Column(String, nullable=False)
    transcript = Column(Text, nullable=False)
    summary = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)