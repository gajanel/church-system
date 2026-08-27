import sqlite3
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def is_postgres():
    return DATABASE_URL and DATABASE_URL.startswith("postgresql")

def get_connection():
    if is_postgres():
        return psycopg2.connect(DATABASE_URL)
    else:
        # Extraer el path de sqlite:///...
        path = DATABASE_URL.replace("sqlite:///", "") if DATABASE_URL else "./church.db"
        return sqlite3.connect(path)

def migrate():
    conn = get_connection()
    cursor = conn.cursor()

    print("Iniciando migración de Usuarios y Miembros...")

    # Agregar member_id a users
    try:
        if is_postgres():
            cursor.execute("""
                ALTER TABLE users 
                ADD COLUMN member_id INTEGER REFERENCES members(id) ON DELETE SET NULL;
            """)
        else:
            cursor.execute("""
                ALTER TABLE users 
                ADD COLUMN member_id INTEGER REFERENCES members(id) ON DELETE SET NULL;
            """)
        print("OK: Columna 'member_id' agregada a 'users'")
    except Exception as e:
        print(f"Nota (member_id en users): {e}")

    # Agregar church_role a members
    try:
        if is_postgres():
            cursor.execute("""
                ALTER TABLE members 
                ADD COLUMN church_role VARCHAR(50) NULL;
            """)
        else:
            cursor.execute("""
                ALTER TABLE members 
                ADD COLUMN church_role VARCHAR(50) NULL;
            """)
        print("OK: Columna 'church_role' agregada a 'members'")
    except Exception as e:
        print(f"Nota (church_role en members): {e}")

    conn.commit()
    cursor.close()
    conn.close()
    print("Migración finalizada con éxito.")

if __name__ == "__main__":
    migrate()
