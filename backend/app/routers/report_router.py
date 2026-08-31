# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import extract, func
from typing import Optional
from datetime import date

from app.database.connection import get_db
from app.utils.dependencies import get_current_user
from app.models.finance_model import ChurchOffering, ChurchIncome, ChurchExpense, FixedExpense, BankInjection
from app.models.member_model import Member
from app.models.event_model import Event
from app.models.project_model import Project
from app.models.offering_model import Offering
from app.models.offering_type_model import OfferingType
from app.models.attendance_model import Attendance

router = APIRouter(prefix="/reports", tags=["Reports"])


# ── 0. Reporte de Asistencia Mensual ──
@router.get("/attendance")
def report_attendance(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2000),
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    records = db.query(Attendance).filter(
        extract("month", Attendance.date) == month,
        extract("year", Attendance.date) == year,
    ).order_by(Attendance.date).all()

    if not records:
        return {
            "period": {"month": month, "year": year},
            "summary": {"total_records": 0, "grand_total": 0, "avg_attendance": 0, "total_converts": 0},
            "category_totals": {"men": 0, "women": 0, "youth": 0, "children": 0, "visitors": 0},
            "records": []
        }

    total_men = sum(r.men for r in records)
    total_women = sum(r.women for r in records)
    total_youth = sum(r.youth for r in records)
    total_children = sum(r.children for r in records)
    total_visitors = sum(r.visitors for r in records)
    total_converts = sum(r.converts for r in records)
    
    grand_total = sum(r.total for r in records)
    avg_attendance = round(grand_total / len(records), 1)

    return {
        "period": {"month": month, "year": year},
        "summary": {
            "total_records": len(records),
            "grand_total": grand_total,
            "avg_attendance": avg_attendance,
            "total_converts": total_converts,
        },
        "category_totals": {
            "men": total_men,
            "women": total_women,
            "youth": total_youth,
            "children": total_children,
            "visitors": total_visitors,
        },
        "records": [
            {
                "id": r.id,
                "date": str(r.date),
                "service_type": r.service_type,
                "men": r.men,
                "women": r.women,
                "youth": r.youth,
                "children": r.children,
                "visitors": r.visitors,
                "converts": r.converts,
                "total": r.total,
                "notes": r.notes
            } for r in records
        ]
    }


# ── 1. Reporte Financiero Mensual (Caja de Ofrendas) ──
@router.get("/financial/monthly")
def report_financial_monthly(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2000),
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    offerings = db.query(ChurchOffering).filter(
        extract("month", ChurchOffering.date) == month,
        extract("year", ChurchOffering.date) == year,
    ).all()

    incomes = db.query(ChurchIncome).filter(
        extract("month", ChurchIncome.date) == month,
        extract("year", ChurchIncome.date) == year,
    ).all()

    expenses = db.query(ChurchExpense).filter(
        extract("month", ChurchExpense.date) == month,
        extract("year", ChurchExpense.date) == year,
    ).all()
    
    injections = db.query(BankInjection).filter(
        extract("month", BankInjection.date) == month,
        extract("year", BankInjection.date) == year,
    ).all()

    total_offerings = sum(o.amount for o in offerings)
    total_incomes = sum(i.amount for i in incomes)
    total_expenses = sum(e.amount for e in expenses)
    total_injections = sum(inj.amount for inj in injections)
    
    # El balance en Caja de Ofrendas resta también los traslados a bancos (inyecciones)
    balance = total_offerings + total_incomes - total_expenses - total_injections

    monthly_goal = db.query(func.sum(FixedExpense.amount)).scalar() or 0

    # Agrupados por tipo (para gráfico)
    offerings_by_type = {}
    for o in offerings:
        offerings_by_type[o.offering_type] = offerings_by_type.get(o.offering_type, 0) + o.amount

    expenses_by_type = {}
    for e in expenses:
        expenses_by_type[e.expense_type] = expenses_by_type.get(e.expense_type, 0) + e.amount
        
    for inj in injections:
        expenses_by_type["Traslado a Bancos"] = expenses_by_type.get("Traslado a Bancos", 0) + inj.amount

    return {
        "period": {"month": month, "year": year},
        "summary": {
            "total_offerings": round(total_offerings, 2),
            "total_incomes": round(total_incomes, 2),
            "total_expenses": round(total_expenses + total_injections, 2), # Se suma a los gastos totales para la vista general
            "pure_expenses": round(total_expenses, 2),
            "total_injections": round(total_injections, 2),
            "balance": round(balance, 2),
            "monthly_goal": round(monthly_goal, 2),
            "goal_completion_pct": round((total_offerings + total_incomes) / monthly_goal * 100, 1) if monthly_goal > 0 else 0,
        },
        "offerings_by_type": [{"type": k, "amount": round(v, 2)} for k, v in offerings_by_type.items()],
        "expenses_by_type": [{"type": k, "amount": round(v, 2)} for k, v in expenses_by_type.items()],
        "transactions": {
            "offerings": [{"date": str(o.date), "type": o.offering_type, "amount": o.amount, "donor": o.donor_name} for o in offerings],
            "incomes": [{"date": str(i.date), "type": i.income_type, "amount": i.amount, "donor": i.donor_name} for i in incomes],
            "expenses": [{"date": str(e.date), "type": e.expense_type, "amount": e.amount, "observations": e.observations} for e in expenses],
            "injections": [{"date": str(i.date), "type": "Traslado a Bancos", "amount": i.amount, "observations": i.observations} for i in injections],
        },
    }

