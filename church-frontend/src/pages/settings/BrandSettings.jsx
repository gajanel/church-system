/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import { Box, Button, Grid, Typography, Divider, Tooltip, CircularProgress } from "@mui/material";
import { Palette, Save } from "@mui/icons-material";
import { useOutletContext } from "react-router-dom";
import Section from "./Section";
import { factoryReset } from "../../api/settings";

export default function BrandSettings() {
  const { data, setData, handleSubmit, saving, showMsg, loadSettings } = useOutletContext();

  return (
    <Box>
      <Section
        icon={<Palette />}
        title="Brand Studio"
        subtitle="Personaliza la apariencia visual del sistema para tu organización. Los cambios se aplican en tiempo real."
      >
        <Grid container spacing={3}>
          {/* Color Primario */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" fontWeight={700} mb={1}>
              Color Primario de la Marca
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  width: 52, height: 52,
                  borderRadius: 1,
                  border: "1px solid #e5e7eb",
                  background: data.primary_color,
                  cursor: "pointer",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <input
                  type="color"
                  value={data.primary_color}
                  onChange={e => {
                    setData(p => ({ ...p, primary_color: e.target.value }));
                    document.documentElement.style.setProperty('--color-primary', e.target.value);
                  }}
                  style={{
                    position: "absolute", inset: 0, opacity: 0,
                    width: "100%", height: "100%", cursor: "pointer"
                  }}
                />
              </Box>
              <Box>
                <Typography variant="body2" fontWeight={700}>{data.primary_color.toUpperCase()}</Typography>
                <Typography variant="caption" color="text.secondary">Haz clic para cambiar</Typography>
              </Box>
            </Box>
            {/* Paletas predefinidas */}
            <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
              {["#0F172A","#1e3a8a","#7c3aed","#059669","#dc2626","#d97706","#0891b2","#1f2937"].map(color => (
                <Tooltip key={color} title={color} arrow>
                  <Box
                    onClick={() => {
                      setData(p => ({ ...p, primary_color: color }));
                      document.documentElement.style.setProperty('--color-primary', color);
                    }}
                    sx={{
                      width: 28, height: 28, borderRadius: 1,
                      background: color, cursor: "pointer",
                      border: data.primary_color === color ? "2px solid #000" : "1px solid #e5e7eb",
                      transition: "transform 0.2s",
                      "&:hover": { transform: "scale(1.1)" }
                    }}
                  />
                </Tooltip>
              ))}
            </Box>
          </Grid>

          {/* Color Secundario */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" fontWeight={700} mb={1}>
              Color Secundario / Acento
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  width: 52, height: 52,
                  borderRadius: 1,
                  border: "1px solid #e5e7eb",
                  background: data.secondary_color,
                  cursor: "pointer",
                  position: "relative", overflow: "hidden",
                }}
              >
                <input
                  type="color"
                  value={data.secondary_color}
                  onChange={e => setData(p => ({ ...p, secondary_color: e.target.value }))}
                  style={{
                    position: "absolute", inset: 0, opacity: 0,
                    width: "100%", height: "100%", cursor: "pointer"
                  }}
                />
              </Box>
              <Box>
                <Typography variant="body2" fontWeight={700}>{data.secondary_color.toUpperCase()}</Typography>
                <Typography variant="caption" color="text.secondary">Haz clic para cambiar</Typography>
              </Box>
            </Box>
          </Grid>

          {/* Idioma */}
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" fontWeight={700} mb={2} mt={1}>
              Idioma Predeterminado del Sistema
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              {[
                { value: "es", label: "🇪🇸 Español", desc: "Predeterminado para América Latina" },
                { value: "en", label: "🇺🇸 English", desc: "For international organizations" },
              ].map(lang => (
                <Box
                  key={lang.value}
                  onClick={() => setData(p => ({ ...p, app_language: lang.value }))}
                  sx={{
                    p: 2, flex: 1, minWidth: 160,
                    border: `1px solid ${data.app_language === lang.value ? data.primary_color : "#e5e7eb"}`,
                    borderRadius: 1,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    background: data.app_language === lang.value ? `${data.primary_color}12` : "transparent",
                    "&:hover": { borderColor: data.primary_color }
                  }}
                >
                  <Typography variant="body1" fontWeight={700}>{lang.label}</Typography>
                  <Typography variant="caption" color="text.secondary">{lang.desc}</Typography>
                </Box>
              ))}
            </Box>
          </Grid>

          {/* Vista Previa en Vivo */}
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" fontWeight={700} mb={2} mt={1}>
              Vista Previa del Elemento de Marca
            </Typography>
            <Box sx={{
              p: 3, borderRadius: 1,
              border: "1px solid #e5e7eb",
              background: "#f8fafc",
              display: "flex", alignItems: "center", gap: 2
            }}>
              <Box sx={{
                width: 40, height: 40, borderRadius: 1,
                background: `linear-gradient(135deg, ${data.primary_color} 0%, ${data.secondary_color} 100%)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 18
              }}>✝</Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={800} color={data.primary_color}>
                  {data.church_name || "Nombre de la Organización"}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>
                  {data.church_address || "Dirección del ministerio"}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Section>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Button
          variant="outlined" color="inherit" size="small"
          sx={{ textTransform: "none" }}
          onClick={async () => {
            try {
              await factoryReset();
              await loadSettings();
              showMsg("success", "Configuración de marca restablecida.");
            } catch { showMsg("error", "Error al resetear."); }
          }}
        >
          Restablecer valores predeterminados
        </Button>
        <Button
          variant="contained" size="medium"
          onClick={handleSubmit}
          disabled={saving}
          disableElevation
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />}
          sx={{ px: 4, bgcolor: "#0F172A", textTransform: "none", fontWeight: 600, '&:hover': { bgcolor: "#1E293B" } }}
        >
          {saving ? "Guardando..." : "Aplicar Cambios de Marca"}
        </Button>
      </Box>
    </Box>
  );
}
