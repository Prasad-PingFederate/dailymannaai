from sqlalchemy import create_engine, Column, Integer, String, Text, JSON, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost/dailymanna")
DATABASE_URL = "sqlite:///./dailymanna.db" # Default for local testing
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Content(Base):
    __tablename__ = "content"
    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String, unique=True, index=True)
    title = Column(String)
    text = Column(Text)
    source_type = Column(String)
    source_name = Column(String)
    url = Column(String)
    published_at = Column(DateTime)
    topics = Column(JSON)
    raw_metadata = Column(JSON)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'text': self.text[:500] + '...' if len(self.text) > 500 else self.text,  # truncate for preview
            'source_type': self.source_type,
            'source_name': self.source_name,
            'url': self.url,
            'published_at': self.published_at.isoformat() if self.published_at else None,
            'topics': self.topics,
        }

Base.metadata.create_all(bind=engine)
