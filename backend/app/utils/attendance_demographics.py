def normalize_gender(value):
    normalized = (value or "").strip().lower()
    if normalized in {"m", "masculino", "hombre"}:
        return "Masculino"
    if normalized in {"f", "femenino", "mujer"}:
        return "Femenino"
    return None


def age_group(birth_date, attendance_date):
    if not birth_date:
        return None
    age = attendance_date.year - birth_date.year - (
        (attendance_date.month, attendance_date.day) < (birth_date.month, birth_date.day)
    )
    # La categoría institucional empieza en 4 años. Los menores de 4 se
    # conservan en Niños para que ninguna asistencia desaparezca del desglose.
    if age < 13:
        return "Niño"
    if age < 18:
        return "Adolescente"
    if age < 36:
        return "Joven"
    if age < 61:
        return "Adulto"
    return "Adulto Mayor"
