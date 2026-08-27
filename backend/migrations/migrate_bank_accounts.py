import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.connection import engine
from app.models.finance_model import BankAccount
from app.models.user_model import User
from app.database.connection import Base
from sqlalchemy import text

def migrate():
    print("Creating bank_accounts table using SQLAlchemy...")
    Base.metadata.create_all(engine, tables=[BankAccount.__table__])

    with engine.connect() as conn:
        # Alter bank_deposits
        try:
            conn.execute(text("ALTER TABLE bank_deposits ADD COLUMN bank_account_id INTEGER REFERENCES bank_accounts(id);"))
            print("Added bank_account_id to bank_deposits")
        except Exception as e:
            print("Could not add bank_account_id to bank_deposits:", str(e))
            
        try:
            # Postgres supports altering column type and nullability
            conn.execute(text("ALTER TABLE bank_deposits ALTER COLUMN bank_name DROP NOT NULL;"))
            print("Made bank_name nullable in bank_deposits")
        except Exception as e:
            print("Could not alter bank_name in bank_deposits:", str(e))

        # Alter bank_injections
        try:
            conn.execute(text("ALTER TABLE bank_injections ADD COLUMN bank_account_id INTEGER REFERENCES bank_accounts(id);"))
            print("Added bank_account_id to bank_injections")
        except Exception as e:
            print("Could not add bank_account_id to bank_injections:", str(e))
            
        try:
            conn.execute(text("ALTER TABLE bank_injections ALTER COLUMN bank_name DROP NOT NULL;"))
            print("Made bank_name nullable in bank_injections")
        except Exception as e:
            print("Could not alter bank_name in bank_injections:", str(e))
            
        conn.commit()
        print("Migration complete.")

if __name__ == "__main__":
    migrate()
