/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import { useState } from "react";
import { Box, Switch, Typography, FormControlLabel } from "@mui/material";
import { Settings as SettingsIcon } from "@mui/icons-material";
import Section from "./Section";

export default function AppearanceSettings() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");

  const handleThemeToggle = (e) => {
    const checked = e.target.checked;
    setDarkMode(checked);
    localStorage.setItem("theme", checked ? "dark" : "light");
    if (checked) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <Section
      icon={<SettingsIcon />}
      title="Apariencia y Tema"
      subtitle="Personaliza tu experiencia visual dentro de este navegador."
    >
      <Box sx={{ p: 2, borderRadius: 1, border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="body1" fontWeight={700}>Modo Oscuro</Typography>
          <Typography variant="caption" color="text.secondary">Activa el tema oscuro para reducir la fatiga visual.</Typography>
        </Box>
        <FormControlLabel
          control={<Switch checked={darkMode} onChange={handleThemeToggle} color="primary" />}
          label=""
          sx={{ m: 0 }}
        />
      </Box>
    </Section>
  );
}
