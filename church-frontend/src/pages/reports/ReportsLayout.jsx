import { Box, Typography } from "@mui/material";
import { Outlet } from "react-router-dom";
import { Assessment } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { getSettings } from "../../api/settings";

export default function ReportsLayout() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    getSettings().then(res => setSettings(res.data)).catch(() => {});
  }, []);

  return (
    <Box sx={{ maxWidth: 1400, margin: '0 auto', p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="800" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Assessment color="primary" /> Generador de Documentos y Examen de Gestión
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Panel ejecutivo maestro. Evalúe auditorías trimestrales, analíticas semestrales e inspeccione la tesorería corporativa de la Iglesia.
        </Typography>
      </Box>

      {/* Area for rendering the selected report module */}
      <Box>
        <Outlet context={{ settings }} />
      </Box>
    </Box>
  );
}
