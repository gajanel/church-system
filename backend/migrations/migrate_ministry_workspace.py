# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

"""
Migration: Ministry Workspace Tables
Creates all tables for the ministry workspace module.
Supports both SQLite and PostgreSQL.
"""
from sqlalchemy import text

def migrate(engine):
    dialect = engine.url.drivername
    print(f"Running migration 'ministry_workspace' (Dialect: {dialect})...")
    
    # Types mapping
    PK = "SERIAL PRIMARY KEY" if "postgresql" in dialect else "INTEGER PRIMARY KEY AUTOINCREMENT"
    BOOL_DEFAULT_1 = "BOOLEAN NOT NULL DEFAULT TRUE" if "postgresql" in dialect else "BOOLEAN NOT NULL DEFAULT 1"
    BOOL_DEFAULT_0 = "BOOLEAN NOT NULL DEFAULT FALSE" if "postgresql" in dialect else "BOOLEAN NOT NULL DEFAULT 0"
    NOW = "CURRENT_TIMESTAMP"

    with engine.begin() as conn:
        # 1. Module config
        conn.execute(text(f"""
            CREATE TABLE IF NOT EXISTS ministry_module_configs (
                id          {PK},
                ministry_id INTEGER NOT NULL UNIQUE REFERENCES ministries(id) ON DELETE CASCADE,
                finance     {BOOL_DEFAULT_1},
                attendance  {BOOL_DEFAULT_1},
                work_plans  {BOOL_DEFAULT_1},
                gallery     {BOOL_DEFAULT_1},
                updated_at  TIMESTAMP DEFAULT {NOW}
            );
        """))

        # 2. Finance records
        conn.execute(text(f"""
            CREATE TABLE IF NOT EXISTS ministry_finance_records (
                id          {PK},
                ministry_id INTEGER NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,
                type        TEXT NOT NULL,
                category    TEXT NOT NULL,
                amount      REAL NOT NULL,
                description TEXT,
                date        TEXT NOT NULL,
                created_by  TEXT,
                created_at  TIMESTAMP DEFAULT {NOW}
            );
        """))

        # 3. Attendance sessions
        conn.execute(text(f"""
            CREATE TABLE IF NOT EXISTS ministry_attendance_sessions (
                id          {PK},
                ministry_id INTEGER NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,
                title       TEXT NOT NULL,
                date        TEXT NOT NULL,
                notes       TEXT,
                created_at  TIMESTAMP DEFAULT {NOW}
            );
        """))

        # 4. Attendance records
        conn.execute(text(f"""
            CREATE TABLE IF NOT EXISTS ministry_attendance_records (
                id         {PK},
                session_id INTEGER NOT NULL REFERENCES ministry_attendance_sessions(id) ON DELETE CASCADE,
                member_id  INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
                present    {BOOL_DEFAULT_1},
                note       TEXT
            );
        """))

        # 5. Work plans
        conn.execute(text(f"""
            CREATE TABLE IF NOT EXISTS ministry_work_plans (
                id          {PK},
                ministry_id INTEGER NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,
                title       TEXT NOT NULL,
                description TEXT,
                start_date  TEXT,
                end_date    TEXT,
                status      TEXT NOT NULL DEFAULT 'active',
                created_at  TIMESTAMP DEFAULT {NOW}
            );
        """))

        # 6. Work tasks
        conn.execute(text(f"""
            CREATE TABLE IF NOT EXISTS ministry_work_tasks (
                id          {PK},
                plan_id     INTEGER NOT NULL REFERENCES ministry_work_plans(id) ON DELETE CASCADE,
                title       TEXT NOT NULL,
                assigned_to TEXT,
                due_date    TEXT,
                completed   {BOOL_DEFAULT_0},
                created_at  TIMESTAMP DEFAULT {NOW}
            );
        """))

        # 7. Gallery
        conn.execute(text(f"""
            CREATE TABLE IF NOT EXISTS ministry_gallery_items (
                id            {PK},
                ministry_id   INTEGER NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,
                filename      TEXT NOT NULL,
                url           TEXT NOT NULL,
                caption       TEXT,
                activity_date TEXT,
                uploaded_by   TEXT,
                uploaded_at   TIMESTAMP DEFAULT {NOW}
            );
        """))

    print("✅ Migración ministry_workspace: completada.")
