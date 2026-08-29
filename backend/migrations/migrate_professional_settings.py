# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("Error: DATABASE_URL no encontrada.")
    exit(1)

engine = create_engine(DATABASE_URL)

def migrate():
    columns = [
        ("primary_color", "VARCHAR", "'#1e3a8a'"),
        ("secondary_color", "VARCHAR", "'#3b82f6'"),
        ("font_family", "VARCHAR", "'''Inter'', sans-serif'"),
        ("app_language", "VARCHAR", "'es'"),
        ("is_initialized", "INTEGER", "0")
    ]
    
    with engine.connect() as conn:
        print("Iniciando migración de la tabla 'settings'...")
        for col_name, col_type, default_val in columns:
            try:
                # PostgreSQL ALTER TABLE
                sql = text(f"ALTER TABLE settings ADD COLUMN {col_name} {col_type} DEFAULT {default_val};")
                conn.execute(sql)
                print(f"Columna '{col_name}' añadida con éxito.")
            except Exception as e:
                # Probablemente ya existe
                if "already exists" in str(e).lower():
                    print(f"Columna '{col_name}' ya existe, omitiendo.")
                else:
                    print(f"Error al añadir '{col_name}': {e}")
        
        # Limpiar defaults de church_name y bible_verse si son los antiguos
        conn.execute(text("UPDATE settings SET church_name = 'Mi Iglesia' WHERE church_name = 'Iglesia Acts 412';"))
        conn.execute(text("UPDATE settings SET bible_verse = '\"Porque de tal manera amó Dios al mundo...\" — Juan 3:16' WHERE bible_verse LIKE '%Hechos 4:12%';"))
        
        conn.commit()
        print("Migración completada con éxito.")

if __name__ == "__main__":
    migrate()
