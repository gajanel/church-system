# gunicorn.conf.py — Configuración de producción para Gunicorn
# Uso: gunicorn -c gunicorn.conf.py main:app

import multiprocessing
import os

# ── Workers ────────────────────────────────────────────────────────
# Regla: (2 × núcleos_CPU) + 1
workers = (multiprocessing.cpu_count() * 2) + 1
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000
timeout = 120            # reinicia workers que tarden > 120s
keepalive = 5

# ── Bind ───────────────────────────────────────────────────────────
# Nginx hace el reverse proxy — solo escuchamos en localhost
bind = "127.0.0.1:8000"

# ── Logging ────────────────────────────────────────────────────────
loglevel = "info"
accesslog = "/var/log/church-system/access.log"
errorlog  = "/var/log/church-system/error.log"
access_log_format = '%(h)s "%(r)s" %(s)s %(b)s %(D)sµs'

# ── Process ────────────────────────────────────────────────────────
proc_name = "church_system"
daemon    = False   # systemd manejará el proceso

# ── Seguridad ──────────────────────────────────────────────────────
limit_request_line   = 4094
limit_request_fields = 100
