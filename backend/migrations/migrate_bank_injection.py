"""
migrate_bank_injection.py
Crea la tabla bank_injections para el flujo Caja → Banco
"""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

DDL = """
CREATE TABLE IF NOT EXISTS bank_injections (
    id          SERIAL PRIMARY KEY,
    bank_name   VARCHAR(100)  NOT NULL,
    amount      FLOAT         NOT NULL,
    date        DATE          NOT NULL,
    slip_number VARCHAR(50),
    observations VARCHAR(300),
    image_url   VARCHAR(255),
    created_by  INTEGER       NOT NULL REFERENCES users(id),
    created_at  TIMESTAMP     DEFAULT NOW()
);
"""

with engine.connect() as conn:
    conn.execute(text(DDL))
    conn.commit()
    print("OK - Tabla bank_injections creada correctamente.")
