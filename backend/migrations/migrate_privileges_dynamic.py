# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

from app.database.connection import engine as default_engine
from sqlalchemy import text

def migrate(shared_engine=None):
    use_engine = shared_engine or default_engine
    with use_engine.connect() as conn:
        if not shared_engine:
            print("Migrating Dynamic Privilege Rules...")
        
        # 1. Add ignore_ministry_day to privilege_types
        res = conn.execute(text("""
            SELECT count(*) FROM information_schema.columns 
            WHERE table_name='privilege_types' AND column_name='ignore_ministry_day'
        """)).scalar()
        
        if res == 0:
            try:
                conn.execute(text("ALTER TABLE privilege_types ADD COLUMN ignore_ministry_day INTEGER DEFAULT 0"))
                conn.commit()
            except Exception as e:
                print(f"Error adding column to privilege_types: {e}")
        
        # 2. Create service_day_configs table
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS service_day_configs (
                    day_name VARCHAR(20) PRIMARY KEY,
                    is_general BOOLEAN DEFAULT FALSE
                )
            """))
            conn.commit()
        except Exception as e:
            print(f"Error creating table service_day_configs: {e}")
        
        # 3. Seed service_day_configs
        days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
        for d in days:
            try:
                is_gen = (d == "Domingo")
                conn.execute(text("INSERT INTO service_day_configs (day_name, is_general) VALUES (:d, :gen) ON CONFLICT (day_name) DO NOTHING"), {"d": d, "gen": is_gen})
                conn.commit()
            except Exception as e:
                print(f"Error seeding day {d}: {e}")

        if not shared_engine:
            print("Migration 'privileges_dynamic' completed successfully.")

if __name__ == "__main__":
    migrate()
