# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv

load_dotenv()

# ── Detectar entorno ──────────────────────────────────────────────────
ENV = os.getenv("ENV", "development").lower()
IS_PRODUCTION = ENV == "production"

from sqlalchemy.orm import Session
from app.database.connection import engine, Base, SessionLocal
from app.routers import (
    user_router, member_router, ministry_router,
    finance_router, project_router, event_router,
    report_router, privilege_router, announcement_router,
    attendance_router, settings_router, audit_router
)
from app.routers.ministry_workspace_router import router as ministry_workspace_router
from app.models import (
    user_model, member_model, ministry_model,
    member_ministry_model, finance_model, project_model,
    privilege_model, announcement_model, event_model,
    attendance_model, settings_model, audit_model,
    ministry_workspace_model, ministry_monthly_report_model
)
from migrations import migrate_users
from migrations import migrate_photo
from migrations import migrate_ministry_days
from migrations import migrate_privileges_dynamic
from migrations import migrate_settings_verse
from migrations import migrate_member_fields
from migrations import migrate_expense_document
from migrations import migrate_ministry_workspace
from migrations import migrate_fix_ministry_delete
from migrations import migrate_audit_device
from migrations import migrate_ministry_monthly_reports
from migrations import migrate_bank_withdrawal
from migrations import migrate_attendance_demographics


load_dotenv()

# ── Logging estructurado ────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("church_system")

# ── Rate limiter (protege /auth/login de fuerza bruta) ─────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])


def create_initial_admin(db: Session):
    from app.models.user_model import User
    from app.utils.security import hash_password
    
    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        logger.info("👤 Creando usuario administrador inicial (admin/admin123)...")
        new_admin = User(
            name="Administrador",
            username="admin",
            email="admin@sistema.com",
            password=hash_password("admin123"),
            is_admin=True,
            is_super_admin=True,
            modules=["members", "ministries", "finance", "projects", "events", "reports", "users", "settings"],
            must_change_password=True
        )
        db.add(new_admin)
        db.commit()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Iniciando sistema — ejecutando migraciones de base de datos...")
    try:
        # Asegurar que las tablas base existan antes de correr scripts de alteración
        Base.metadata.create_all(bind=engine)
        
        migrate_users.migrate(engine)
        migrate_photo.migrate(engine)
        migrate_ministry_days.migrate(engine)
        migrate_privileges_dynamic.migrate(engine)
        migrate_settings_verse.migrate(engine)
        migrate_member_fields.migrate(engine)
        migrate_expense_document.migrate(engine)
        migrate_ministry_workspace.migrate(engine)
        migrate_fix_ministry_delete.migrate(engine)
        migrate_audit_device.migrate()
        migrate_ministry_monthly_reports.migrate(engine)
        migrate_bank_withdrawal.migrate(engine)
        migrate_attendance_demographics.migrate(engine)
        
        # Crear admin inicial si no existe
        db = SessionLocal()
        create_initial_admin(db)
        db.close()
        
        logger.info("✅ Todas las migraciones y semilla de datos completadas exitosamente.")
    except Exception as e:
        logger.error(f"❌ Error crítico en migraciones: {e}", exc_info=True)
    yield
    logger.info("⏹️  Sistema detenido.")


# SEC-01: Deshabilitar Swagger/ReDoc completamente en producción
_docs_url  = None if IS_PRODUCTION else "/api/docs"
_redoc_url = None if IS_PRODUCTION else "/api/redoc"

app = FastAPI(
    title="Church System API",
    version="1.1.0",
    description="Sistema de Gestión de Iglesia — API REST",
    docs_url=_docs_url,
    redoc_url=_redoc_url,
    lifespan=lifespan,
)

# ── State para slowapi ─────────────────────────────────────────────
app.state.limiter = limiter

# ── Middleware: orden importa (primero CORS, luego GZip) ───────────
raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
allowed_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]
logger.info(f"CORS: Orígenes permitidos -> {allowed_origins}")

# SEC-06: El regex de LAN solo aplica en entornos de desarrollo/local.
# En producción, ALLOWED_ORIGINS debe contener únicamente el dominio exacto.
_cors_regex = (
    r"http://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?"
    if not IS_PRODUCTION else None
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=_cors_regex,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"] if IS_PRODUCTION else ["*"],
    allow_headers=["Authorization", "Content-Type"] if IS_PRODUCTION else ["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=500)  # comprime respuestas > 500 bytes

# ── Handler de rate limit ──────────────────────────────────────────
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── Handler global de excepciones no capturadas ────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Error no capturado en {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Error interno del servidor. Contacte al administrador."},
    )

# ── Archivos estáticos ─────────────────────────────────────────────
if not os.path.exists("static"):
    os.makedirs("static")
app.mount("/static", StaticFiles(directory="static"), name="static")

# ── Routers ───────────────────────────────────────────────────────
app.include_router(user_router.router, prefix="/auth")
app.include_router(member_router.router)
app.include_router(ministry_router.router)
app.include_router(finance_router.router)
app.include_router(project_router.router)
app.include_router(event_router.router)
app.include_router(report_router.router)
app.include_router(privilege_router.router)
app.include_router(announcement_router.router)
app.include_router(attendance_router.router)
app.include_router(settings_router.router)
app.include_router(audit_router.router)
app.include_router(ministry_workspace_router)


# ── Health check robusto ───────────────────────────────────────────
@app.get("/health", tags=["Sistema"])
def health_check():
    """Verifica que la API y la base de datos estén operativas."""
    try:
        db = SessionLocal()
        db.execute(__import__("sqlalchemy").text("SELECT 1"))
        db.close()
        db_status = "ok"
    except Exception as e:
        logger.error(f"Health check DB falló: {e}")
        db_status = "error"

    status = "healthy" if db_status == "ok" else "degraded"
    # SEC-05: No exponer versión del sistema en producción
    response = {"status": status, "database": db_status}
    if not IS_PRODUCTION:
        response["version"] = "1.1.0"
    return response


import sys
if getattr(sys, 'frozen', False):
    application_path = os.path.dirname(sys.executable)
else:
    application_path = os.path.dirname(os.path.abspath(__file__))

frontend_path = os.path.join(application_path, "frontend")

if os.path.exists(frontend_path):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_path, "assets")), name="assets")
    
    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_react_app(full_path: str):
        root_path = os.path.realpath(frontend_path)
        file_path = os.path.realpath(os.path.join(root_path, full_path))
        if os.path.commonpath([root_path, file_path]) != root_path:
            return JSONResponse(status_code=404, content={"detail": "Archivo no encontrado"})
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_path, "index.html"))
else:
    @app.get("/", tags=["Sistema"])
    def root():
        return {"message": "Sistema de gestión de iglesia — OK (Frontend no encontrado)", "version": "1.1.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
