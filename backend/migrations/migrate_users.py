# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

from sqlalchemy import text
from app.database.connection import engine

def migrate(shared_engine=None):
    use_engine = shared_engine or engine
    with use_engine.connect() as conn:
        try:
            # 1. Agregar username y must_change_password
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR UNIQUE;"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT TRUE;"))
            
            # Poblar username con una versión normalizada del nombre si está vacío
            conn.execute(text("UPDATE users SET username = LOWER(REPLACE(name, ' ', '')) WHERE username IS NULL;"))
            
            # El administrador existente (id 1 etc) no debe estar obligado a cambiar su clave inicial si ya la usaba normal
            conn.execute(text("UPDATE users SET must_change_password = FALSE WHERE is_admin = TRUE;"))
            
            conn.commit()
            if not shared_engine:
                print("Migration 'users' finished.")
        except Exception as e:
            print(f"Error during migration 'users': {e}")
            conn.rollback()

if __name__ == "__main__":
    migrate()
