# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

from app.database.connection import engine
from sqlalchemy import text

def migrate(shared_engine=None):
    use_engine = shared_engine or engine
    with use_engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE members ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500);"))
            conn.commit()
            if not shared_engine:
                print("Migration 'photo_url' finished.")
        except Exception as e:
            print(f"Error during migration 'photo_url': {e}")

if __name__ == "__main__":
    migrate()