# ── 1.5. Reporte de Bancos (Caja General) ──
@router.get("/financial/bank-monthly")
def report_financial_bank_monthly(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2000),
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    from app.models.finance_model import BankDeposit, BankInjection, BankWithdrawal, BankAccount
    
    deposits = db.query(BankDeposit).filter(
        extract("month", BankDeposit.date) == month,
        extract("year", BankDeposit.date) == year,
    ).all()
    
    injections = db.query(BankInjection).filter(
        extract("month", BankInjection.date) == month,
        extract("year", BankInjection.date) == year,
    ).all()
    
    withdrawals = db.query(BankWithdrawal).filter(
        extract("month", BankWithdrawal.date) == month,
        extract("year", BankWithdrawal.date) == year,
    ).all()
    
    accounts = db.query(BankAccount).all()
    account_map = {acc.id: f"{acc.bank_name} - {acc.account_number}" for acc in accounts}
    
    total_deposits = sum(d.amount for d in deposits)
    total_injections = sum(i.amount for i in injections)
    total_withdrawals = sum(w.amount for w in withdrawals)
    
    # Agrupación de ingresos a banco (depósitos e inyecciones) y retiros
    transactions = []
    
    for d in deposits:
        transactions.append({
            "id": f"dep-{d.id}",
            "date": str(d.date),
            "type": "Depósito (Directo)",
            "account": account_map.get(d.bank_account_id, "Desconocida"),
            "amount": d.amount,
            "observations": d.observations,
            "reference": d.slip_number,
            "sign": "+"
        })
        
    for inj in injections:
        transactions.append({
            "id": f"inj-{inj.id}",
            "date": str(inj.date),
            "type": "Inyección (Desde Caja)",
            "account": account_map.get(inj.bank_account_id, "Desconocida"),
            "amount": inj.amount,
            "observations": inj.observations,
            "reference": inj.slip_number,
            "sign": "+"
        })
        
    for w in withdrawals:
        transactions.append({
            "id": f"wd-{w.id}",
            "date": str(w.date),
            "type": "Retiro/Salida",
            "account": account_map.get(w.bank_account_id, "Desconocida"),
            "amount": w.amount,
            "observations": w.concept,
            "reference": w.reference_number,
            "sign": "-"
        })
        
    transactions.sort(key=lambda x: x["date"], reverse=True)
    
    return {
        "period": {"month": month, "year": year},
        "summary": {
            "total_deposits": round(total_deposits, 2),
            "total_injections": round(total_injections, 2),
            "total_incomes": round(total_deposits + total_injections, 2),
            "total_withdrawals": round(total_withdrawals, 2),
            "net_flow": round((total_deposits + total_injections) - total_withdrawals, 2)
        },
        "transactions": transactions
    }


