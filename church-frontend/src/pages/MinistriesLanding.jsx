/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import { useNavigate } from "react-router-dom";
import { GroupsOutlined, WorkspacesOutlined } from "@mui/icons-material";
import { PageHeader } from "../components/ui/PageHeader";
import styles from "./MinistriesLanding.module.css";

const CARDS = [
  { title: "Administrar ministerios", desc: "Crea ministerios, organiza integrantes y asigna responsables.", path: "/ministries/admin", adminOnly: true, icon: <GroupsOutlined /> },
  { title: "Portal de ministerios", desc: "Accede al espacio de trabajo, las tareas, publicaciones y recursos de cada ministerio.", path: "/ministry-workspace", adminOnly: false, icon: <WorkspacesOutlined /> },
];

export default function MinistriesLanding() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.is_admin || user.is_super_admin;

  return (
    <div>
      <PageHeader title="Ministerios" subtitle="Administra la estructura y el trabajo de los ministerios de la iglesia." />
      <div className={styles.grid}>
        {CARDS.filter(card => !card.adminOnly || isAdmin).map(card => (
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
