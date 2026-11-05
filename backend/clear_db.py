# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, MetaData, text
from sqlalchemy.orm import sessionmaker

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def clear_db():
    meta = MetaData()
    meta.reflect(bind=engine)
    
    with engine.connect() as conn:
        print("Borrando datos...")
        with conn.begin():
            # Get all table names
            tables = list(meta.tables.keys())
            
            # Disable triggers/constraints for dropping if needed, but CASCADE works better
            # However, we want to KEEP the admin user in `users`.
            
            # We can't TRUNCATE CASCADE if we want to keep some rows in `users`, 
            # unless we truncate everything and then recreate the admin.
            # Let's see if we can just delete from tables in reverse dependency order or use CASCADE for DELETE.
            # In PostgreSQL, we can't DELETE with CASCADE natively unless the FK has ON DELETE CASCADE.
            
            # Let's truncate all tables EXCEPT users
            tables_to_truncate = [t for t in tables if t != 'users']
            
            if tables_to_truncate:
                conn.execute(text(f"TRUNCATE {', '.join(tables_to_truncate)} CASCADE;"))
                print(f"Tablas truncadas: {', '.join(tables_to_truncate)}")
            
            # Now, delete all non-admin users
            res = conn.execute(text("DELETE FROM users WHERE is_super_admin = false;"))
            print("Usuarios no admin eliminados.")
            
if __name__ == "__main__":
    clear_db()
    print("✅ Base de datos limpiada. El usuario admin se ha conservado.")