# ── 2. Reporte Financiero Anual ── PERF-01: optimizado con GROUP BY (3 queries en vez de 36)
@router.get("/financial/annual")
def report_financial_annual(
    year: int = Query(..., ge=2000),
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    # Una sola query por tabla, agrupada por mes
    offerings_by_month = db.query(
        extract("month", ChurchOffering.date).label("month"),
        func.sum(ChurchOffering.amount).label("total")
    ).filter(extract("year", ChurchOffering.date) == year).group_by("month").all()

    incomes_by_month = db.query(
        extract("month", ChurchIncome.date).label("month"),
        func.sum(ChurchIncome.amount).label("total")
    ).filter(extract("year", ChurchIncome.date) == year).group_by("month").all()

    expenses_by_month = db.query(
        extract("month", ChurchExpense.date).label("month"),
        func.sum(ChurchExpense.amount).label("total")
    ).filter(extract("year", ChurchExpense.date) == year).group_by("month").all()

    # Convertir a diccionarios para lookup O(1)
    off_map = {int(r.month): float(r.total) for r in offerings_by_month}
    inc_map = {int(r.month): float(r.total) for r in incomes_by_month}
    exp_map = {int(r.month): float(r.total) for r in expenses_by_month}

    monthly_data = []
    for m in range(1, 13):
        t_off = off_map.get(m, 0)
        t_inc = inc_map.get(m, 0)
        t_exp = exp_map.get(m, 0)
        monthly_data.append({
            "month": m,
            "total_offerings": round(t_off, 2),
            "total_incomes": round(t_inc, 2),
            "total_expenses": round(t_exp, 2),
            "balance": round(t_off + t_inc - t_exp, 2),
        })

    year_totals = {
        "total_offerings": round(sum(r["total_offerings"] for r in monthly_data), 2),
        "total_incomes": round(sum(r["total_incomes"] for r in monthly_data), 2),
        "total_expenses": round(sum(r["total_expenses"] for r in monthly_data), 2),
        "balance": round(sum(r["balance"] for r in monthly_data), 2),
    }

    return {"year": year, "year_totals": year_totals, "monthly_breakdown": monthly_data}


# ── 3. Reporte de Feligreses ──
@router.get("/members")
def report_members(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    members = db.query(Member).order_by(Member.last_name).all()

    active = [m for m in members if m.status == "active"]
    inactive = [m for m in members if m.status != "active"]

    today = date.today()
    birthdays_this_month = [
        m for m in members
        if m.birth_date and m.birth_date.month == today.month
    ]
    anniversaries_this_month = [
        m for m in members
        if m.baptism_date and m.baptism_date.month == today.month
    ]

    return {
        "summary": {
            "total": len(members),
            "active": len(active),
            "inactive": len(inactive),
        },
        "birthdays_this_month": [
            {"name": f"{m.first_name} {m.last_name}", "birth_date": str(m.birth_date), "phone": m.phone}
            for m in birthdays_this_month
        ],
        "baptism_anniversaries_this_month": [
            {"name": f"{m.first_name} {m.last_name}", "baptism_date": str(m.baptism_date), "phone": m.phone}
            for m in anniversaries_this_month
        ],
        "members": [
            {
                "id": m.id,
                "name": f"{m.first_name} {m.last_name}",
                "phone": m.phone,
                "email": m.email,
                "status": m.status,
                "birth_date": str(m.birth_date) if m.birth_date else None,
                "baptism_date": str(m.baptism_date) if m.baptism_date else None,
            }
            for m in members
        ],
    }


# ── 4. Reporte de Proyectos ──
@router.get("/projects")
def report_projects(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    projects = db.query(Project).order_by(Project.created_at.desc()).all()

    by_status = {}
    for p in projects:
        by_status[p.status] = by_status.get(p.status, 0) + 1

    total_budget = sum(p.budget or 0 for p in projects)
    total_contributions = sum(p.contributions or 0 for p in projects)
    total_expenses = sum(p.spent or 0 for p in projects)

    return {
        "summary": {
            "total_projects": len(projects),
            "by_status": by_status,
            "total_budget": round(total_budget, 2),
            "total_contributions": round(total_contributions, 2),
            "total_expenses": round(total_expenses, 2),
            "total_available": round(total_contributions - total_expenses, 2),
        },
        "projects": [
            {
                "id": p.id,
                "name": p.name,
                "status": p.status,
                "budget": p.budget,
                "contributions": p.contributions,
                "expenses": p.spent,
                "available": round((p.contributions or 0) - (p.spent or 0), 2),
                "progress": round((p.contributions or 0) / p.budget * 100, 1) if p.budget else 0,
            }
            for p in projects
        ],
    }


# ── 5. Reporte de Eventos ──
@router.get("/events")
def report_events(
    year: int = Query(..., ge=2000),
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    events = db.query(Event).filter(
        extract("year", Event.start_datetime) == year
    ).order_by(Event.start_datetime).all()

    by_type = {}
    by_status = {}
    by_month = {m: 0 for m in range(1, 13)}

    for ev in events:
        by_type[ev.event_type] = by_type.get(ev.event_type, 0) + 1
        by_status[ev.status] = by_status.get(ev.status, 0) + 1
        by_month[ev.start_datetime.month] = by_month.get(ev.start_datetime.month, 0) + 1

    return {
        "year": year,
        "summary": {
            "total_events": len(events),
            "by_type": by_type,
            "by_status": by_status,
            "by_month": [{"month": m, "count": c} for m, c in by_month.items()],
        },
        "events": [
            {
                "id": ev.id,
                "title": ev.title,
                "type": ev.event_type,
                "status": ev.status,
                "location": ev.location,
                "start": str(ev.start_datetime),
                "end": str(ev.end_datetime) if ev.end_datetime else None,
            }
            for ev in events
        ],
    }


# ── 6. Reporte de Aportaciones por Miembro ──
@router.get("/member/{member_id}/contributions")
def report_member_contributions(
    member_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        return {"error": "Miembro no encontrado"}

    # 1. Ofrendas de Iglesia (church_offerings)
    co_q = db.query(ChurchOffering).filter(ChurchOffering.member_id == member_id).all()
    
    # 2. Otros Ingresos (church_incomes)
    ci_q = db.query(ChurchIncome).filter(ChurchIncome.member_id == member_id).all()
    
    # 3. Ofrendas Individuales (offerings) + join OfferingType
    io_q = db.query(Offering, OfferingType.name).join(
        OfferingType, Offering.offering_type_id == OfferingType.id
    ).filter(Offering.member_id == member_id).all()

    transactions = []
    
    for co in co_q:
        transactions.append({
            "date": str(co.date),
            "category": "Ofrenda General",
            "type": co.offering_type,
            "amount": co.amount,
            "observations": co.observations
        })
        
    for ci in ci_q:
        transactions.append({
            "date": str(ci.date),
            "category": "Otros Ingresos",
            "type": ci.income_type,
            "amount": ci.amount,
            "observations": ci.observations
        })
        
    for off, type_name in io_q:
        transactions.append({
            "date": str(off.date),
            "category": "Ofrenda Individual",
            "type": type_name,
            "amount": off.amount,
            "observations": "Registro módulo ofrendas"
        })

    # Ordenar por fecha desc
    transactions.sort(key=lambda x: x["date"], reverse=True)
    total_amount = sum(t["amount"] for t in transactions)

    return {
        "member_name": f"{member.first_name} {member.last_name}",
        "summary": {
            "total_contributions": round(total_amount, 2),
            "count": len(transactions)
        },
        "transactions": transactions
    }