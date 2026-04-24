import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL no está definida. Verifica tu archivo .env")

engine = create_engine(
    DATABASE_URL,
    pool_size=5,          # conexiones persistentes en el pool
    max_overflow=10,      # conexiones extra bajo carga
    pool_pre_ping=True,   # verifica que la conexión esté viva antes de usarla
    pool_recycle=1800,    # recicla conexiones cada 30 min
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