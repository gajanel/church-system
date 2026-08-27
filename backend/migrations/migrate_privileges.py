from sqlalchemy import create_engine, text
from app.database.connection import DATABASE_URL

engine = create_engine(DATABASE_URL)

def migrate():
    with engine.connect() as conn:
        print("Checking tables...")
        
        # 1. Asegurar que la tabla privilege_types existe
        # (SQLAlchemy create_all ya debería haberla creado, pero por si acaso)
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS privilege_types (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                category VARCHAR(100) NOT NULL,
                description VARCHAR(200),
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
            )
        """))
        print("Table 'privilege_types' is ready.")

        # 2. Agregar columna privilege_id a member_privilege_profiles
        try:
            conn.execute(text("ALTER TABLE member_privilege_profiles ADD COLUMN privilege_id INTEGER REFERENCES privilege_types(id)"))
            print("Added 'privilege_id' to 'member_privilege_profiles'.")
        except Exception as e:
            if "already exists" in str(e).lower() or "existe" in str(e).lower():
                print("Column 'privilege_id' already exists in 'member_privilege_profiles'.")
            else:
                print(f"Error adding column to member_privilege_profiles: {e}")
        
        # 3. Agregar columna privilege_id a weekly_privilege_schedules
        try:
            conn.execute(text("ALTER TABLE weekly_privilege_schedules ADD COLUMN privilege_id INTEGER REFERENCES privilege_types(id)"))
            print("Added 'privilege_id' to 'weekly_privilege_schedules'.")
        except Exception as e:
            if "already exists" in str(e).lower() or "existe" in str(e).lower():
                print("Column 'privilege_id' already exists in 'weekly_privilege_schedules'.")
            else:
                print(f"Error adding column to weekly_privilege_schedules: {e}")

        conn.commit()
        print("Migration completed successfully.")

if __name__ == "__main__":
    migrate()
