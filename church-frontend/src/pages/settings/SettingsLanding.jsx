/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";
import styles from "./SettingsLanding.module.css";

const CARDS = [
  {
    title: "Identidad",
    desc: "Nombre de la iglesia, dirección, logo y datos corporativos generales del sistema.",
    path: "/settings/identity",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
        <path d="M14.763.075A.5.5 0 0 1 15 .5v15a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5V14h-1v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V10a.5.5 0 0 1 .342-.474L6 7.64V4.5a.5.5 0 0 1 .276-.447l8-4a.5.5 0 0 1 .487.022M6 8.694 1 10.36V15h5zM7 15h2v-1.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5V15h2V1.309z"/>
        <path d="M2 11h1v1H2zm2 0h1v1H4zm-2 2h1v1H2zm2 0h1v1H4zm4-4h1v1H8zm2 0h1v1h-1zm-2 2h1v1H8zm2 0h1v1h-1zm2-2h1v1h-1zm0 2h1v1h-1zM8 7h1v1H8zm2 0h1v1h-1zm2 0h1v1h-1zM8 5h1v1H8zm2 0h1v1h-1zm2 0h1v1h-1zm0-2h1v1h-1z"/>
      </svg>
    ),
    color: "#2563eb",
    bg: "rgba(37,99,235,0.09)",
  },
  {
    title: "Finanzas",
    desc: "Configura metas de ingresos, símbolo de moneda y parámetros del módulo financiero.",
    path: "/settings/finance",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
        <path d="M4 10.781c.148 1.667 1.513 2.85 3.591 3.003V15h1.043v-1.216c2.27-.179 3.678-1.438 3.678-3.315 0-1.682-1.013-2.534-2.95-3.009l-.728-.165V3.467c1.013.152 1.622.748 1.757 1.495h1.71C12.007 3.322 10.674 2.076 8.634 1.91V1h-1.043v.907C5.523 2.09 4.2 3.349 4.2 5.125c0 1.59.963 2.498 2.735 2.93l.628.146V12.3c-1.067-.16-1.71-.732-1.853-1.519zm3.46-3.957c-.96-.218-1.507-.736-1.507-1.402 0-.769.602-1.33 1.507-1.476zm1.253 2.239c1.136.266 1.72.78 1.72 1.509 0 .862-.675 1.476-1.72 1.597z"/>
      </svg>
    ),
    color: "#059669",
    bg: "rgba(5,150,105,0.09)",
  },
  {
    title: "Versículo",
    desc: "Define el versículo bíblico que se muestra en el panel de inicio del sistema.",
    path: "/settings/verse",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
        <path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783"/>
      </svg>
    ),
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.09)",
  },
  {
    title: "Marca",
    desc: "Personaliza colores, tipografía y la imagen de marca del sistema de gestión.",
    path: "/settings/brand",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
        <path d="M12.433 10.07C14.133 10.585 16 11.15 16 8a8 8 0 1 0-8 8c1.996 0 1.826-1.504 1.649-3.08-.124-1.101-.252-2.237.351-2.92.465-.527 1.42-.237 2.433.07"/>
      </svg>
    ),
    color: "#ec4899",
    bg: "rgba(236,72,153,0.09)",
  },
  {
    title: "Seguridad",
    desc: "Cambia tu contraseña y administra las credenciales de acceso al sistema.",
    path: "/settings/security",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2m3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2"/>
      </svg>
    ),
    color: "#dc2626",
    bg: "rgba(220,38,38,0.09)",
  },
  {
    title: "Apariencia",
    desc: "Activa el modo oscuro y personaliza la experiencia visual del sistema.",
    path: "/settings/appearance",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
        <path d="M6 .278a.77.77 0 0 1 .08.858 7.2 7.2 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277q.792-.001 1.533-.16a.79.79 0 0 1 .81.316.73.73 0 0 1-.031.893A8.35 8.35 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.75.75 0 0 1 6 .278"/>
      </svg>
    ),
    color: "#0891b2",
    bg: "rgba(8,145,178,0.09)",
  },
  {
    title: "Datos",
    desc: "Exporta, importa o respalda los datos del sistema. Solo disponible para super administradores.",
    path: "/settings/data",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
        <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/><path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z"/>
      </svg>
    ),
    color: "#d97706",
    bg: "rgba(217,119,6,0.09)",
  },
  {
    title: "Auditoría",
    desc: "Consulta el registro de acciones y cambios realizados en el sistema por los usuarios.",
    path: "/settings/audit",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022zm2.004.45a7 7 0 0 0-.985-.299l.219-.976q.576.129 1.126.342zm1.37.71a7 7 0 0 0-.439-.27l.493-.87a8 8 0 0 1 .979.654l-.615.789a7 7 0 0 0-.418-.302zm1.834 1.79a7 7 0 0 0-.653-.796l.724-.69q.406.429.747.91zm.744 1.352a7 7 0 0 0-.214-.468l.893-.45a8 8 0 0 1 .45 1.088l-.95.313a7 7 0 0 0-.179-.483m.53 2.507a6.991 6.991 0 0 0-.1-1.025l.985-.17q.1.58.116 1.17zm-.131 1.538q.05-.254.081-.51l.993.123a7.957 7.957 0 0 1-.23 1.155l-.964-.267q.069-.247.12-.501m-.952 2.379q.276-.436.486-.908l.914.405q-.24.54-.555 1.038zm-.964 1.205q.183-.183.35-.378l.758.653a8 8 0 0 1-.401.432zM8.717 13.5c.29-.249.547-.53.771-.834l.815.58a7 7 0 0 1-1.035 1.065zm-2.165.77q.398.116.811.163l-.12.99a8 8 0 0 1-.89-.18zM3.203 9.795a7 7 0 0 0 .306.967l-.944.32a8 8 0 0 1-.352-1.096zm-.232-1.769c-.018.34-.01.68.025 1.017l-.995.1A8 8 0 0 1 2 7.999v-.17zm.5-1.depending on the information that was received, not continuing"/>
        <path d="M8 5.5a.5.5 0 0 0-1 0v3.362l-1.429 2.38a.5.5 0 1 0 .858.515l1.5-2.5A.5.5 0 0 0 8 9z"/>
        <path d="M6.5 0a.5.5 0 0 0 0 1H7v1.07A7.001 7.001 0 0 0 8 16a7 7 0 0 0 5.29-11.55l.013-.012.354-.354.353.354a.5.5 0 1 0 .707-.707l-1.414-1.415a.5.5 0 1 0-.707.707l.354.354-.012.012A6.97 6.97 0 0 0 9 2.071V1h.5a.5.5 0 0 0 0-1zm2 5.5v3.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1H7V5.5a.5.5 0 0 1 1 0"/>
      </svg>
    ),
    color: "#374151",
    bg: "rgba(55,65,81,0.08)",
  },
];

export default function SettingsLanding() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user?.is_admin || user?.is_super_admin;
  
  const visibleCards = CARDS.filter(card => isAdmin || card.path === "/settings/security");

  return (
    <div>
      <PageHeader
        title="Configuración del Sistema"
        subtitle="Administra los parámetros globales, la identidad corporativa y la seguridad."
      />
      <div className={styles.grid}>
        {visibleCards.map((card) => (
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
