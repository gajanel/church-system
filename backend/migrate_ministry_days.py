from app.database.connection import engine as default_engine
from sqlalchemy import text

def migrate(shared_engine=None):
    use_engine = shared_engine or default_engine
    with use_engine.connect() as conn:
        if not shared_engine:
            print("Checking 'ministries' table...")
        
        # Check if service_day column exists
        res = conn.execute(text("""
            SELECT count(*) FROM information_schema.columns 
            WHERE table_name='ministries' AND column_name='service_day'
        """)).scalar()
        
        if res == 0:
            try:
                conn.execute(text("ALTER TABLE ministries ADD COLUMN service_day VARCHAR(20)"))
                conn.commit()
                print("Column 'service_day' added to 'ministries'.")
            except Exception as e:
                print(f"Error adding column to ministries: {e}")
        
        # Check if unique constraint exists
        res = conn.execute(text("""
            SELECT count(*) FROM information_schema.table_constraints 
            WHERE table_name='ministries' AND constraint_name='unique_service_day'
        """)).scalar()
        
        if res == 0:
            try:
                conn.execute(text("ALTER TABLE ministries ADD CONSTRAINT unique_service_day UNIQUE (service_day)"))
                conn.commit()
                print("Unique constraint 'unique_service_day' added to 'ministries'.")
            except Exception as e:
                print(f"Error adding unique constraint to ministries: {e}")

        if not shared_engine:
            print("Migration 'ministry_days' finished.")

if __name__ == "__main__":
    migrate()
