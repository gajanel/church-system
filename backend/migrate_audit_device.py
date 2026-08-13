import os
import sys
from sqlalchemy import create_engine, text

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.database.connection import DATABASE_URL

def migrate():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE audit_logs ADD COLUMN device VARCHAR"))
            conn.commit()
            print("✅ Columna 'device' agregada exitosamente a 'audit_logs'")
        except Exception as e:
            print(f"⚠️ Error (quizás ya existe): {e}")

if __name__ == "__main__":
    migrate()
