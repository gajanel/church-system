import json
import io
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from app.database.connection import get_db
from app.schemas.settings_schema import SettingsResponse, SettingsUpdate
from app.services import settings_service
from app.utils.dependencies import only_admin, get_current_user
from app.models import user_model
from passlib.context import CryptContext

router = APIRouter(prefix="/settings", tags=["Configuración"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ── Settings CRUD ─────────────────────────────────────────────────────
@router.get("", response_model=SettingsResponse)
def get_settings(db: Session = Depends(get_db), user = Depends(get_current_user)):
    return settings_service.get_settings(db)

@router.get("/public", response_model=SettingsResponse)
def get_public_settings(db: Session = Depends(get_db)):
    """Retorna la configuración básica sin necesidad de autenticación."""
    return settings_service.get_settings(db)

@router.put("", response_model=SettingsResponse)
def update_settings(data: SettingsUpdate, db: Session = Depends(get_db), user = Depends(only_admin)):
    return settings_service.update_settings(db, data)

# ── Backup manual ─────────────────────────────────────────────────────
@router.get("/backup")
def download_backup(db: Session = Depends(get_db), user = Depends(only_admin)):
    """Genera y descarga un backup JSON de toda la base de datos."""
    backup = {}
    tables = [
        "members", "ministries", "ministry_roles", "member_ministries",
        "offerings", "incomes", "expenses", "projects",
        "events", "privileges", "announcements", "attendance_records",
        "settings", "users"
    ]
    for table in tables:
        try:
            rows = db.execute(text(f"SELECT * FROM {table}")).mappings().all()
            backup[table] = [dict(row) for row in rows]
        except Exception:
            backup[table] = []

    # Serializar fechas (datetime y date)
    import datetime as dt
    def serialize(obj):
        if isinstance(obj, (dt.datetime, dt.date)):
            return obj.isoformat()
        raise TypeError(f"Type {type(obj)} not serializable")

    content = json.dumps(backup, default=serialize, ensure_ascii=False, indent=2)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"backup_iglesia_{timestamp}.json"

    return StreamingResponse(
        io.BytesIO(content.encode("utf-8")),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# ── Restaurar backup ──────────────────────────────────────────────────
@router.post("/restore-data")
async def restore_backup_data(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user = Depends(only_admin)
):
    """
    Restaura la base de datos desde un archivo JSON de backup.
    Usa INSERT OR REPLACE para no romper datos existentes con IDs distintos.
    """
    from fastapi import UploadFile
    import json as _json

    contents = await file.read()
    try:
        backup = _json.loads(contents.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=400, detail="Archivo de backup inválido o corrupto.")

    if not isinstance(backup, dict):
        raise HTTPException(status_code=400, detail="El formato del backup no es válido.")

    restored = {}
    errors = {}

    # Orden de restauración respetando FK constraints
    restore_order = [
        "users", "settings", "members", "ministries", "ministry_roles",
        "member_ministries", "offerings", "incomes", "expenses",
        "projects", "events", "privileges", "announcements", "attendance_records"
    ]

    for table in restore_order:
        rows = backup.get(table, [])
        if not rows:
            restored[table] = 0
            continue

        count = 0
        table_errors = []
        for row in rows:
            try:
                cols = list(row.keys())
                vals = [row[c] for c in cols]
                placeholders = ", ".join([f":{c}" for c in cols])
                col_names = ", ".join([f'"{c}"' for c in cols])
                sql = f'INSERT INTO "{table}" ({col_names}) VALUES ({placeholders}) ON CONFLICT DO NOTHING'
                db.execute(text(sql), row)
                count += 1
            except Exception as e:
                table_errors.append(str(e)[:120])

        if table_errors:
            errors[table] = table_errors[:3]

        restored[table] = count

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al confirmar restauración: {str(e)}")

    return {
        "message": "Restauración completada.",
        "restored_rows": restored,
        "warnings": errors if errors else None
    }


# ── Reset a valores de fábrica ─────────────────────────────────────────
@router.post("/factory-reset")
def factory_reset(db: Session = Depends(get_db), user = Depends(only_admin)):
    """Resetea la configuración visual y básica a los valores predeterminados."""
    settings = settings_service.get_settings(db)
    settings.church_name = "Mi Iglesia"
    settings.primary_color = "#1e3a8a"
    settings.secondary_color = "#3b82f6"
    settings.font_family = "'Inter', sans-serif"
    settings.bible_verse = '"Porque de tal manera amó Dios al mundo..." — Juan 3:16'
    db.commit()
    return {"message": "Configuración reseteada con éxito."}
