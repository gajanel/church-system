from sqlalchemy.orm import Session
from sqlalchemy import extract, func
from app.models.finance_model import ChurchOffering, ChurchIncome, ChurchExpense, FixedExpense, BankDeposit
from app.schemas.finance_schema import OfferingCreate, IncomeCreate, ExpenseCreate, FixedExpenseCreate, BankDepositCreate

# ── Ofrendas ──
def get_offerings(db: Session, skip: int = 0, limit: int = 50):
    query = db.query(ChurchOffering)
    total = query.count()
    rows = query.order_by(ChurchOffering.date.desc()).offset(skip).limit(limit).all()
    return [_format_offering(r) for r in rows], total

def create_offering(db: Session, data: OfferingCreate, user_id: int):
    obj = ChurchOffering(**data.model_dump(), created_by=user_id)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return _format_offering(obj)

def delete_offering(db: Session, offering_id: int):
    obj = db.query(ChurchOffering).filter(ChurchOffering.id == offering_id).first()
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True

def _format_offering(r):
    return {
        "id": r.id,
        "offering_type": r.offering_type,
        "amount": r.amount,
        "date": r.date,
        "member_id": r.member_id,
        "donor_name": r.donor_name or (f"{r.member.first_name} {r.member.last_name}" if r.member else None),
        "observations": r.observations,
        "created_by": r.created_by,
        "created_at": r.created_at,
        "created_by_name": r.created_by_user.name if r.created_by_user else None,
        "member_name": f"{r.member.first_name} {r.member.last_name}" if r.member else None,
    }

# ── Ingresos ──
def get_incomes(db: Session, skip: int = 0, limit: int = 50):
    query = db.query(ChurchIncome)
    total = query.count()
    rows = query.order_by(ChurchIncome.date.desc()).offset(skip).limit(limit).all()
    return [_format_income(r) for r in rows], total

def create_income(db: Session, data: IncomeCreate, user_id: int):
    obj = ChurchIncome(**data.model_dump(), created_by=user_id)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return _format_income(obj)

def delete_income(db: Session, income_id: int):
    obj = db.query(ChurchIncome).filter(ChurchIncome.id == income_id).first()
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True

def _format_income(r):
    return {
        "id": r.id,
        "income_type": r.income_type,
        "amount": r.amount,
        "date": r.date,
        "member_id": r.member_id,
        "donor_name": r.donor_name or (f"{r.member.first_name} {r.member.last_name}" if r.member else None),
        "observations": r.observations,
        "created_by": r.created_by,
        "created_at": r.created_at,
        "created_by_name": r.created_by_user.name if r.created_by_user else None,
        "member_name": f"{r.member.first_name} {r.member.last_name}" if r.member else None,
    }

# ── Gastos ──
def get_expenses(db: Session, skip: int = 0, limit: int = 50):
    query = db.query(ChurchExpense)
    total = query.count()
    rows = query.order_by(ChurchExpense.date.desc()).offset(skip).limit(limit).all()
    return [_format_expense(r) for r in rows], total

