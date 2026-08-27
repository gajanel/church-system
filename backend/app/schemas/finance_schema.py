from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, List

# ── Ofrendas ──
class OfferingCreate(BaseModel):
    offering_type: str
    amount: float
    date: date
    member_id: Optional[int] = None
    donor_name: Optional[str] = None
    observations: Optional[str] = None

class OfferingResponse(BaseModel):
    id: int
    offering_type: str
    amount: float
    date: date
    member_id: Optional[int]
    donor_name: Optional[str]
    observations: Optional[str]
    created_by: int
    created_at: datetime
    created_by_name: Optional[str] = None
    member_name: Optional[str] = None

    class Config:
        from_attributes = True

class OfferingPaginatedResponse(BaseModel):
    items: List[OfferingResponse]
    total: int
    page: int
    size: int
    pages: int

# ── Ingresos ──
class IncomeCreate(BaseModel):
    income_type: str
    amount: float
    date: date
    member_id: Optional[int] = None
    donor_name: Optional[str] = None
    observations: Optional[str] = None

class IncomeResponse(BaseModel):
    id: int
    income_type: str
    amount: float
    date: date
    member_id: Optional[int]
    donor_name: Optional[str]
    observations: Optional[str]
    created_by: int
    created_at: datetime
    created_by_name: Optional[str] = None
    member_name: Optional[str] = None

    class Config:
        from_attributes = True

class IncomePaginatedResponse(BaseModel):
    items: List[IncomeResponse]
    total: int
    page: int
    size: int
    pages: int

# ── Gastos ──
class ExpenseCreate(BaseModel):
    expense_type: str
    amount: float
    date: date
    observations: Optional[str] = None

class ExpenseResponse(BaseModel):
    id: int
    expense_type: str
    amount: float
    date: date
    observations: Optional[str]
    document_url: Optional[str] = None
    created_by: int
    created_at: datetime
    created_by_name: Optional[str] = None

    class Config:
        from_attributes = True

class ExpensePaginatedResponse(BaseModel):
    items: List[ExpenseResponse]
    total: int
    page: int
    size: int
    pages: int

# ── Gastos Fijos (Metas) ──
class FixedExpenseCreate(BaseModel):
    name: str
    amount: float

class FixedExpenseResponse(BaseModel):
    id: int
    name: str
    amount: float
    created_by: int
    created_at: datetime
    created_by_name: Optional[str] = None

    class Config:
        from_attributes = True


# ── Cuentas Bancarias ──
class BankAccountCreate(BaseModel):
    bank_name: str
    account_name: str
    account_number: str

class BankAccountResponse(BaseModel):
    id: int
    bank_name: str
    account_name: str
    account_number: str
    created_by: int
    created_at: datetime
    created_by_name: Optional[str] = None

    class Config:
        from_attributes = True

# ── Boletas de Depósito ──
class BankDepositCreate(BaseModel):
    slip_number: str
    bank_account_id: int
    amount: float
    date: date
    observations: Optional[str] = None

class BankDepositResponse(BaseModel):
    id: int
    slip_number: str
    bank_name: Optional[str] = None
    bank_account_id: Optional[int] = None
    bank_account: Optional[BankAccountResponse] = None
    amount: float
    date: date
    observations: Optional[str]
    created_by: int
    created_at: datetime
    created_by_name: Optional[str] = None
    image_url: Optional[str] = None

    class Config:
        from_attributes = True

class BankDepositPaginatedResponse(BaseModel):
    items: List[BankDepositResponse]
    total: int
    page: int
    size: int
    pages: int


# ── Inyecciones Caja → Banco ──
class BankInjectionCreate(BaseModel):
    bank_account_id: int
    amount: float
    date: date
    slip_number: Optional[str] = None
    observations: Optional[str] = None

class BankInjectionResponse(BaseModel):
    id: int
    bank_name: Optional[str] = None
    bank_account_id: Optional[int] = None
    bank_account: Optional[BankAccountResponse] = None
    amount: float
    date: date
    slip_number: Optional[str]
    observations: Optional[str]
    image_url: Optional[str] = None
    created_by: int
    created_at: datetime
    created_by_name: Optional[str] = None

    class Config:
        from_attributes = True

class BankInjectionPaginatedResponse(BaseModel):
    items: List[BankInjectionResponse]
    total: int
    page: int
    size: int
    pages: int