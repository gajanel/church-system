# Copyright (c) 2024-2026 GEAG.
from sqlalchemy import text

def migrate(engine):
    sql = (
        "CREATE TABLE IF NOT EXISTS bank_withdrawals "
        "(id SERIAL PRIMARY KEY,"
        " bank_account_id INTEGER REFERENCES bank_accounts(id) ON DELETE SET NULL,"
        " amount FLOAT NOT NULL,"
        " date DATE NOT NULL,"
        " concept VARCHAR(200) NOT NULL,"
        " reference_number VARCHAR(100),"
        " observations VARCHAR(300),"
        " image_url VARCHAR(255),"
        " created_by INTEGER NOT NULL REFERENCES users(id),"
        " created_at TIMESTAMP DEFAULT NOW());"
    )
    with engine.connect() as conn:
        conn.execute(text(sql))
        conn.commit()
    print("OK - Tabla bank_withdrawals creada/verificada.")
