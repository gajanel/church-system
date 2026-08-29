# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class MonthlyReportIn(BaseModel):
    # Sección 1 — Datos Generales
    reporter_name: str
    report_month:  str
    ministry_name: str

    # Sección 2 — Membresía Actual
    mem_children: int = 0
    mem_teens:    int = 0
    mem_youth:    int = 0
    mem_women:    int = 0
    mem_men:      int = 0
    mem_seniors:  int = 0

    # Sección 3 — Promedio de Asistencia
    att_children: int = 0
    att_teens:    int = 0
    att_youth:    int = 0
    att_women:    int = 0
    att_men:      int = 0
    att_seniors:  int = 0

    # Sección 4 — Actividades
    act_scheduled:  int = 0
    act_done:       int = 0
    act_services:   int = 0
    act_fasts:      int = 0
    act_visits:     int = 0
    act_sales:      int = 0
    act_reconciled: int = 0
    act_meetings:   int = 0

    # Sección 5 — Sermones
    sermon_week1: Optional[str] = None
    sermon_week2: Optional[str] = None
    sermon_week3: Optional[str] = None
    sermon_week4: Optional[str] = None
    sermon_week5: Optional[str] = None

    # Sección 6 — Financiero
    fin_offerings:       float = 0.0
    fin_sales:           float = 0.0
    fin_special:         float = 0.0
    fin_social_expense:  float = 0.0
    fin_project_expense: float = 0.0
    # fin_report_url comes from file upload, handled separately


class MonthlyReportOut(BaseModel):
    id:                  int
    ministry_id:         int

    reporter_name:       str
    report_month:        str
    ministry_name:       str

    mem_children:        int
    mem_teens:           int
    mem_youth:           int
    mem_women:           int
    mem_men:             int
    mem_seniors:         int

    att_children:        int
    att_teens:           int
    att_youth:           int
    att_women:           int
    att_men:             int
    att_seniors:         int

    act_scheduled:       int
    act_done:            int
    act_services:        int
    act_fasts:           int
    act_visits:          int
    act_sales:           int
    act_reconciled:      int
    act_meetings:        int

    sermon_week1:        Optional[str]
    sermon_week2:        Optional[str]
    sermon_week3:        Optional[str]
    sermon_week4:        Optional[str]
    sermon_week5:        Optional[str]

    fin_offerings:       float
    fin_sales:           float
    fin_special:         float
    fin_social_expense:  float
    fin_project_expense: float
    fin_report_url:      Optional[str]

    created_by:  Optional[str]
    created_at:  datetime

    class Config:
        from_attributes = True
