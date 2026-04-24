"""Migration: Add bible_verse column to settings table."""
from sqlalchemy import text

def migrate(engine):
    with engine.connect() as conn:
        try:
            # PostgreSQL supports ADD COLUMN IF NOT EXISTS
            conn.execute(text("ALTER TABLE settings ADD COLUMN IF NOT EXISTS bible_verse TEXT"))
            
            # Default value if null (initial migration)
            conn.execute(text("""
                UPDATE settings SET bible_verse = '"Y en ningún otro hay salvación; porque no hay otro nombre bajo el cielo, dado a los hombres, en que podamos ser salvos." — Hechos 4:12'
                WHERE bible_verse IS NULL
            """))
            conn.commit()
            print("✅ Migración settings_verse: completada.")
        except Exception as e:
            # Although using IF NOT EXISTS, we still catch other unexpected errors
            print(f"⚠️  Error en migración settings_verse: {e}")
