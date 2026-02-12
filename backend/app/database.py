import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("NEON_DB")

if not DATABASE_URL:
    print("❌ ERROR: NEON_DB environment variable is not set!")
    # In local dev we might fallback, but for safety:
    DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/postgres"

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
