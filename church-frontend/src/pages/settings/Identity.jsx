import { Box, Button, Grid, TextField, CircularProgress } from "@mui/material";
import { Business, Save } from "@mui/icons-material";
import { useOutletContext } from "react-router-dom";
import Section from "./Section";

export default function IdentitySettings() {
  const { data, setData, handleSubmit, saving } = useOutletContext();

  return (
    <form onSubmit={handleSubmit}>
      <Section icon={<Business />} title="Identidad de la Organización" subtitle="Esta información aparecerá en reportes generados e impresiones oficiales del sistema.">
        <Grid container spacing={2.5}>
          {/* Two columns layout to increase density as requested */}
          <Grid item xs={12} sm={6}>
            <TextField
              size="small"
              fullWidth label="Nombre de la Iglesia" name="church_name"
              value={data.church_name}
              onChange={e => setData(p => ({ ...p, church_name: e.target.value }))}
              required
              helperText="Se mostrará en la barra lateral y reportes."
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              size="small"
              fullWidth label="URL del Logo (Opcional)" name="church_logo_url"
              value={data.church_logo_url || ""}
              onChange={e => setData(p => ({ ...p, church_logo_url: e.target.value }))}
              placeholder="https://ejemplo.com/logo.png"
              helperText="Se usará en el encabezado de reportes PDF."
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              size="small"
              fullWidth label="Dirección / Ubicación" name="church_address"
              value={data.church_address || ""}
              onChange={e => setData(p => ({ ...p, church_address: e.target.value }))}
              multiline rows={2}
              placeholder="Ej. Calle Principal #123, Ciudad"
            />
            {data.church_logo_url && (
              <Box sx={{ mt: 2, p: 1.5, border: "1px dashed #e2e8f0", borderRadius: 1, display: "inline-flex" }}>
                <img
                  src={data.church_logo_url}
                  alt="Logo preview"
                  style={{ height: 48, maxWidth: 200, objectFit: "contain" }}
                  onError={e => e.target.style.display = "none"}
                />
              </Box>
            )}
          </Grid>
        </Grid>
      </Section>

      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained" type="submit" size="medium"
          disabled={saving}
          disableElevation
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />}
          sx={{ px: 4, bgcolor: "#0F172A", textTransform: "none", fontWeight: 600, '&:hover': { bgcolor: "#1E293B" } }}
        >
          {saving ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </Box>
    </form>
  );
}
