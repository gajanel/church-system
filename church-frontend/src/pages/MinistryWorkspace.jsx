/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
/**
 * MinistryWorkspace.jsx
 * Lists all ministries as selectable workspace cards.
 * Each card shows enabled sub-modules as badges.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, CircularProgress, Tooltip, IconButton } from "@mui/material";
import {
  VolunteerActivismOutlined,
  ReceiptLongOutlined,
  HowToRegOutlined,
  ViewKanbanOutlined,
  PhotoLibraryOutlined,
  ArrowForwardOutlined,
  SettingsOutlined,
} from "@mui/icons-material";
import { listMinistryWorkspaces, updateModuleConfig } from "../api/ministryWorkspace";
import { PageHeader } from "../components/ui/PageHeader";
import { Badge } from "../components/ui/Badge";
import s from "../styles/page.module.css";
import ws from "./MinistryWorkspace.module.css";

/** Converts ministry name to URL-safe slug.
 *  "Jóvenes & Familias" → "jovenes-familias" */
export const toSlug = (name = "") =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // remove diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")       // non-alphanumeric → hyphen
    .replace(/^-+|-+$/g, "");           // trim leading/trailing hyphens


const MODULE_META = {
  finance:        { label: "Finanzas",        icon: <ReceiptLongOutlined sx={{ fontSize: 13 }} />,    variant: "success"  },
  attendance:     { label: "Asistencia",      icon: <HowToRegOutlined    sx={{ fontSize: 13 }} />,    variant: "info"     },
  work_plans:     { label: "Planes",          icon: <ViewKanbanOutlined  sx={{ fontSize: 13 }} />,    variant: "primary"  },
  gallery:        { label: "Galería",         icon: <PhotoLibraryOutlined sx={{ fontSize: 13 }} />,   variant: "warning"  },
  monthly_report: { label: "Reporte Mensual", icon: <ReceiptLongOutlined sx={{ fontSize: 13 }} />,   variant: "ghost"    },
};

export default function MinistryWorkspace() {
  const navigate = useNavigate();
  const [ministries, setMinistries] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user?.is_admin;

  const load = async () => {
    setLoading(true);
    try {
      const res = await listMinistryWorkspaces();
      let loadedMinistries = res.data;
      
      if (!isAdmin) {
         const hasWorkspace = user?.modules?.includes("workspace");
         const hasSpecificMinistries = user?.modules?.some(m => m.startsWith("ministry."));
         
         if (hasSpecificMinistries) {
            loadedMinistries = loadedMinistries.filter(m => user?.modules?.includes(`ministry.${m.id}`));
         } else if (!hasWorkspace) {
            loadedMinistries = [];
         }
      }
      
      setMinistries(loadedMinistries);
    } catch { setError("Error al cargar los ministerios"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggleModule = async (ministryId, module, currentValue) => {
    try {
      await updateModuleConfig(ministryId, { [module]: !currentValue });
      await load();
    } catch { setError("Error al actualizar configuración"); }
  };

  if (loading) return (
    <div className={s.page} style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}>
      <CircularProgress size={32} />
    </div>
  );

  return (
    <div className={s.page}>
      <PageHeader
        title="Portal de Ministerios"
        subtitle={`${ministries.length} ministerios activos — haz clic en uno para acceder a su espacio de trabajo`}
      />

      {error && <div className={s.errorText}>{error}</div>}

      {ministries.length === 0 ? (
        <div className={s.empty}>
          <p className={s.emptyTitle}>No hay ministerios registrados</p>
          <p className={s.emptyText}>Ve a Ministerios para crear el primero.</p>
        </div>
      ) : (
        <div className={ws.grid}>
          {ministries.map(m => (
            <div key={m.id} className={ws.card}>
              {/* Header */}
              <div className={ws.cardHeader}>
                <div className={ws.cardIcon}>
                  <VolunteerActivismOutlined sx={{ fontSize: 18, color: "#fff" }} />
                </div>
                <div className={ws.cardTitle}>
                  <span className={ws.name}>{m.name}</span>
                  {m.service_day && (
                    <span className={ws.day}>{m.service_day}</span>
                  )}
                </div>
                <Button
                  size="small"
                  variant="contained"
                  endIcon={<ArrowForwardOutlined sx={{ fontSize: 14 }} />}
                  onClick={() => navigate(`/ministry-workspace/${toSlug(m.name)}`)}
                  sx={{ ml: "auto", flexShrink: 0 }}
                >
                  Abrir
                </Button>
              </div>

              {/* Module toggles */}
              <div className={ws.moduleRow}>
                {Object.entries(MODULE_META).map(([key, meta]) => {
                  const enabled = m.config[key];
                  return (
                    <div
                      key={key}
                      className={`${ws.moduleChip} ${!enabled ? ws.disabled : ""}`}
                      title={isAdmin ? `Click para ${enabled ? "deshabilitar" : "habilitar"} ${meta.label}` : meta.label}
                      onClick={isAdmin ? () => toggleModule(m.id, key, enabled) : undefined}
                      style={{ cursor: isAdmin ? "pointer" : "default" }}
                    >
                      {meta.icon}
                      <span>{meta.label}</span>
                      {isAdmin && (
                        <span className={`${ws.toggle} ${enabled ? ws.on : ws.off}`}>
                          {enabled ? "ON" : "OFF"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {isAdmin && (
                <div className={ws.cardFooter}>
                  <span className={ws.footerHint}>
                    <SettingsOutlined sx={{ fontSize: 11 }} /> Admin: haz clic en un módulo para habilitarlo/deshabilitarlo
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
