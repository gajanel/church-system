/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import { Box, Button } from "@mui/material";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ArrowBack } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { getSettings } from "../../api/settings";
import { PageHeader } from "../../components/ui/PageHeader";

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
        <PageHeader title="Reportes" subtitle="Consulta y exporta la información administrativa de la iglesia.">
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate("/reports")}
            variant="outlined"
            size="small"
            sx={{ textTransform: "none", borderRadius: "8px", color: "#374151", borderColor: "#d1d5db" }}
          >
            Volver a reportes
          </Button>
        </PageHeader>
      )}

      {/* Area for rendering the selected report module */}
      <Box>
        <Outlet context={{ settings }} />
      </Box>
    </Box>
  );
}
