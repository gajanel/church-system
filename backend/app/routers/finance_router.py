# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from datetime import date
import math
import os
import shutil
import uuid

from app.database.connection import get_db
from app.utils.dependencies import get_current_user, only_finance
from app.schemas.finance_schema import (
    OfferingCreate, IncomeCreate, ExpenseCreate, FixedExpenseCreate, BankDepositCreate,
    OfferingPaginatedResponse, IncomePaginatedResponse, ExpensePaginatedResponse, BankDepositPaginatedResponse,
    BankInjectionPaginatedResponse, BankAccountCreate, BankAccountResponse,
    BankWithdrawalPaginatedResponse
)
from app.services import finance_service
from app.services import audit_service
from app.schemas import audit_schema

# Límite máximo para recibos/boletas de depósito: 5 MB
MAX_DEPOSIT_FILE_SIZE = 5 * 1024 * 1024

router = APIRouter()

# ── Ofrendas ──
@router.get("/finance/offerings", response_model=OfferingPaginatedResponse)
def get_offerings(page: int = 1, size: int = 50, db: Session = Depends(get_db), user=Depends(get_current_user)):
    skip = (page - 1) * size
    items, total = finance_service.get_offerings(db, skip=skip, limit=size)
    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "pages": math.ceil(total / size) if total > 0 else 0
    }

@router.post("/finance/offerings")
def create_offering(data: OfferingCreate, db: Session = Depends(get_db), user=Depends(only_finance)):
    offering = finance_service.create_offering(db, data, user.id)
    audit_service.create_audit_log(db, audit_schema.AuditLogCreate(
        user_id=user.id,
        action="CREATE",
        module="Finanzas",
        description=f"Registró una ofrenda de Q{data.amount}"
    ))
    return offering

@router.delete("/finance/offerings/{offering_id}")
def delete_offering(offering_id: int, db: Session = Depends(get_db), user=Depends(only_finance)):
    if not finance_service.delete_offering(db, offering_id):
        raise HTTPException(status_code=404, detail="Ofrenda no encontrada")
    return {"message": "Eliminada correctamente"}

# ── Ingresos ──
@router.get("/finance/incomes", response_model=IncomePaginatedResponse)
def get_incomes(page: int = 1, size: int = 50, db: Session = Depends(get_db), user=Depends(get_current_user)):
    skip = (page - 1) * size
    items, total = finance_service.get_incomes(db, skip=skip, limit=size)
    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "pages": math.ceil(total / size) if total > 0 else 0
    }

@router.post("/finance/incomes")
def create_income(data: IncomeCreate, db: Session = Depends(get_db), user=Depends(only_finance)):
    return finance_service.create_income(db, data, user.id)

@router.delete("/finance/incomes/{income_id}")
def delete_income(income_id: int, db: Session = Depends(get_db), user=Depends(only_finance)):
    if not finance_service.delete_income(db, income_id):
        raise HTTPException(status_code=404, detail="Ingreso no encontrado")
    return {"message": "Eliminado correctamente"}

# ── Gastos ──
@router.get("/finance/expenses", response_model=ExpensePaginatedResponse)
def get_expenses(page: int = 1, size: int = 50, db: Session = Depends(get_db), user=Depends(get_current_user)):
    skip = (page - 1) * size
    items, total = finance_service.get_expenses(db, skip=skip, limit=size)
    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "pages": math.ceil(total / size) if total > 0 else 0
    }

# Límite máximo para comprobantes/facturas de gastos: 10 MB
MAX_EXPENSE_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_EXPENSE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".pdf"]

@router.post("/finance/expenses")
async def create_expense(
    expense_type: str = Form(...),
    amount: float = Form(...),
    date: str = Form(...),
    observations: str = Form(None),
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
    user=Depends(only_finance)
):
    document_url = None
    if file and file.filename:
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in ALLOWED_EXPENSE_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail="Tipo de archivo no permitido. Use JPG, PNG, WEBP o PDF."
            )
        contents = await file.read()
        if len(contents) > MAX_EXPENSE_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="El archivo supera el tamaño máximo de 10 MB."
            )
        upload_dir = "static/uploads/expenses"
        os.makedirs(upload_dir, exist_ok=True)
        file_name = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(upload_dir, file_name)
        with open(file_path, "wb") as buffer:
            buffer.write(contents)
        document_url = f"/static/uploads/expenses/{file_name}"

    from app.schemas.finance_schema import ExpenseCreate
    from datetime import date as date_type
    data = ExpenseCreate(
        expense_type=expense_type,
        amount=amount,
        date=date_type.fromisoformat(date),
        observations=observations
    )
    expense = finance_service.create_expense(db, data, user.id, document_url=document_url)
    audit_service.create_audit_log(db, audit_schema.AuditLogCreate(
        user_id=user.id,
        action="CREATE",
        module="Finanzas",
        description=f"Registró un gasto de Q{amount} ({expense_type})" + (" con comprobante" if document_url else "")
    ))
    return expense

