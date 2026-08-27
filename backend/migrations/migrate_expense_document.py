"""
Migration: Add document_url column to church_expenses table.
This allows attaching receipts/invoices to expense records.
"""
from sqlalchemy import text
from app.database.connection import engine


def migrate(shared_engine=None):
    use_engine = shared_engine or engine
    with use_engine.connect() as conn:
        try:
            conn.execute(text(
                "ALTER TABLE church_expenses ADD COLUMN IF NOT EXISTS document_url VARCHAR(255);"
            ))
            conn.commit()
            print("Migration 'expense_document': completed successfully.")
        except Exception as e:
            print(f"Migration 'expense_document' error: {e}")
            conn.rollback()


if __name__ == "__main__":
    migrate()
