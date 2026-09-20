# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.

from datetime import date

from sqlalchemy import inspect, text
from app.utils.attendance_demographics import age_group, normalize_gender


def _as_date(value):
    if isinstance(value, date):
        return value
    return date.fromisoformat(str(value)[:10])


def migrate(engine):
    """Add demographic snapshots to attendance details without losing history."""
    inspector = inspect(engine)
    if "attendance_records" not in inspector.get_table_names():
        return

    existing = {column["name"] for column in inspector.get_columns("attendance_records")}
    attendance_existing = {column["name"] for column in inspector.get_columns("attendance")}
    statements = []
    if "gender" not in existing:
        statements.append("ALTER TABLE attendance_records ADD COLUMN gender VARCHAR(20)")
    if "age_group" not in existing:
        statements.append("ALTER TABLE attendance_records ADD COLUMN age_group VARCHAR(20)")
    if "teens" not in attendance_existing:
        statements.append("ALTER TABLE attendance ADD COLUMN teens INTEGER DEFAULT 0")
    if "seniors" not in attendance_existing:
        statements.append("ALTER TABLE attendance ADD COLUMN seniors INTEGER DEFAULT 0")

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))
        connection.execute(text(
            "UPDATE members SET gender = CASE "
            "WHEN LOWER(TRIM(gender)) IN ('m', 'masculino', 'hombre') THEN 'Masculino' "
            "WHEN LOWER(TRIM(gender)) IN ('f', 'femenino', 'mujer') THEN 'Femenino' "
            "ELSE gender END WHERE gender IS NOT NULL"
        ))
        connection.execute(text("UPDATE attendance SET service_type = 'Culto de Oración' WHERE service_type = 'Culto de Oracion'"))
        connection.execute(text("UPDATE attendance SET service_type = 'Culto de Jóvenes' WHERE service_type = 'Culto de Jovenes'"))
        connection.execute(text("UPDATE attendance SET service_type = 'Reunión' WHERE service_type = 'Reunion'"))

        detail_rows = connection.execute(text(
            "SELECT ar.id, ar.attendance_id, ar.person_type, ar.is_convert, "
            "ar.gender, ar.age_group, a.date AS attendance_date, "
            "m.gender AS member_gender, m.birth_date "
            "FROM attendance_records ar "
            "JOIN attendance a ON a.id = ar.attendance_id "
            "LEFT JOIN members m ON m.id = ar.member_id"
        )).mappings().all()
        totals = {}
        for row in detail_rows:
            stats = totals.setdefault(row["attendance_id"], {
                "men": 0, "women": 0, "youth": 0, "children": 0,
                "teens": 0, "seniors": 0,
                "visitors": 0, "converts": 0, "total": 0,
            })
            stats["total"] += 1
            if row["is_convert"]:
                stats["converts"] += 1
            if row["person_type"] == "Visitante":
                stats["visitors"] += 1

            gender = normalize_gender(row["member_gender"] or row["gender"])
            group = row["age_group"]
            if row["birth_date"]:
                group = age_group(_as_date(row["birth_date"]), _as_date(row["attendance_date"]))
            connection.execute(text(
                "UPDATE attendance_records SET gender = :gender, age_group = :age_group WHERE id = :id"
            ), {"gender": gender, "age_group": group, "id": row["id"]})

            if group == "Niño":
                stats["children"] += 1
            elif group == "Adolescente":
                stats["teens"] += 1
            elif group == "Joven":
                stats["youth"] += 1
            elif group == "Adulto Mayor":
                stats["seniors"] += 1
            elif gender == "Masculino":
                stats["men"] += 1
            elif gender == "Femenino":
                stats["women"] += 1

        for attendance_id, stats in totals.items():
            connection.execute(text(
                "UPDATE attendance SET men=:men, women=:women, youth=:youth, children=:children, "
                "teens=:teens, seniors=:seniors, "
                "visitors=:visitors, converts=:converts, total=:total WHERE id=:attendance_id"
            ), {**stats, "attendance_id": attendance_id})

    print("OK - Datos demográficos de asistencia verificados.")
