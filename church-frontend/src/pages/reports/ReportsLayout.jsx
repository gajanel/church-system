/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import { Box, Typography, Button } from "@mui/material";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Assessment, ArrowBack } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { getSettings } from "../../api/settings";

export default function ReportsLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);

  const isLanding = location.pathname === "/reports" || location.pathname === "/reports/";

  useEffect(() => {
    getSettings().then(res => setSettings(res.data)).catch(() => {});
  }, []);

  return (
    <Box sx={{ maxWidth: 1400, margin: '0 auto', p: 3 }}>
      {!isLanding && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="800" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Assessment color="primary" /> Generador de Documentos y Examen de Gestión
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Panel ejecutivo maestro. Evalúe auditorías trimestrales, analíticas semestrales e inspeccione la tesorería corporativa de la Iglesia.
          </Typography>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate("/reports")}
            variant="outlined"
            size="small"
            sx={{ textTransform: "none", borderRadius: "8px", color: "#374151", borderColor: "#d1d5db" }}
          >
            Volver al Menú
          </Button>
        </Box>
      )}

      {/* Area for rendering the selected report module */}
      <Box>
        <Outlet context={{ settings }} />
      </Box>
    </Box>
  );
}
