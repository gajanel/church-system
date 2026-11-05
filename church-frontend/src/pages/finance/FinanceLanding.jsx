/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import { useNavigate } from "react-router-dom";
import {
  AccountBalanceOutlined,
  AddCardOutlined,
  FlagOutlined,
  PaymentsOutlined,
  PointOfSaleOutlined,
  VolunteerActivismOutlined,
} from "@mui/icons-material";
import { PageHeader } from "../../components/ui/PageHeader";
import { userHasModuleAccess } from "../../components/userAccess";
import styles from "./FinanceLanding.module.css";

const CARDS = [
  { title: "Caja General", desc: "Consulta el balance disponible, el flujo de caja y los movimientos consolidados del mes.", path: "/finance/cash", permission: "finance.cash", icon: <PointOfSaleOutlined /> },
  { title: "Ofrendas", desc: "Registra y consulta las ofrendas recibidas en los servicios de la iglesia.", path: "/finance/offerings", permission: "finance.offerings", icon: <VolunteerActivismOutlined /> },
  { title: "Ingresos adicionales", desc: "Administra donaciones, ventas y otros ingresos distintos de las ofrendas regulares.", path: "/finance/incomes", permission: "finance.incomes", icon: <AddCardOutlined /> },
  { title: "Gastos", desc: "Registra las salidas de efectivo y clasifícalas por rubro para mantener su trazabilidad.", path: "/finance/expenses", permission: "finance.expenses", icon: <PaymentsOutlined /> },
  { title: "Metas financieras", desc: "Define objetivos mensuales y compara los resultados con las metas establecidas.", path: "/finance/goals", permission: "finance.goals", icon: <FlagOutlined /> },
  { title: "Bancos", desc: "Gestiona las cuentas bancarias y registra depósitos, inyecciones y retiros.", path: "/finance/deposits", permission: "finance.deposits", icon: <AccountBalanceOutlined /> },
];

export default function FinanceLanding() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const visibleCards = CARDS.filter(card => userHasModuleAccess(user, card.permission));

  return (
    <div>
      <PageHeader title="Finanzas y contabilidad" subtitle="Selecciona una opción para consultar o registrar movimientos financieros." />
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
