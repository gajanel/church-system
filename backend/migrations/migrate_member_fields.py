# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

from sqlalchemy import text
from app.database.connection import engine

def migrate(shared_engine=None):
    use_engine = shared_engine or engine
    print(f"Running migration 'member_fields'...")
    
    with use_engine.connect() as conn:
        try:
            # PostgreSQL supports ADD COLUMN IF NOT EXISTS
            conn.execute(text("ALTER TABLE members ADD COLUMN IF NOT EXISTS gender VARCHAR(50);"))
            conn.execute(text("ALTER TABLE members ADD COLUMN IF NOT EXISTS marital_status VARCHAR(50);"))
            conn.execute(text("ALTER TABLE members ADD COLUMN IF NOT EXISTS occupation VARCHAR(100);"))
            conn.execute(text("ALTER TABLE members ADD COLUMN IF NOT EXISTS join_date DATE;"))
            conn.execute(text("ALTER TABLE members ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(100);"))
            
            conn.commit()
            print("Migration 'member_fields' completed successfully.")
        except Exception as e:
            print(f"Error during migration 'member_fields': {e}")
            conn.rollback()

if __name__ == "__main__":
    migrate()

