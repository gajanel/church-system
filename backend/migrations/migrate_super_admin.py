# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

import os
import sys
from sqlalchemy import create_engine, text

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.database.connection import DATABASE_URL

def migrate():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN is_super_admin BOOLEAN DEFAULT FALSE"))
            conn.execute(text("UPDATE users SET is_super_admin = TRUE WHERE id = 1")) # Make first user super admin
            conn.commit()
            print("✅ Columna 'is_super_admin' agregada exitosamente a 'users'")
        except Exception as e:
            print(f"⚠️ Error (quizás ya existe): {e}")

if __name__ == "__main__":
    migrate()
