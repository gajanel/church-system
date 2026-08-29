# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.connection import Base

class ChurchOffering(Base):
    __tablename__ = "church_offerings"

    id = Column(Integer, primary_key=True, index=True)
    offering_type = Column(String(50), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    date = Column(Date, nullable=False, index=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=True, index=True)
    donor_name = Column(String(100), nullable=True)
    observations = Column(String(300), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    member = relationship("Member")
    created_by_user = relationship("User", foreign_keys=[created_by])


class ChurchIncome(Base):
    __tablename__ = "church_incomes"

    id = Column(Integer, primary_key=True, index=True)
    income_type = Column(String(50), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    date = Column(Date, nullable=False, index=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=True, index=True)
    donor_name = Column(String(100), nullable=True)
    observations = Column(String(300), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    member = relationship("Member")
    created_by_user = relationship("User", foreign_keys=[created_by])


class ChurchExpense(Base):
    __tablename__ = "church_expenses"

    id = Column(Integer, primary_key=True, index=True)
    expense_type = Column(String(50), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    date = Column(Date, nullable=False, index=True)
    observations = Column(String(300), nullable=True)
    document_url = Column(String(255), nullable=True)  # URL del comprobante/factura adjunto
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by_user = relationship("User", foreign_keys=[created_by])


class FixedExpense(Base):
    __tablename__ = "fixed_expenses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    amount = Column(Float, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    created_by_user = relationship("User", foreign_keys=[created_by])


class BankAccount(Base):
    __tablename__ = "bank_accounts"

    id = Column(Integer, primary_key=True, index=True)
    bank_name = Column(String(100), nullable=False)
    account_name = Column(String(100), nullable=False)
    account_number = Column(String(100), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    created_by_user = relationship("User", foreign_keys=[created_by])


class BankDeposit(Base):
    __tablename__ = "bank_deposits"

    id = Column(Integer, primary_key=True, index=True)
    slip_number = Column(String(50), nullable=False)
    bank_name = Column(String(100), nullable=True) # Mantenido por historial
    bank_account_id = Column(Integer, ForeignKey("bank_accounts.id"), nullable=True, index=True)
    amount = Column(Float, nullable=False)
    date = Column(Date, nullable=False, index=True)
    observations = Column(String(300), nullable=True)
    image_url = Column(String(255), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    created_by_user = relationship("User", foreign_keys=[created_by])
    bank_account = relationship("BankAccount")


class BankInjection(Base):
    """Transferencia de dinero de Caja General hacia un banco (resta del saldo de caja)."""
    __tablename__ = "bank_injections"

    id = Column(Integer, primary_key=True, index=True)
    bank_name = Column(String(100), nullable=True) # Mantenido por historial
    bank_account_id = Column(Integer, ForeignKey("bank_accounts.id"), nullable=True, index=True)
    amount = Column(Float, nullable=False)
    date = Column(Date, nullable=False, index=True)
    slip_number = Column(String(50), nullable=True)
    observations = Column(String(300), nullable=True)
    image_url = Column(String(255), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    created_by_user = relationship("User", foreign_keys=[created_by])
    bank_account = relationship("BankAccount")