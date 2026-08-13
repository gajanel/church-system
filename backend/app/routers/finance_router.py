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
    OfferingPaginatedResponse, IncomePaginatedResponse, ExpensePaginatedResponse, BankDepositPaginatedResponse
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
    bank_name: str = Form(...),
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
        "bank_name": bank_name,
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