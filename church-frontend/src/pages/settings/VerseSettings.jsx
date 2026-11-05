/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import { Box, Button, TextField, Typography, CircularProgress } from "@mui/material";
import { MenuBook, Save } from "@mui/icons-material";
import { useOutletContext } from "react-router-dom";
import Section from "./Section";

export default function VerseSettings() {
  const { data, setData, handleSubmit, saving } = useOutletContext();

  return (
    <form onSubmit={handleSubmit}>
      <Section
        icon={<MenuBook />}
        title="Versículo Bíblico del Sistema"
        subtitle="Este versículo aparecerá en la pantalla de inicio (Dashboard) como mensaje de bienvenida."
      >
        <TextField
          size="small"
          fullWidth multiline rows={4}
          label="Versículo"
          value={data.bible_verse || ""}
          onChange={e => setData(p => ({ ...p, bible_verse: e.target.value }))}
          placeholder={'"Y en ningún otro hay salvación..." — Hechos 4:12'}
          helperText="Puedes incluir la referencia bíblica al final del texto."
        />

        {data.bible_verse && (
          <Box sx={{
            mt: 3, p: 3, borderRadius: 1,
            background: "var(--surface-card)",
            border: "1px solid #e5e7eb",
            borderLeft: "4px solid #0F172A",
          }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing={1} display="block" mb={1}>
              Vista Previa
            </Typography>
            <Typography variant="body1" sx={{ fontStyle: "italic", color: "#1e293b", lineHeight: 1.7 }}>
              {data.bible_verse}
            </Typography>
          </Box>
        )}
      </Section>

      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained" type="submit" size="medium"
          disabled={saving}
          disableElevation
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />}
          sx={{ px: 4, bgcolor: "#0F172A", textTransform: "none", fontWeight: 600, '&:hover': { bgcolor: "#1E293B" } }}
        >
          {saving ? "Guardando..." : "Guardar Versículo"}
        </Button>
      </Box>
    </form>
  );
}
