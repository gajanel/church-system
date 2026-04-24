from sqlalchemy.orm import Session
from app.models.expense_model import Expense

def create_expense(db: Session, expense):
    new_expense = Expense(
        amount=expense.amount,
        date=expense.date,
        observations=expense.observations,
        created_by=expense.created_by
    )
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    return new_expense

def get_expenses(db: Session):
    return db.query(Expense).all()
