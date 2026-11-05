/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import { useState } from "react";
import { Box, Button, Grid, TextField, InputAdornment, IconButton, Typography, Divider, Alert, CircularProgress } from "@mui/material";
import { Lock, Visibility, VisibilityOff, CheckCircle, Security } from "@mui/icons-material";
import { changePassword } from "../../api/users";
import Section from "./Section";

export default function SecuritySettings() {
  const [pwData, setPwData] = useState({ current_password: "", new_password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState({ type: null, text: null });

  const handlePasswordChange = async () => {
    const { current_password, new_password, confirm } = pwData;
    if (!current_password) return setPwMsg({ type: "error", text: "Debes ingresar tu contraseña actual." });
    if (new_password.length < 8) return setPwMsg({ type: "error", text: "La nueva contraseña debe tener mínimo 8 caracteres." });
    if (new_password !== confirm) return setPwMsg({ type: "error", text: "Las contraseñas nuevas no coinciden." });
    
    setPwSaving(true);
    setPwMsg({ type: null, text: null });
    try {
      await changePassword({ current_password, new_password });
      setPwMsg({ type: "success", text: "Contraseña cambiada correctamente." });
      setPwData({ current_password: "", new_password: "", confirm: "" });
    } catch (err) {
      setPwMsg({ type: "error", text: err?.response?.data?.detail || "Error al cambiar contraseña. Verifica tu clave actual." });
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <Section
      icon={<Lock />}
      title="Seguridad de la Cuenta"
      subtitle="Administra tus credenciales de acceso. Recomendamos cambiar tu contraseña periódicamente."
    >
      {pwMsg.text && (
        <Alert 
          severity={pwMsg.type} 
          sx={{ mb: 3, borderRadius: 1, border: "1px solid", borderColor: pwMsg.type === "success" ? "success.light" : "error.light" }} 
          onClose={() => setPwMsg({ type: null, text: null })}
        >
          {pwMsg.text}
        </Alert>
      )}

      <Grid container spacing={4}>
        <Grid item xs={12} md={7}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <TextField
              size="small"
              fullWidth label="Contraseña Actual"
              type={showCurrentPw ? "text" : "password"}
              value={pwData.current_password}
              onChange={e => setPwData(p => ({ ...p, current_password: e.target.value }))}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowCurrentPw(v => !v)} edge="end" size="small">
                      {showCurrentPw ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              size="small"
              fullWidth label="Nueva Contraseña"
              type={showPw ? "text" : "password"}
              value={pwData.new_password}
              onChange={e => setPwData(p => ({ ...p, new_password: e.target.value }))}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPw(v => !v)} edge="end" size="small">
                      {showPw ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              size="small"
              fullWidth label="Confirmar Nueva Contraseña"
              type={showPw ? "text" : "password"}
              value={pwData.confirm}
              onChange={e => setPwData(p => ({ ...p, confirm: e.target.value }))}
              error={pwData.confirm.length > 0 && pwData.new_password !== pwData.confirm}
              helperText={pwData.confirm.length > 0 && pwData.new_password !== pwData.confirm ? "Las contraseñas no coinciden." : " "}
            />

            <Box>
              <Button
                variant="contained" 
                onClick={handlePasswordChange}
                disableElevation
                disabled={
                  pwSaving || 
                  !pwData.current_password || 
                  pwData.new_password.length < 8 ||
                  !/[A-Z]/.test(pwData.new_password) ||
                  !/[a-z]/.test(pwData.new_password) ||
                  !/\d/.test(pwData.new_password) ||
                  !/[\W_]/.test(pwData.new_password) ||
                  pwData.new_password !== pwData.confirm
                }
                startIcon={pwSaving ? <CircularProgress size={18} color="inherit" /> : <CheckCircle />}
                sx={{ px: 5, py: 1, borderRadius: 1, fontWeight: 600, bgcolor: "#0F172A", textTransform: "none", '&:hover': { bgcolor: "#1E293B" } }}
              >
                {pwSaving ? "Procesando..." : "Actualizar Contraseña"}
              </Button>
            </Box>
          </Box>
        </Grid>

        <Grid item xs={12} md={5}>
          <Box sx={{ 
            p: 3, borderRadius: 1, 
            bgcolor: "#f9fafb", 
            border: "1px solid #e5e7eb",
            height: "100%"
          }}>
            <Typography variant="subtitle2" fontWeight={800} color="#0F172A" mb={2} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Security fontSize="small" /> Requisitos de Seguridad
            </Typography>
            
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {[
                { label: "Mínimo 8 caracteres", ok: pwData.new_password.length >= 8 },
                { label: "Al menos una mayúscula", ok: /[A-Z]/.test(pwData.new_password) },
                { label: "Al menos una minúscula", ok: /[a-z]/.test(pwData.new_password) },
                { label: "Al menos un número", ok: /\d/.test(pwData.new_password) },
                { label: "Carácter especial (!@#$%^&*)", ok: /[\W_]/.test(pwData.new_password) },
                { label: "Las contraseñas coinciden", ok: pwData.new_password === pwData.confirm && pwData.confirm !== "" },
              ].map((req, i) => (
                <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  {req.ok ? (
                    <CheckCircle sx={{ color: "success.main", fontSize: 18 }} />
                  ) : (
                    <Box sx={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid #cbd5e1" }} />
                  )}
                  <Typography variant="body2" sx={{ color: req.ok ? "text.primary" : "text.secondary", fontWeight: req.ok ? 600 : 400 }}>
                    {req.label}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Divider sx={{ my: 3, opacity: 0.5 }} />

            <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontStyle: "italic" }}>
              <strong>Consejo:</strong> Una contraseña segura protege no solo tus datos, sino toda la información de la organización.
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Section>
  );
}
