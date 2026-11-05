from decimal import Decimal, ROUND_HALF_UP


def cash_balance(offerings=0, incomes=0, expenses=0, bank_transfers=0, tithe=0):
    """Saldo físico de Caja de Ofrendas para un periodo."""
    return (
        float(offerings or 0)
        + float(incomes or 0)
        - float(expenses or 0)
        - float(bank_transfers or 0)
        - float(tithe or 0)
    )


def contributor_name(donor_name=None, member=None):
    """Devuelve el nombre escrito o, si se eligió un miembro, su nombre completo."""
    typed_name = (donor_name or "").strip()
    if typed_name:
        return typed_name
    if member:
        full_name = f"{member.first_name or ''} {member.last_name or ''}".strip()
        return full_name or None
    return None


def calculate_tithe(base_amount, percentage):
    """Calcula el importe confirmado con precisión monetaria de dos decimales."""
    base = Decimal(str(base_amount or 0))
    rate = Decimal(str(percentage or 0))
    return float((base * rate / Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))
