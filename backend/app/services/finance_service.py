# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

from sqlalchemy.orm import Session
from sqlalchemy import extract, func, or_
from app.models.finance_model import ChurchOffering, ChurchIncome, ChurchExpense, FixedExpense, BankDeposit, BankInjection, BankAccount, BankWithdrawal
from app.schemas.finance_schema import OfferingCreate, IncomeCreate, ExpenseCreate, FixedExpenseCreate, BankDepositCreate, BankInjectionCreate, BankAccountCreate, BankWithdrawalCreate

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

    # Caja General = dinero acumulado en bancos (inyecciones - retiros bancarios)
    total_injections_hist = db.query(func.sum(BankInjection.amount)).scalar() or 0
    total_withdrawals_hist = db.query(func.sum(BankWithdrawal.amount)).scalar() or 0

    cash_balance = total_injections_hist - total_withdrawals_hist

    # Caja de Ofrendas = efectivo en circulación (no depositado)
    total_offerings_hist = db.query(func.sum(ChurchOffering.amount)).scalar() or 0
    total_incomes_hist = db.query(func.sum(ChurchIncome.amount)).scalar() or 0
    total_expenses_hist = db.query(func.sum(ChurchExpense.amount)).scalar() or 0
    offering_cash = (total_offerings_hist + total_incomes_hist) - total_expenses_hist - total_injections_hist

    return {
        "month": month,
        "year": year,
        "total_offerings": round(total_offerings, 2),
        "total_incomes": round(total_incomes, 2),
        "total_expenses": round(total_expenses, 2),
        "balance": round(total_offerings + total_incomes - total_expenses, 2),
        "monthly_goal": round(monthly_goal, 2),
        "total_historical_incomes": round(total_incomes_hist, 2),
        "cash_balance": round(cash_balance, 2),         # Caja General (bancos)
        "offering_cash": round(offering_cash, 2),       # Caja de Ofrendas (circulación)
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
        "bank_account_id": r.bank_account_id,
        "bank_account": _format_bank_account(r.bank_account) if r.bank_account else None,
        "amount": r.amount,
        "date": r.date,
        "observations": r.observations,
        "created_by": r.created_by,
        "created_at": r.created_at,
        "created_by_name": r.created_by_user.name if r.created_by_user else None,
        "image_url": r.image_url,
    }

# ── Cuentas Bancarias ──
def get_bank_accounts(db: Session):
    rows = db.query(BankAccount).order_by(BankAccount.bank_name.asc()).all()
    return [_format_bank_account(r) for r in rows]

def create_bank_account(db: Session, data: BankAccountCreate, user_id: int):
    obj = BankAccount(**data.model_dump(), created_by=user_id)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return _format_bank_account(obj)

def delete_bank_account(db: Session, account_id: int):
    obj = db.query(BankAccount).filter(BankAccount.id == account_id).first()
    if not obj:
        return False
    # Podría haber depósitos o inyecciones asociados, idealmente fallará por foreign key o se debe setear null
    db.delete(obj)
    db.commit()
    return True

