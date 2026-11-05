/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import { useNavigate } from "react-router-dom";
import {
  AccountBalanceWalletOutlined,
  DarkModeOutlined,
  DomainOutlined,
  HistoryOutlined,
  LockOutlined,
  MenuBookOutlined,
  PaletteOutlined,
  StorageOutlined,
} from "@mui/icons-material";
import { PageHeader } from "../../components/ui/PageHeader";
import styles from "./SettingsLanding.module.css";

const CARDS = [
  { title: "Identidad", desc: "Configura el nombre, la dirección, el logotipo y los datos generales de la iglesia.", path: "/settings/identity", access: "admin", icon: <DomainOutlined /> },
  { title: "Finanzas", desc: "Configura la moneda, las metas de ingresos y los parámetros financieros.", path: "/settings/finance", access: "admin", icon: <AccountBalanceWalletOutlined /> },
  { title: "Versículo", desc: "Define el versículo bíblico que aparece en el panel de inicio.", path: "/settings/verse", access: "admin", icon: <MenuBookOutlined /> },
  { title: "Marca", desc: "Administra los colores, la tipografía y los recursos visuales del sistema.", path: "/settings/brand", access: "admin", icon: <PaletteOutlined /> },
  { title: "Seguridad", desc: "Cambia tu contraseña y administra tus credenciales de acceso.", path: "/settings/security", access: "all", icon: <LockOutlined /> },
  { title: "Apariencia", desc: "Configura el tema y las preferencias visuales del sistema.", path: "/settings/appearance", access: "admin", icon: <DarkModeOutlined /> },
  { title: "Datos", desc: "Exporta, importa o respalda los datos del sistema.", path: "/settings/data", access: "super", icon: <StorageOutlined /> },
  { title: "Auditoría", desc: "Consulta las acciones y los cambios realizados por los usuarios.", path: "/settings/audit", access: "admin", icon: <HistoryOutlined /> },
];

export default function SettingsLanding() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.is_admin || user.is_super_admin;
  const visibleCards = CARDS.filter(card => (
    card.access === "all"
    || (card.access === "admin" && isAdmin)
    || (card.access === "super" && user.is_super_admin)
  ));

  return (
    <div>
      <PageHeader title="Configuración" subtitle="Administra los datos generales, la apariencia y la seguridad del sistema." />
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
