"""
Migration: Create ministry_monthly_reports table and add monthly_report
column to ministry_module_configs.
Supports both SQLite and PostgreSQL.
"""
import logging
from sqlalchemy import text, inspect

logger = logging.getLogger("church_system")


def migrate(engine):
    dialect = engine.url.drivername
    is_pg = "postgresql" in dialect

    PK            = "SERIAL PRIMARY KEY"           if is_pg else "INTEGER PRIMARY KEY AUTOINCREMENT"
    BOOL_TRUE     = "BOOLEAN NOT NULL DEFAULT TRUE" if is_pg else "BOOLEAN NOT NULL DEFAULT 1"
    FLOAT_DEFAULT = "DOUBLE PRECISION DEFAULT 0.0"  if is_pg else "FLOAT DEFAULT 0.0"
    NOW           = "CURRENT_TIMESTAMP"

    logger.info(f"📋 Ejecutando migración ministry_monthly_reports (dialecto: {dialect})...")

    with engine.begin() as conn:
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()

        # 1. Create ministry_monthly_reports if it doesn't exist
        if "ministry_monthly_reports" not in existing_tables:
            logger.info("  → Creando tabla ministry_monthly_reports...")
            conn.execute(text(f"""
                CREATE TABLE ministry_monthly_reports (
                    id                  {PK},
                    ministry_id         INTEGER NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,

                    reporter_name       VARCHAR(150) NOT NULL,
                    report_month        VARCHAR(20)  NOT NULL,
                    ministry_name       VARCHAR(150) NOT NULL,

                    mem_children        INTEGER DEFAULT 0,
                    mem_teens           INTEGER DEFAULT 0,
                    mem_youth           INTEGER DEFAULT 0,
                    mem_women           INTEGER DEFAULT 0,
                    mem_men             INTEGER DEFAULT 0,
                    mem_seniors         INTEGER DEFAULT 0,

                    att_children        INTEGER DEFAULT 0,
                    att_teens           INTEGER DEFAULT 0,
                    att_youth           INTEGER DEFAULT 0,
                    att_women           INTEGER DEFAULT 0,
                    att_men             INTEGER DEFAULT 0,
                    att_seniors         INTEGER DEFAULT 0,

                    act_scheduled       INTEGER DEFAULT 0,
                    act_done            INTEGER DEFAULT 0,
                    act_services        INTEGER DEFAULT 0,
                    act_fasts           INTEGER DEFAULT 0,
                    act_visits          INTEGER DEFAULT 0,
                    act_sales           INTEGER DEFAULT 0,
                    act_reconciled      INTEGER DEFAULT 0,
                    act_meetings        INTEGER DEFAULT 0,

                    sermon_week1        VARCHAR(300),
                    sermon_week2        VARCHAR(300),
                    sermon_week3        VARCHAR(300),
                    sermon_week4        VARCHAR(300),
                    sermon_week5        VARCHAR(300),

                    fin_offerings       {FLOAT_DEFAULT},
                    fin_sales           {FLOAT_DEFAULT},
                    fin_special         {FLOAT_DEFAULT},
                    fin_social_expense  {FLOAT_DEFAULT},
                    fin_project_expense {FLOAT_DEFAULT},
                    fin_report_url      VARCHAR(500),

                    created_by          VARCHAR(100),
                    created_at          TIMESTAMP DEFAULT {NOW}
                )
            """))
            logger.info("  ✅ Tabla ministry_monthly_reports creada.")
        else:
            logger.info("  ✔  Tabla ministry_monthly_reports ya existe — omitiendo.")

        # 2. Add monthly_report column to ministry_module_configs if missing
        existing_cols = [c["name"] for c in inspector.get_columns("ministry_module_configs")]
        if "monthly_report" not in existing_cols:
            logger.info("  → Agregando columna monthly_report a ministry_module_configs...")
            default_val = "TRUE" if is_pg else "1"
            conn.execute(text(
                f"ALTER TABLE ministry_module_configs "
                f"ADD COLUMN monthly_report BOOLEAN NOT NULL DEFAULT {default_val}"
            ))
            logger.info("  ✅ Columna monthly_report agregada.")
        else:
            logger.info("  ✔  Columna monthly_report ya existe — omitiendo.")

    logger.info("✅ Migración ministry_monthly_reports: completada.")