def create_expense(db: Session, data: ExpenseCreate, user_id: int, document_url: str = None):
    if data.expense_type == "Diezmo de Ofrendas":
        today = data.date
        total = db.query(func.sum(ChurchOffering.amount)).filter(
            ChurchOffering.offering_type == "servicio",
            extract("month", ChurchOffering.date) == today.month,
            extract("year", ChurchOffering.date) == today.year,
        ).scalar() or 0
        amount = round(total * 0.10, 2)
    else:
        amount = data.amount

    obj = ChurchExpense(
        expense_type=data.expense_type,
        amount=amount,
        date=data.date,
        observations=data.observations,
        document_url=document_url,
        created_by=user_id
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return _format_expense(obj)

def delete_expense(db: Session, expense_id: int):
    obj = db.query(ChurchExpense).filter(ChurchExpense.id == expense_id).first()
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True

def _format_expense(r):
    return {
        "id": r.id,
        "expense_type": r.expense_type,
        "amount": r.amount,
        "date": r.date,
        "observations": r.observations,
        "document_url": r.document_url,
        "created_by": r.created_by,
        "created_at": r.created_at,
        "created_by_name": r.created_by_user.name if r.created_by_user else None,
    }

# ── Resumen del mes ──
def get_monthly_summary(db: Session, month: int, year: int):
    total_offerings = db.query(func.sum(ChurchOffering.amount)).filter(
        extract("month", ChurchOffering.date) == month,
        extract("year", ChurchOffering.date) == year,
    ).scalar() or 0

    total_incomes = db.query(func.sum(ChurchIncome.amount)).filter(
        extract("month", ChurchIncome.date) == month,
        extract("year", ChurchIncome.date) == year,
    ).scalar() or 0

    total_expenses = db.query(func.sum(ChurchExpense.amount)).filter(
        extract("month", ChurchExpense.date) == month,
        extract("year", ChurchExpense.date) == year,
    ).scalar() or 0

    monthly_goal = db.query(func.sum(FixedExpense.amount)).scalar() or 0

    # Caja General: Total acumulado histórico de todos los registros en "Otros Ingresos"
    total_historical_incomes = db.query(func.sum(ChurchIncome.amount)).scalar() or 0

    return {
        "month": month,
        "year": year,
        "total_offerings": round(total_offerings, 2),
        "total_incomes": round(total_incomes, 2),
        "total_expenses": round(total_expenses, 2),
        "balance": round(total_offerings + total_incomes - total_expenses, 2),
        "monthly_goal": round(monthly_goal, 2),
        "total_historical_incomes": round(total_historical_incomes, 2),
    }

# ── Boletas de Depósito ──
def get_deposits(db: Session, skip: int = 0, limit: int = 50):
    query = db.query(BankDeposit)
    total = query.count()
    rows = query.order_by(BankDeposit.date.desc()).offset(skip).limit(limit).all()
    return [_format_deposit(r) for r in rows], total

def create_deposit(db: Session, data: dict, user_id: int):
    obj = BankDeposit(**data, created_by=user_id)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return _format_deposit(obj)

def delete_deposit(db: Session, deposit_id: int):
    obj = db.query(BankDeposit).filter(BankDeposit.id == deposit_id).first()
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True

def _format_deposit(r):
    return {
        "id": r.id,
        "slip_number": r.slip_number,
        "bank_name": r.bank_name,
        "amount": r.amount,
        "date": r.date,
        "observations": r.observations,
        "created_by": r.created_by,
        "created_at": r.created_at,
        "created_by_name": r.created_by_user.name if r.created_by_user else None,
        "image_url": r.image_url,
    }

# ── Gastos Fijos (Metas) ──
def get_fixed_expenses(db: Session):
    rows = db.query(FixedExpense).order_by(FixedExpense.created_at.desc()).all()
    return [_format_fixed_expense(r) for r in rows]

def create_fixed_expense(db: Session, data: FixedExpenseCreate, user_id: int):
    obj = FixedExpense(**data.model_dump(), created_by=user_id)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return _format_fixed_expense(obj)

def delete_fixed_expense(db: Session, expense_id: int):
    obj = db.query(FixedExpense).filter(FixedExpense.id == expense_id).first()
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True

def update_fixed_expense(db: Session, expense_id: int, name: str, amount: float):
    obj = db.query(FixedExpense).filter(FixedExpense.id == expense_id).first()
    if not obj:
        return None
    obj.name = name
    obj.amount = amount
    db.commit()
    db.refresh(obj)
    return _format_fixed_expense(obj)

def _format_fixed_expense(r):
    return {
        "id": r.id,
        "name": r.name,
        "amount": r.amount,
        "created_by": r.created_by,
        "created_at": r.created_at,
        "created_by_name": r.created_by_user.name if r.created_by_user else None,
    }