import { useState, useEffect } from "react";
import { Box, Typography, CircularProgress, Chip, Avatar } from "@mui/material";
import { History } from "@mui/icons-material";
import { useOutletContext } from "react-router-dom";
import { getAuditLogs } from "../../api/audit";
import Section from "./Section";
import DataTable from "../../components/ui/DataTable";

export default function AuditSettings() {
  const { showMsg } = useOutletContext();
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const res = await getAuditLogs(0, 100);
      setAuditLogs(res.data);
    } catch {
      showMsg("error", "Error al cargar logs de auditoría.");
    } finally {
      setAuditLoading(false);
    }
  };

  const getActionColor = (action) => {
    if (action.includes("CREATE")) return "success";
    if (action.includes("UPDATE")) return "info";
    if (action.includes("DELETE")) return "error";
    return "default";
  };

  const filteredLogs = auditLogs.filter(log => 
    !search || 
    log.user_name?.toLowerCase().includes(search.toLowerCase()) || 
    log.action.toLowerCase().includes(search.toLowerCase()) || 
    log.target_resource.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Section
      icon={<History />}
      title="Registro de Auditoría"
      subtitle="Monitorea las acciones administrativas y cambios críticos en el sistema."
    >
      <DataTable
        columns={[
          { label: "Fecha/Hora", width: "15%" },
          { label: "Usuario", width: "20%" },
          { label: "Acción", width: "12%" },
          { label: "Módulo", width: "12%" },
          { label: "Descripción", width: "auto" },
          { label: "Dispositivo / IP", width: "18%" }
        ]}
        rows={filteredLogs}
        loading={auditLoading}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Buscar por usuario o acción..."
        emptyText="No se encontraron registros."
        renderRow={(log) => (
          <tr key={log.id} style={{ '&:hover': { backgroundColor: "#f9fafb" } }}>
            <td style={{ padding: "6px 12px", fontSize: "0.8125rem", color: "#6b7280" }}>
              {new Date(log.created_at).toLocaleString("es-GT", {
                day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
              })}
            </td>
            <td style={{ padding: "6px 12px", fontSize: "0.8125rem" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Avatar sx={{ width: 24, height: 24, fontSize: 11, bgcolor: "primary.main" }}>
                  {log.user_name?.charAt(0).toUpperCase() || "?"}
                </Avatar>
                <Typography variant="body2" fontWeight={600}>{log.user_name}</Typography>
              </Box>
            </td>
            <td style={{ padding: "6px 12px", fontSize: "0.8125rem" }}>
              <Chip label={log.action} size="small" color={getActionColor(log.action)} sx={{ fontWeight: 700, fontSize: 10, height: 20 }} />
            </td>
            <td style={{ padding: "6px 12px", fontSize: "0.8125rem", color: "#6b7280", fontFamily: "monospace" }}>
              {log.module}
            </td>
            <td style={{ padding: "6px 12px", fontSize: "0.8125rem" }}>
              <Typography variant="body2" sx={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {log.description}
              </Typography>
            </td>
            <td style={{ padding: "6px 12px", fontSize: "0.75rem", color: "#6b7280", lineHeight: 1.2 }}>
              <div style={{ fontWeight: 600 }}>{log.ip_address || "—"}</div>
              <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 140 }} title={log.device}>
                {log.device || "—"}
              </div>
            </td>
          </tr>
        )}
      />
    </Section>
  );
}
