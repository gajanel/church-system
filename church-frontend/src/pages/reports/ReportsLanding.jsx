import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";
import styles from "./ReportsLanding.module.css";

const CARDS = [
  {
    title: "Balance Mensual",
    desc: "Examina el estado financiero del mes: ofrendas, ingresos, gastos y balance neto en un reporte consolidado.",
    path: "/reports/monthly",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
        <path d="M0 0h1v15h15v1H0zm14.817 3.113a.5.5 0 0 1 .07.704l-4.5 5.5a.5.5 0 0 1-.74.037L7.06 6.767l-3.656 5.027a.5.5 0 0 1-.808-.588l4-5.5a.5.5 0 0 1 .758-.06l2.609 2.61 4.15-5.073a.5.5 0 0 1 .704-.07"/>
      </svg>
    ),
    color: "#2563eb",
    bg: "rgba(37,99,235,0.09)",
  },
  {
    title: "Corte Anual",
    desc: "Resumen financiero del año: comparativa mensual de ingresos y egresos con proyecciones y totales anuales.",
    path: "/reports/annual",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
        <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z"/>
      </svg>
    ),
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.09)",
  },
  {
    title: "Libro Demográfico",
    desc: "Directorio completo de miembros con datos personales, estado de actividad y métricas congregacionales.",
    path: "/reports/members",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
        <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1zm-7.978-1L7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002-.014.002zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0M6.936 9.28a6 6 0 0 0-1.23-.247A7 7 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216A2.24 2.24 0 0 1 5 13c0-.25.006-.988.434-1.856A5.7 5.7 0 0 1 6.936 9.28"/><path d="M4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5"/>
      </svg>
    ),
    color: "#059669",
    bg: "rgba(5,150,105,0.09)",
  },
  {
    title: "Obras Misioneras",
    desc: "Reporte de proyectos y obras misioneras: avance, presupuesto ejecutado y contribuciones recibidas.",
    path: "/reports/projects",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
        <path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783"/>
      </svg>
    ),
    color: "#d97706",
    bg: "rgba(217,119,6,0.09)",
  },
  {
    title: "Aportes de Miembros",
    desc: "Historial de diezmos y ofrendas por miembro. Ideal para gestionar certificados y acuses de recibo.",
    path: "/reports/contributions",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
        <path d="M4 10.781c.148 1.667 1.513 2.85 3.591 3.003V15h1.043v-1.216c2.27-.179 3.678-1.438 3.678-3.315 0-1.682-1.013-2.534-2.95-3.009l-.728-.165V3.467c1.013.152 1.622.748 1.757 1.495h1.71C12.007 3.322 10.674 2.076 8.634 1.91V1h-1.043v.907C5.523 2.09 4.2 3.349 4.2 5.125c0 1.59.963 2.498 2.735 2.93l.628.146V12.3c-1.067-.16-1.71-.732-1.853-1.519zm3.46-3.957c-.96-.218-1.507-.736-1.507-1.402 0-.769.602-1.33 1.507-1.476zm1.253 2.239c1.136.266 1.72.78 1.72 1.509 0 .862-.675 1.476-1.72 1.597z"/>
      </svg>
    ),
    color: "#dc2626",
    bg: "rgba(220,38,38,0.09)",
  },
  {
    title: "Reporte de Asistencia",
    desc: "Estadísticas de asistencia a servicios: tendencias semanales, porcentajes y comparativas por período.",
    path: "/reports/attendance",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
        <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"/><path d="M10.97 4.97a.75.75 0 0 1 1.071 1.05l-3.992 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z"/>
      </svg>
    ),
    color: "#0891b2",
    bg: "rgba(8,145,178,0.09)",
  },
  {
    title: "Reporte de Ministerios",
    desc: "Consolidado mensual de todos los ministerios: membresía, asistencia, actividades, sermones y finanzas en un solo lugar.",
    path: "/reports/ministries",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8.277.084a.5.5 0 0 0-.554 0l-7.5 5A.5.5 0 0 0 .5 6h1.875v7H1.5a.5.5 0 0 0 0 1h13a.5.5 0 0 0 0-1h-.875V6H15.5a.5.5 0 0 0 .277-.916zm-1.485 10.92a.5.5 0 0 1-.792 0L4.5 8.5V13H2.375V6.309L8 2.486l5.625 3.823V13H11.5V8.5z"/>
      </svg>
    ),
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.09)",
  },
];

export default function ReportsLanding() {
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader
        title="Reportes y Documentos"
        subtitle="Selecciona el tipo de reporte que deseas generar o consultar."
      />
      <div className={styles.grid}>
        {CARDS.map((card) => (
          <button
            key={card.path}
            className={styles.card}
            onClick={() => navigate(card.path)}
          >
            <div
              className={styles.iconWrap}
              style={{ background: card.bg, color: card.color }}
            >
              {card.icon}
            </div>
            <h3 className={styles.cardTitle}>{card.title}</h3>
            <p className={styles.cardDesc}>{card.desc}</p>
            <span className={styles.cardArrow} style={{ color: card.color }}>
              Abrir →
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
