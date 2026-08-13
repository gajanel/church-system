"""
Migration: Fix Ministry Delete (PostgreSQL Robust)
Finds and recreates foreign keys with ON DELETE CASCADE.
"""
from sqlalchemy import text

def get_fk_name(conn, table, column):
    query = text(f"""
        SELECT tc.constraint_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = '{table}'
          AND kcu.column_name = '{column}';
    """)
    result = conn.execute(query).fetchone()
    return result[0] if result else None

def migrate(engine):
    dialect = engine.url.drivername
    print(f"Fixing ministry foreign keys (Dialect: {dialect})...")
    
    if "sqlite" in dialect:
        # SQLite logic (same as before)
        import sqlite3
        db_path = "church.db"
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            cursor.execute("PRAGMA foreign_keys=OFF;")
            
            # Roles
            cursor.execute("SELECT id, ministry_id, role FROM ministry_roles;")
            roles_data = cursor.fetchall()
            cursor.execute("DROP TABLE IF EXISTS ministry_roles_old;")
            cursor.execute("ALTER TABLE ministry_roles RENAME TO ministry_roles_old;")
            cursor.execute("""
                CREATE TABLE ministry_roles (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ministry_id INTEGER NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,
                    role TEXT NOT NULL
                );
            """)
            cursor.executemany("INSERT INTO ministry_roles (id, ministry_id, role) VALUES (?, ?, ?);", roles_data)
            cursor.execute("DROP TABLE ministry_roles_old;")
            
            # Member Ministries
            cursor.execute("SELECT id, member_id, ministry_id, ministry_role_id FROM member_ministries;")
            mm_data = cursor.fetchall()
            cursor.execute("DROP TABLE IF EXISTS member_ministries_old;")
            cursor.execute("ALTER TABLE member_ministries RENAME TO member_ministries_old;")
            cursor.execute("""
                CREATE TABLE member_ministries (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
                    ministry_id INTEGER NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,
                    ministry_role_id INTEGER NOT NULL REFERENCES ministry_roles(id) ON DELETE CASCADE,
                    UNIQUE(member_id, ministry_id)
                );
            """)
            cursor.executemany("INSERT INTO member_ministries (id, member_id, ministry_id, ministry_role_id) VALUES (?, ?, ?, ?);", mm_data)
            cursor.execute("DROP TABLE member_ministries_old;")
            
            cursor.execute("PRAGMA foreign_keys=ON;")
            conn.commit()
            conn.close()
            print("✅ Migración fix_ministry_delete (SQLite): completada.")
        except Exception as e:
            print(f"❌ Error en migración fix_ministry_delete (SQLite): {e}")
    else:
        # PostgreSQL logic - More robust
        try:
            with engine.begin() as conn:
                # 1. ministry_roles -> ministries
                fk = get_fk_name(conn, 'ministry_roles', 'ministry_id')
                if fk:
                    print(f"  Dropping {fk} on ministry_roles...")
                    conn.execute(text(f"ALTER TABLE ministry_roles DROP CONSTRAINT {fk};"))
                conn.execute(text("ALTER TABLE ministry_roles ADD CONSTRAINT ministry_roles_ministry_id_fkey FOREIGN KEY (ministry_id) REFERENCES ministries(id) ON DELETE CASCADE;"))

                # 2. member_ministries -> members
                fk = get_fk_name(conn, 'member_ministries', 'member_id')
                if fk:
                    print(f"  Dropping {fk} on member_ministries...")
                    conn.execute(text(f"ALTER TABLE member_ministries DROP CONSTRAINT {fk};"))
                conn.execute(text("ALTER TABLE member_ministries ADD CONSTRAINT member_ministries_member_id_fkey FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;"))

                # 3. member_ministries -> ministries
                fk = get_fk_name(conn, 'member_ministries', 'ministry_id')
                if fk:
                    print(f"  Dropping {fk} on member_ministries...")
                    conn.execute(text(f"ALTER TABLE member_ministries DROP CONSTRAINT {fk};"))
                conn.execute(text("ALTER TABLE member_ministries ADD CONSTRAINT member_ministries_ministry_id_fkey FOREIGN KEY (ministry_id) REFERENCES ministries(id) ON DELETE CASCADE;"))

                # 4. member_ministries -> ministry_roles
                fk = get_fk_name(conn, 'member_ministries', 'ministry_role_id')
                if fk:
                    print(f"  Dropping {fk} on member_ministries...")
                    conn.execute(text(f"ALTER TABLE member_ministries DROP CONSTRAINT {fk};"))
                conn.execute(text("ALTER TABLE member_ministries ADD CONSTRAINT member_ministries_ministry_role_id_fkey FOREIGN KEY (ministry_role_id) REFERENCES ministry_roles(id) ON DELETE CASCADE;"))

            print("✅ Migración fix_ministry_delete (PostgreSQL): completada.")
        except Exception as e:
            print(f"❌ Error en migración fix_ministry_delete (PostgreSQL): {e}")

if __name__ == "__main__":
    from app.database.connection import engine
    migrate(engine)