def _format_bank_account(r):
    return {
        "id": r.id,
        "bank_name": r.bank_name,
        "account_name": r.account_name,
        "account_number": r.account_number,
        "created_by": r.created_by,
        "created_at": r.created_at,
        "created_by_name": r.created_by_user.name if getattr(r, 'created_by_user', None) else None,
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

# ── Caja General ──
def get_cash_register(db: Session, month: int = None, year: int = None):
    """Caja General = dinero acumulado en bancos (inyecciones - retiros).
    Caja de Ofrendas (circulación) = ofrendas + ingresos - gastos - inyecciones."""

    # Saldo histórico total en bancos
    total_injections_hist  = db.query(func.sum(BankInjection.amount)).scalar() or 0
    total_withdrawals_hist = db.query(func.sum(BankWithdrawal.amount)).scalar() or 0

    # Saldo Caja General = lo que está en bancos
    cash_balance = round(total_injections_hist - total_withdrawals_hist, 2)

    # Saldo Caja de Ofrendas = efectivo en circulación
    total_offerings_hist  = db.query(func.sum(ChurchOffering.amount)).scalar() or 0
    total_incomes_hist    = db.query(func.sum(ChurchIncome.amount)).scalar() or 0
    total_expenses_hist   = db.query(func.sum(ChurchExpense.amount)).scalar() or 0
    offering_cash = round(
        (total_offerings_hist + total_incomes_hist) - total_expenses_hist - total_injections_hist, 2
    )

    # Totales del mes seleccionado
    def _month_filter(query, model):
        if month and year:
            return query.filter(
                extract("month", model.date) == month,
                extract("year",  model.date) == year,
            )
        return query

    month_offerings  = _month_filter(db.query(func.sum(ChurchOffering.amount)),  ChurchOffering).scalar()  or 0
    month_injections = _month_filter(db.query(func.sum(BankInjection.amount)),   BankInjection).scalar()  or 0
    month_withdrawals = _month_filter(db.query(func.sum(BankWithdrawal.amount)), BankWithdrawal).scalar()  or 0

    # Movimientos recientes combinados (solo del mes o todos si no hay filtro)
    movements = _get_combined_movements(db, month, year, limit=50)

    return {
        "cash_balance":      cash_balance,      # Caja General (bancos)
        "offering_cash":     offering_cash,      # Caja de Ofrendas (circulación)
        "month_entries":     round(month_injections, 2),
        "month_exits":       round(month_withdrawals, 2),
        "month_net":         round(month_injections - month_withdrawals, 2),
        "movements":         movements,
    }

def _get_combined_movements(db: Session, month: int = None, year: int = None, limit: int = 50):
    """Combina inyecciones y retiros bancarios."""
    rows = []

    def month_ok(d):
        if not month or not year:
            return True
        return d.month == month and d.year == year

    # Inyecciones a banco (Entradas a la Caja General/Banco)
    for r in db.query(BankInjection).order_by(BankInjection.date.desc()).limit(200).all():
        if month_ok(r.date):
            rows.append({
                "id":          f"inj-{r.id}",
                "date":        r.date,
                "kind":        "inyeccion",
                "category":    "Inyección",
                "concept":     r.bank_name or (r.bank_account.bank_name if r.bank_account else "—"),
                "party":       "—",
                "amount":      r.amount,
                "sign":        "+",
                "created_by_name": r.created_by_user.name if hasattr(r, 'created_by_user') and r.created_by_user else None,
            })

    # Retiros de banco (Salidas de la Caja General/Banco)
    for r in db.query(BankWithdrawal).order_by(BankWithdrawal.date.desc()).limit(200).all():
        if month_ok(r.date):
            rows.append({
                "id":          f"wd-{r.id}",
                "date":        r.date,
                "kind":        "retiro",
                "category":    "Retiro",
                "concept":     r.concept,
                "party":       "—",
                "amount":      r.amount,
                "sign":        "-",
                "created_by_name": r.created_by_user.name if hasattr(r, 'created_by_user') and r.created_by_user else None,
            })

    rows.sort(key=lambda x: x["date"], reverse=True)
    return rows[:limit]


# ── Retiros / Salidas Bancarias ──
def get_withdrawals(db: Session, skip: int = 0, limit: int = 50):
    query = db.query(BankWithdrawal)
    total = query.count()
    rows = query.order_by(BankWithdrawal.date.desc()).offset(skip).limit(limit).all()
    return [_format_withdrawal(r) for r in rows], total

def create_withdrawal(db: Session, data: dict, user_id: int):
    obj = BankWithdrawal(**data, created_by=user_id)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return _format_withdrawal(obj)

def delete_withdrawal(db: Session, withdrawal_id: int):
    obj = db.query(BankWithdrawal).filter(BankWithdrawal.id == withdrawal_id).first()
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True

def _format_withdrawal(r):
    return {
        "id":              r.id,
        "bank_account_id": r.bank_account_id,
        "bank_account":    _format_bank_account(r.bank_account) if r.bank_account else None,
        "amount":          r.amount,
        "date":            r.date,
        "concept":         r.concept,
        "reference_number": r.reference_number,
        "observations":    r.observations,
        "image_url":       r.image_url,
        "created_by":      r.created_by,
        "created_at":      r.created_at,
        "created_by_name": r.created_by_user.name if r.created_by_user else None,
    }

def get_bank_account_balance(db: Session, account_id: int):
    """Saldo de una cuenta bancaria = Inyecciones - Retiros."""
    injections = db.query(func.sum(BankInjection.amount)).filter(
        BankInjection.bank_account_id == account_id
    ).scalar() or 0
    withdrawals = db.query(func.sum(BankWithdrawal.amount)).filter(
        BankWithdrawal.bank_account_id == account_id
    ).scalar() or 0
    return round(injections - withdrawals, 2)

# ── Inyecciones Caja → Banco ──
def get_injections(db: Session, skip: int = 0, limit: int = 50):
    query = db.query(BankInjection)
    total = query.count()
    rows = query.order_by(BankInjection.date.desc()).offset(skip).limit(limit).all()
    return [_format_injection(r) for r in rows], total

def create_injection(db: Session, data: dict, user_id: int):
    # Validar que haya saldo suficiente en la Caja General
    total_offerings_hist  = db.query(func.sum(ChurchOffering.amount)).scalar() or 0
    total_incomes_hist    = db.query(func.sum(ChurchIncome.amount)).scalar() or 0
    total_expenses_hist   = db.query(func.sum(ChurchExpense.amount)).scalar() or 0
    total_injections_hist = db.query(func.sum(BankInjection.amount)).scalar() or 0
    
    cash_balance = (total_offerings_hist + total_incomes_hist) - (total_expenses_hist + total_injections_hist)
    
    from fastapi import HTTPException
    if data.get("amount", 0) > cash_balance:
        raise HTTPException(status_code=400, detail=f"Saldo en caja insuficiente. Disponible: Q{cash_balance:,.2f}")

    obj = BankInjection(**data, created_by=user_id)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return _format_injection(obj)

def delete_injection(db: Session, injection_id: int):
    obj = db.query(BankInjection).filter(BankInjection.id == injection_id).first()
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True

def _format_injection(r):
    return {
        "id":           r.id,
        "bank_name":    r.bank_name,
        "bank_account_id": r.bank_account_id,
        "bank_account": _format_bank_account(r.bank_account) if r.bank_account else None,
        "amount":       r.amount,
        "date":         r.date,
        "slip_number":  r.slip_number,
        "observations": r.observations,
        "image_url":    r.image_url,
        "created_by":   r.created_by,
        "created_at":   r.created_at,
        "created_by_name": r.created_by_user.name if r.created_by_user else None,
    }