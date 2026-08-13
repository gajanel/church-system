import { Box, Button, Grid, TextField, InputAdornment, Typography, CircularProgress } from "@mui/material";
import { AttachMoney, Info, Save } from "@mui/icons-material";
import { useOutletContext } from "react-router-dom";
import Section from "./Section";

export default function FinanceSettings() {
  const { data, setData, handleSubmit, saving } = useOutletContext();

  return (
    <form onSubmit={handleSubmit}>
      <Section icon={<AttachMoney />} title="Parámetros Financieros" subtitle="Controla cómo se muestran y calculan los valores monetarios.">
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={5}>
            <TextField
              size="small"
              fullWidth label="Símbolo de Moneda" name="currency_symbol"
              value={data.currency_symbol || ""}
              onChange={e => setData(p => ({ ...p, currency_symbol: e.target.value }))}
              required
              helperText="Ej: Q, $, €, L"
            />
          </Grid>
          <Grid item xs={12} sm={7}>
            <TextField
              size="small"
              fullWidth label="Meta de Gastos Mensual" name="monthly_expense_goal"
              type="number"
              value={data.monthly_expense_goal || 0}
              onChange={e => setData(p => ({ ...p, monthly_expense_goal: e.target.value }))}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Typography variant="body2" fontWeight={700}>{data.currency_symbol || "$"}</Typography>
                  </InputAdornment>
                ),
              }}
              helperText="Usada para la métrica de cumplimiento presupuestario en el Dashboard."
            />
          </Grid>
        </Grid>
      </Section>

      <Section icon={<Info />} title="Información del Sistema" subtitle="">
        <Grid container spacing={1.5}>
          {[
            ["Versión", "1.2.0 (Stable)"],
            ["Última actualización", data.updated_at ? new Date(data.updated_at).toLocaleString("es-GT") : "—"],
          ].map(([k, v]) => (
            <Grid item xs={12} sm={6} key={k}>
              <Box sx={{ p: 1.5, bgcolor: "#f8fafc", borderRadius: 1, border: "1px solid #e5e7eb" }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">{k}</Typography>
                <Typography variant="body2" fontWeight={600}>{v}</Typography>
              </Box>
            </Grid>
          ))}
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
