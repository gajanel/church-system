import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";
import styles from "./FinanceLanding.module.css";

const CARDS = [
  {
    title: "Caja General",
    desc: "Visualiza el balance de fondos disponibles, el flujo de caja y los ingresos consolidados del mes en curso.",
    path: "/finance/cash",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
        <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm2.5 1a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm0 3a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zM5 5.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m0 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5"/>
      </svg>
    ),
    color: "#2563eb",
    bg: "rgba(37,99,235,0.09)",
  },
  {
    title: "Ofrendas",
    desc: "Registra y administra las ofrendas recolectadas en los servicios de la iglesia. Clasifica los ingresos por tipo y mantén un control detallado.",
    path: "/finance/offerings",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 7.982C9.664 6.309 13.825 9.236 8 13 2.175 9.236 6.336 6.31 8 7.982Z"/>
        <path d="M3.75 0a1 1 0 0 0-.8.4L.1 4.2a.5.5 0 0 0-.1.3V15a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V4.5a.5.5 0 0 0-.1-.3L13.05.4a1 1 0 0 0-.8-.4h-8.5Zm0 1H7.5v3h-6l2.25-3ZM8.5 4V1h3.75l2.25 3h-6ZM15 5v10H1V5h14Z"/>
      </svg>
    ),
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.09)",
  },
  {
    title: "Ingresos Adicionales",
    desc: "Administra donaciones, ventas, rifas y otros ingresos fuera de las ofrendas regulares.",
    path: "/finance/incomes",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
        <path fillRule="evenodd" d="M8 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L7.5 2.707V14.5a.5.5 0 0 0 .5.5"/>
      </svg>
    ),
    color: "#059669",
    bg: "rgba(5,150,105,0.09)",
  },
  {
    title: "Gastos",
    desc: "Registra salidas de efectivo por rubros: alquiler, ofrenda misionera, ahorro pastoral y más.",
    path: "/finance/expenses",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
        <path fillRule="evenodd" d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1"/>
      </svg>
    ),
    color: "#dc2626",
    bg: "rgba(220,38,38,0.09)",
  },
  {
    title: "Metas Financieras",
    desc: "Define metas mensuales de ingresos y visualiza el progreso comparado con los objetivos establecidos.",
    path: "/finance/goals",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
        <path d="M14.778.085A.5.5 0 0 1 15 .5V8a.5.5 0 0 1-.314.464L14.5 8l.186.464-.003.001-.006.003-.023.009a12 12 0 0 1-.397.15c-.264.095-.631.223-1.047.35-.816.252-1.879.523-2.71.523-.847 0-1.548-.28-2.158-.525l-.028-.01C7.68 8.71 7.14 8.5 6.5 8.5c-.7 0-1.638.23-2.437.477A20 20 0 0 0 3 9.342V15.5a.5.5 0 0 1-1 0V.5a.5.5 0 0 1 1 0v.282c.226-.079.496-.17.79-.26C4.606.272 5.67 0 6.5 0c.84 0 1.524.277 2.121.519l.043.018C9.286.788 9.828 1 10.5 1c.7 0 1.638-.23 2.437-.477a20 20 0 0 0 1.061-.364z"/>
      </svg>
    ),
    color: "#d97706",
    bg: "rgba(217,119,6,0.09)",
  },
  {
    title: "Bancos",
    desc: "Gestión de cuentas bancarias y registro de depósitos e inyecciones.",
    path: "/finance/deposits",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1m3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10h14V4zM2 5h12v8H2z"/>
      </svg>
    ),
    color: "#0891b2",
    bg: "rgba(8,145,178,0.09)",
  },
];

export default function FinanceLanding() {
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader
        title="Finanzas y Contabilidad"
        subtitle="Selecciona un módulo para gestionar el flujo financiero de la iglesia."
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
