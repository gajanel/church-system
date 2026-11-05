# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

from sqlalchemy import create_engine, text
from app.database.connection import DATABASE_URL

engine = create_engine(DATABASE_URL)

def check():
    with engine.connect() as conn:
        res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'ministries' AND column_name = 'service_day'"))
        row = res.fetchone()
        if row:
            print("Column 'service_day' exists.")
        else:
            print("Column 'service_day' DOES NOT exist.")

if __name__ == "__main__":
    check()
