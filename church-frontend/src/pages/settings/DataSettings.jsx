/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import { useState, useRef } from "react";
import { Box, Button, LinearProgress, Typography, Grid } from "@mui/material";
import { Backup, Download, Upload } from "@mui/icons-material";
import { useOutletContext } from "react-router-dom";
import Section from "./Section";
import { downloadBackup } from "../../api/settings";
import { API_URL } from "../../api/api";

export default function DataSettings() {
  const { showMsg } = useOutletContext();
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const fileInputRef = useRef();

  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      await downloadBackup();
      showMsg("success", "Respaldo descargado correctamente.");
    } catch {
      showMsg("error", "Error al generar el backup.");
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestoreSelect = async (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/json") {
      if (!window.confirm("¿Estás seguro de que deseas restaurar la base de datos? Esto sobreescribirá los datos actuales.")) {
        e.target.value = "";
        return;
      }
      
      setRestoreLoading(true);
      try {
        const token = localStorage.getItem("token");
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`${API_URL}/settings/restore-data`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.detail || "Error en restauración");

        const total = Object.values(result.restored_rows || {}).reduce((a, b) => a + b, 0);
        showMsg("success", `Restauración completada: ${total} registros restaurados. Recarga la página para ver los cambios.`);
      } catch (err) {
        showMsg("error", err.message || "Error durante la restauración.");
      } finally {
        setRestoreLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } else {
      showMsg("error", "Solo se aceptan archivos .json");
    }
  };

  return (
    <Box>
      {restoreLoading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      <Section
        icon={<Download />}
        title="Backup Manual"
        subtitle="Descarga una copia de seguridad completa de todos los datos del sistema en formato JSON."
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <Button
            variant="contained"
            disableElevation
            startIcon={<Backup />}
            onClick={handleBackup}
            disabled={backupLoading}
            sx={{ px: 4, py: 1, bgcolor: "#0F172A", textTransform: "none", fontWeight: 600, '&:hover': { bgcolor: "#1E293B" } }}
          >
            {backupLoading ? "Generando Backup..." : "Descargar Backup JSON"}
          </Button>
          <Typography variant="body2" color="text.secondary">
            Incluye miembros, finanzas, eventos, y configuración.
          </Typography>
        </Box>
      </Section>

      <Section
        icon={<Upload />}
        title="Restauración de Datos"
        subtitle="Sube un archivo de backup previamente descargado para restaurar los datos."
      >
        <Box sx={{ p: 3, border: "1px dashed #e5e7eb", borderRadius: 1, bgcolor: "#f9fafb", display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-start" }}>
          <Typography variant="body2" fontWeight={600} color="error.main">
            ⚠️ Advertencia: Restaurar un backup reemplazará todos los datos actuales del sistema. Esta acción no se puede deshacer.
          </Typography>

          <Button
            variant="outlined"
            component="label"
            startIcon={<Upload />}
            disabled={restoreLoading}
            sx={{ textTransform: "none", borderColor: "#e5e7eb", color: "#0F172A" }}
          >
            {restoreLoading ? "Restaurando..." : "Seleccionar Archivo JSON"}
            <input
              type="file"
              hidden
              accept="application/json"
              ref={fileInputRef}
              onChange={handleRestoreSelect}
            />
          </Button>
        </Box>
      </Section>
    </Box>
  );
}
