from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.schemas.expense_schema import ExpenseCreate
from app.services.expense_service import create_expense, get_expenses

router = APIRouter()


@router.post("/expenses")
def register_expense(expense: ExpenseCreate, db: Session = Depends(get_db)):

    return create_expense(db, expense)


@router.get("/expenses")
def list_expenses(db: Session = Depends(get_db)):

    return get_expenses(db)