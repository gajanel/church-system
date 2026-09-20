/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import { useNavigate } from "react-router-dom";
import {
  AccountBalanceOutlined,
  AssessmentOutlined,
  CalendarMonthOutlined,
  FactCheckOutlined,
  FolderOutlined,
  GroupsOutlined,
  PaymentsOutlined,
  PeopleAltOutlined,
} from "@mui/icons-material";
import { PageHeader } from "../../components/ui/PageHeader";
import { userHasModuleAccess } from "../../components/userAccess";
import styles from "./ReportsLanding.module.css";

const CARDS = [
  { title: "Balance mensual", desc: "Consulta ingresos, gastos y balance neto del mes en un reporte consolidado.", path: "/reports/monthly", permission: "reports.monthly", icon: <AssessmentOutlined /> },
  { title: "Reporte de bancos", desc: "Revisa depósitos, inyecciones, retiros y movimientos de las cuentas bancarias.", path: "/reports/bank-monthly", permission: "reports.monthly", icon: <AccountBalanceOutlined /> },
  { title: "Corte anual", desc: "Compara los resultados financieros mensuales y consulta los totales del año.", path: "/reports/annual", permission: "reports.annual", icon: <CalendarMonthOutlined /> },
  { title: "Informe de miembros", desc: "Consulta la composición y el estado de la membresía de la iglesia.", path: "/reports/members", permission: "reports.members", icon: <PeopleAltOutlined /> },
  { title: "Proyectos", desc: "Consulta los avances y movimientos asociados a proyectos y obras misioneras.", path: "/reports/projects", permission: "reports.projects", icon: <FolderOutlined /> },
  { title: "Aportes de miembros", desc: "Consulta los aportes registrados por miembro y período.", path: "/reports/contributions", permission: "reports.contributions", icon: <PaymentsOutlined /> },
  { title: "Asistencia", desc: "Analiza la asistencia por fecha, reunión y grupo de edad.", path: "/reports/attendance", permission: "reports.attendance", icon: <FactCheckOutlined /> },
  { title: "Ministerios", desc: "Consulta integrantes, actividades y finanzas de los ministerios.", path: "/reports/ministries", permission: "reports.ministries", icon: <GroupsOutlined /> },
];

export default function ReportsLanding() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const visibleCards = CARDS.filter(card => userHasModuleAccess(user, card.permission));

  return (
    <div>
      <PageHeader title="Reportes" subtitle="Selecciona el informe que deseas consultar o exportar." />
      <div className={styles.grid}>
        {visibleCards.map(card => (
          <button key={card.path} className={styles.card} onClick={() => navigate(card.path)}>
            <div className={styles.iconWrap}>{card.icon}</div>
            <h3 className={styles.cardTitle}>{card.title}</h3>
            <p className={styles.cardDesc}>{card.desc}</p>
            <span className={styles.cardArrow}>Abrir →</span>
          </button>
        ))}
      </div>
    </div>
  );
}
