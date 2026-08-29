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