@router.delete("/finance/expenses/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db), user=Depends(only_finance)):
    if not finance_service.delete_expense(db, expense_id):
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    return {"message": "Eliminado correctamente"}


# ── Resumen mensual ──
@router.get("/finance/summary")
def get_summary(month: int, year: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return finance_service.get_monthly_summary(db, month, year)

# ── Gastos Fijos (Metas) ──
@router.get("/finance/fixed-expenses")
def get_fixed_expenses(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return finance_service.get_fixed_expenses(db)

@router.post("/finance/fixed-expenses")
def create_fixed_expense(data: FixedExpenseCreate, db: Session = Depends(get_db), user=Depends(only_finance)):
    return finance_service.create_fixed_expense(db, data, user.id)

@router.delete("/finance/fixed-expenses/{expense_id}")
def delete_fixed_expense(expense_id: int, db: Session = Depends(get_db), user=Depends(only_finance)):
    if not finance_service.delete_fixed_expense(db, expense_id):
        raise HTTPException(status_code=404, detail="Gasto fijo no encontrado")
    return {"message": "Eliminado correctamente"}

@router.put("/finance/fixed-expenses/{expense_id}")
def update_fixed_expense(expense_id: int, data: FixedExpenseCreate, db: Session = Depends(get_db), user=Depends(only_finance)):
    updated = finance_service.update_fixed_expense(db, expense_id, data.name, data.amount)
    if not updated:
        raise HTTPException(status_code=404, detail="Gasto fijo no encontrado")
    return updated

# ── Boletas de Depósito ──
@router.get("/finance/deposits", response_model=BankDepositPaginatedResponse)
def get_deposits(page: int = 1, size: int = 50, db: Session = Depends(get_db), user=Depends(get_current_user)):
    skip = (page - 1) * size
    items, total = finance_service.get_deposits(db, skip=skip, limit=size)
    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "pages": math.ceil(total / size) if total > 0 else 0
    }

@router.post("/finance/deposits")
async def create_deposit(
    slip_number: str = Form(...),
    bank_account_id: int = Form(...),
    amount: float = Form(...),
    date: str = Form(...),
    observations: str = Form(None),
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
    user=Depends(only_finance)
):
    image_url = None
    if file and file.filename:
        file_ext = os.path.splitext(file.filename)[1].lower()
        allowed_extensions = [".jpg", ".jpeg", ".png", ".webp"]
        if file_ext not in allowed_extensions:
            raise HTTPException(status_code=400, detail="Tipo de archivo no permitido. Use JPG, PNG o WEBP.")

        # Validar tamaño máximo: 5 MB
        contents = await file.read()
        if len(contents) > MAX_DEPOSIT_FILE_SIZE:
            raise HTTPException(status_code=413, detail="El archivo supera el tamaño máximo de 5 MB.")

        upload_dir = "static/uploads/deposits"
        os.makedirs(upload_dir, exist_ok=True)

        file_name = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(upload_dir, file_name)

        with open(file_path, "wb") as buffer:
            buffer.write(contents)

        image_url = f"/static/uploads/deposits/{file_name}"

    data = {
        "slip_number": slip_number,
        "bank_account_id": bank_account_id,
        "amount": amount,
        "date": date,
        "observations": observations,
        "image_url": image_url
    }
    deposit = finance_service.create_deposit(db, data, user.id)
    audit_service.create_audit_log(db, audit_schema.AuditLogCreate(
        user_id=user.id,
        action="CREATE",
        module="Finanzas",
        description=f"Registró boleta de depósito #{slip_number} por Q{amount}"
    ))
    return deposit

@router.delete("/finance/deposits/{deposit_id}")
def delete_deposit(deposit_id: int, db: Session = Depends(get_db), user=Depends(only_finance)):
    if not finance_service.delete_deposit(db, deposit_id):
        raise HTTPException(status_code=404, detail="Boleta no encontrada")
    return {"message": "Eliminada correctamente"}


# ── Caja General ──
@router.get("/finance/cash-register")
def get_cash_register(
    month: int = None,
    year: int = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    return finance_service.get_cash_register(db, month=month, year=year)


# ── Inyecciones Caja → Banco ──
@router.get("/finance/injections", response_model=BankInjectionPaginatedResponse)
def get_injections(page: int = 1, size: int = 50, db: Session = Depends(get_db), user=Depends(get_current_user)):
    skip = (page - 1) * size
    items, total = finance_service.get_injections(db, skip=skip, limit=size)
    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "pages": math.ceil(total / size) if total > 0 else 0
    }


@router.post("/finance/injections")
async def create_injection(
    bank_account_id: int = Form(...),
    amount: float = Form(...),
    date: str = Form(...),
    slip_number: str = Form(None),
    observations: str = Form(None),
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
    user=Depends(only_finance)
):
    image_url = None
    if file and file.filename:
        file_ext = os.path.splitext(file.filename)[1].lower()
        allowed_extensions = [".jpg", ".jpeg", ".png", ".webp"]
        if file_ext not in allowed_extensions:
            raise HTTPException(status_code=400, detail="Tipo de archivo no permitido. Use JPG, PNG o WEBP.")
        contents = await file.read()
        if len(contents) > MAX_DEPOSIT_FILE_SIZE:
            raise HTTPException(status_code=413, detail="El archivo supera el maximo de 5 MB.")
        upload_dir = "static/uploads/injections"
        os.makedirs(upload_dir, exist_ok=True)
        file_name = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(upload_dir, file_name)
        with open(file_path, "wb") as buffer:
            buffer.write(contents)
        image_url = f"/static/uploads/injections/{file_name}"

    data = {
        "bank_account_id": bank_account_id,
        "amount":       amount,
        "date":         date,
        "slip_number":  slip_number,
        "observations": observations,
        "image_url":    image_url,
    }
    injection = finance_service.create_injection(db, data, user.id)
    audit_service.create_audit_log(db, audit_schema.AuditLogCreate(
        user_id=user.id,
        action="CREATE",
        module="Finanzas",
        description=f"Inyeccion a banco por Q{amount}"
    ))
    return injection


@router.delete("/finance/injections/{injection_id}")
def delete_injection(injection_id: int, db: Session = Depends(get_db), user=Depends(only_finance)):
    if not finance_service.delete_injection(db, injection_id):
        raise HTTPException(status_code=404, detail="Inyeccion no encontrada")
    return {"message": "Eliminada correctamente"}


# ── Retiros / Salidas Bancarias ──
@router.get("/finance/withdrawals", response_model=BankWithdrawalPaginatedResponse)
def get_withdrawals(page: int = 1, size: int = 50, db: Session = Depends(get_db), user=Depends(get_current_user)):
    skip = (page - 1) * size
    items, total = finance_service.get_withdrawals(db, skip=skip, limit=size)
    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "pages": math.ceil(total / size) if total > 0 else 0
    }


@router.post("/finance/withdrawals")
async def create_withdrawal(
    bank_account_id: int = Form(...),
    amount: float = Form(...),
    date: str = Form(...),
    concept: str = Form(...),
    reference_number: str = Form(None),
    observations: str = Form(None),
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
    user=Depends(only_finance)
):
    image_url = None
    if file and file.filename:
        file_ext = os.path.splitext(file.filename)[1].lower()
        allowed_extensions = [".jpg", ".jpeg", ".png", ".webp"]
        if file_ext not in allowed_extensions:
            raise HTTPException(status_code=400, detail="Tipo de archivo no permitido. Use JPG, PNG o WEBP.")
        contents = await file.read()
        if len(contents) > MAX_DEPOSIT_FILE_SIZE:
            raise HTTPException(status_code=413, detail="El archivo supera el máximo de 5 MB.")
        upload_dir = "static/uploads/withdrawals"
        os.makedirs(upload_dir, exist_ok=True)
        file_name = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(upload_dir, file_name)
        with open(file_path, "wb") as buffer:
            buffer.write(contents)
        image_url = f"/static/uploads/withdrawals/{file_name}"

    data = {
        "bank_account_id": bank_account_id,
        "amount":          amount,
        "date":            date,
        "concept":         concept,
        "reference_number": reference_number,
        "observations":    observations,
        "image_url":       image_url,
    }
    withdrawal = finance_service.create_withdrawal(db, data, user.id)
    audit_service.create_audit_log(db, audit_schema.AuditLogCreate(
        user_id=user.id,
        action="CREATE",
        module="Finanzas",
        description=f"Retiro bancario por Q{amount} ({concept})"
    ))
    return withdrawal


@router.delete("/finance/withdrawals/{withdrawal_id}")
def delete_withdrawal(withdrawal_id: int, db: Session = Depends(get_db), user=Depends(only_finance)):
    if not finance_service.delete_withdrawal(db, withdrawal_id):
        raise HTTPException(status_code=404, detail="Retiro no encontrado")
    return {"message": "Eliminado correctamente"}


@router.get("/finance/bank-accounts/{account_id}/balance")
def get_bank_account_balance(account_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    balance = finance_service.get_bank_account_balance(db, account_id)
    return {"account_id": account_id, "balance": balance}


# ── Cuentas Bancarias ──
@router.get("/finance/bank-accounts")
def get_bank_accounts(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return finance_service.get_bank_accounts(db)

@router.post("/finance/bank-accounts", response_model=BankAccountResponse)
def create_bank_account(data: BankAccountCreate, db: Session = Depends(get_db), user=Depends(only_finance)):
    account = finance_service.create_bank_account(db, data, user.id)
    audit_service.create_audit_log(db, audit_schema.AuditLogCreate(
        user_id=user.id,
        action="CREATE",
        module="Finanzas",
        description=f"Creó la cuenta bancaria {data.account_number} ({data.bank_name})"
    ))
    return account

@router.delete("/finance/bank-accounts/{account_id}")
def delete_bank_account(account_id: int, db: Session = Depends(get_db), user=Depends(only_finance)):
    if not finance_service.delete_bank_account(db, account_id):
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")
    return {"message": "Cuenta eliminada"}