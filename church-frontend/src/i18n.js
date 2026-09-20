/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importar locales directamente para evitar problemas de carga estática inicial
const resources = {
  es: {
    translation: {
      "common": {
        "save": "Guardar",
        "cancel": "Cancelar",
        "delete": "Eliminar",
        "edit": "Editar",
        "loading": "Cargando...",
        "no_data": "No hay datos disponibles",
        "search": "Buscar...",
        "actions": "Navegación"
      },
      "sidebar": {
        "dashboard": "Inicio",
        "members": "Miembros",
        "ministries": "Ministerios",
        "finance": "Finanzas",
        "projects": "Proyectos",
        "events": "Eventos",
        "privileges": "Privilegios",
        "announcements": "Anuncios",
        "attendance": "Asistencia",
        "reports": "Reportes",
        "finance_summary": "Resumen financiero",
        "cash": "Caja general",
        "offerings": "Ofrendas",
        "incomes": "Otros ingresos",
        "expenses": "Gastos",
        "goals": "Metas financieras",
        "deposits": "Bancos y boletas",
        "reports_summary": "Centro de reportes",
        "monthly_report": "Balance mensual",
        "bank_report": "Conciliación bancaria",
        "annual_report": "Cierre anual",
        "members_report": "Informe de miembros",
        "projects_report": "Informe de proyectos",
        "contributions_report": "Aportes por miembro",
        "attendance_report": "Informe de asistencia",
        "ministries_report": "Informe de ministerios",
        "administration": "Administración",
        "users": "Gestión de Usuarios",
        "settings": "Configuración",
        "logout": "Cerrar Sesión"
      },
      "dashboard": {
        "title": "Panel de Control",
        "subtitle": "Panel de Control"
      },
      "user_management": {
        "admin": "Administrador",
        "user": "Usuario"
      }
    }
  },
  en: {
    translation: {
      "common": {
        "save": "Save",
        "cancel": "Cancel",
        "delete": "Delete",
        "edit": "Edit",
        "loading": "Loading...",
        "no_data": "No data available",
        "search": "Search...",
        "actions": "Navigation"
      },
      "sidebar": {
        "dashboard": "Dashboard",
        "members": "Members",
        "ministries": "Ministries",
        "finance": "Finance",
        "projects": "Projects",
        "events": "Events",
        "privileges": "Privileges",
        "announcements": "Announcements",
        "attendance": "Attendance",
        "reports": "Reports",
        "finance_summary": "Financial overview",
        "cash": "Cash register",
        "offerings": "Offerings",
        "incomes": "Other income",
        "expenses": "Expenses",
        "goals": "Financial goals",
        "deposits": "Banking and deposits",
        "reports_summary": "Reports center",
        "monthly_report": "Monthly balance",
        "bank_report": "Bank reconciliation",
        "annual_report": "Annual close",
        "members_report": "Members report",
        "projects_report": "Projects report",
        "contributions_report": "Member contributions",
        "attendance_report": "Attendance report",
        "ministries_report": "Ministries report",
        "administration": "Administration",
        "users": "User Management",
        "settings": "Settings",
        "logout": "Logout"
      },
      "dashboard": {
        "title": "Control Panel",
        "subtitle": "Control Panel"
      },
      "user_management": {
        "admin": "Administrator",
        "user": "User"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    }
  });

export default i18n;
