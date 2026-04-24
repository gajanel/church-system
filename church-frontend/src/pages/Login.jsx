import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Card, Typography, TextField, Button, Container,
  InputAdornment, IconButton, CircularProgress, Alert, Collapse,
  Fade, Zoom
} from "@mui/material";
import { Visibility, VisibilityOff, LockOutlined, Person, Shield } from "@mui/icons-material";
import { useToast } from "../components/ui/Toast";
import { getPublicSettings } from "../api/settings";
import { API_URL } from "../api/api";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tokenToSave, setTokenToSave] = useState(null);
  const [userToSave, setUserToSave] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    getPublicSettings().then(res => setSettings(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/");
  }, [navigate]);

  const handleLogin = async () => {
    if (!username || !password) { setError("Ingresa tu usuario y contraseña"); return; }
    setLoading(true); setError("");
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim().toLowerCase(), password }),
      });
      const data = await response.json();
      if (!response.ok) { 
        const msg = data.detail || "Credenciales incorrectas";
        setError(msg); 
        toast.error(msg);
        setLoading(false); 
        return; 
      }
      if (data.user.must_change_password) {
        setTokenToSave(data.access_token);
        setUserToSave(data.user);
        setNeedsPasswordChange(true);
      } else {
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/");
      }
    } catch { setError("Error de conexión. Verifica tu red."); }
    setLoading(false);
  };

  const handlePasswordChange = async () => {
    const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!pwRegex.test(newPassword)) {
      setError("La contraseña debe tener 8+ caracteres, mayúscula, minúscula, número y símbolo.");
      return;
    }
    if (newPassword !== confirmPassword) { setError("Las contraseñas no coinciden"); return; }
    setLoading(true); setError("");
    try {
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tokenToSave}` },
        body: JSON.stringify({ 
          current_password: password, // Usamos la contraseña con la que acaba de loguearse
          new_password: newPassword 
        }),
      });
      if (!response.ok) { 
        const d = await response.json(); 
        setError(d.detail || "Error al cambiar contraseña"); 
        setLoading(false); 
        return; 
      }
      
      localStorage.setItem("token", tokenToSave);
      localStorage.setItem("user", JSON.stringify({ ...userToSave, must_change_password: false }));
      navigate("/");
    } catch { setError("Error de conexión."); }
    setLoading(false);
  };

  return (
    <Box sx={{
      minHeight: "100vh", width: "100%",
      display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden",
      background: "#0a0a0c",
      "&::before": {
        content: '""',
        position: "absolute",
        width: "140%", height: "140%",
        background: "radial-gradient(circle at 20% 20%, rgba(79, 70, 229, 0.15) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(124, 58, 237, 0.15) 0%, transparent 40%)",
        animation: "pulse 15s infinite alternate ease-in-out",
      },
      "@keyframes pulse": {
        "0%": { transform: "scale(1) rotate(0deg)" },
        "100%": { transform: "scale(1.1) rotate(5deg)" },
      }
    }}>
      {/* Elementos decorativos animados */}
      <Box sx={{ 
        position: "absolute", top: "10%", left: "15%", width: 300, height: 300, 
        background: "linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(124, 58, 237, 0.08) 100%)",
        borderRadius: "40% 60% 70% 30% / 40% 50% 60% 50%", filter: "blur(60px)", animation: "float 20s infinite linear" 
      }} />
      <Box sx={{ 
        position: "absolute", bottom: "10%", right: "15%", width: 400, height: 400, 
        background: "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(147, 51, 234, 0.08) 100%)",
        borderRadius: "60% 40% 30% 70% / 50% 30% 70% 50%", filter: "blur(80px)", animation: "float 25s infinite linear reverse" 
      }} />

      <style>
        {`
          @keyframes float {
            0% { transform: translate(0, 0) rotate(0deg); }
            33% { transform: translate(30px, 50px) rotate(10deg); }
            66% { transform: translate(-20px, 20px) rotate(-10deg); }
            100% { transform: translate(0, 0) rotate(0deg); }
          }
        `}
      </style>

      <Zoom in={true} style={{ transitionDelay: '100ms' }}>
        <Container maxWidth="xs" sx={{ position: "relative", zIndex: 1 }}>
          <Card sx={{
            p: { xs: 4, sm: 6 },
            display: "flex", flexDirection: "column", gap: 3,
            borderRadius: "32px",
            background: "rgba(18, 18, 24, 0.7)",
            backdropFilter: "blur(40px) saturate(180%)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 40px 100px -20px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.05)",
          }}>

            {/* Header Branding */}
            <Box sx={{ textAlign: "center", mb: 1 }}>
              <Fade in={true} style={{ transitionDelay: '300ms' }}>
                <Box sx={{ 
                  display: "inline-flex", p: 1.5, borderRadius: "20px", mb: 2.5,
                  background: "linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)",
                  border: "1px solid rgba(99, 102, 241, 0.2)",
                }}>
                  <Shield sx={{ fontSize: 32, color: "#818cf8" }} />
                </Box>
              </Fade>
              <Typography variant="h5" sx={{ 
                color: "#fff", fontWeight: 800, fontSize: "1.35rem", 
                letterSpacing: "-0.02em", lineHeight: 1.2, mb: 1,
                background: "linear-gradient(to bottom, #ffffff 0%, #a5b4fc 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                Sistema de Gestión y Desarrollo Ministerial
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.4)", fontWeight: 500, letterSpacing: "0.01em" }}>
                {needsPasswordChange ? "Configure sus nuevas credenciales" : "Portal de acceso seguro"}
              </Typography>
            </Box>

            {/* Error inline */}
            <Collapse in={!!error}>
              <Alert
                severity="error"
                onClose={() => setError("")}
                sx={{
                  borderRadius: "16px",
                  bgcolor: "rgba(239, 68, 68, 0.08)",
                  color: "#fca5a5",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  fontSize: "0.85rem",
                  "& .MuiAlert-icon": { color: "#f87171" },
                }}
              >
                {error}
              </Alert>
            </Collapse>

            {/* Formulario */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              {needsPasswordChange ? (
                <>
                  <TextField
                    label="Nueva Contraseña"
                    type={showPassword ? "text" : "password"}
                    fullWidth value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    sx={textFieldSx}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(s => !s)} edge="end" sx={{ color: "rgba(255,255,255,0.3)" }}>
                            {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    label="Confirmar Contraseña"
                    type={showPassword ? "text" : "password"}
                    fullWidth value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handlePasswordChange(); }}
                    sx={textFieldSx}
                  />
                  <Button variant="contained" size="large" fullWidth
                    onClick={handlePasswordChange} disabled={loading} sx={buttonSx}>
                    {loading ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "ACTUALIZAR Y ENTRAR"}
                  </Button>
                </>
              ) : (
                <>
                  <TextField
                    label="Nombre de Usuario" variant="outlined" fullWidth value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") document.getElementById("password-input")?.focus(); }}
                    inputProps={{ autoCapitalize: "none", autoCorrect: "off" }}
                    sx={textFieldSx}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person sx={{ color: "rgba(99, 102, 241, 0.4)", fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    id="password-input"
                    label="Contraseña"
                    type={showPassword ? "text" : "password"}
                    fullWidth value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
                    sx={textFieldSx}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlined sx={{ color: "rgba(99, 102, 241, 0.4)", fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(s => !s)} edge="end" sx={{ color: "rgba(255,255,255,0.3)" }}>
                            {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button variant="contained" size="large" fullWidth
                    onClick={handleLogin} disabled={loading} sx={buttonSx}>
                    {loading ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "ACCEDER AL PANEL"}
                  </Button>
                </>
              )}
            </Box>

            <Typography variant="caption" sx={{
              textAlign: "center", color: "rgba(255,255,255,0.25)", mt: 1,
              fontWeight: 500, letterSpacing: "0.05em"
            }}>
              Copyright © {new Date().getFullYear()}
            </Typography>
          </Card>
        </Container>
      </Zoom>
    </Box>
  );
}

const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    color: "#fff",
    borderRadius: "16px",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    fontSize: "0.95rem",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    "& fieldset": { borderColor: "rgba(255,255,255,0.08)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.15)" },
    "&.Mui-focused": {
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      "& fieldset": { borderColor: "#6366f1", borderWidth: "1px" },
      boxShadow: "0 0 20px rgba(99, 102, 241, 0.15)",
    },
    "& input:-webkit-autofill": {
      WebkitBoxShadow: "0 0 0 1000px #0f0f12 inset !important",
      WebkitTextFillColor: "white !important",
    },
  },
  "& .MuiInputLabel-root": {
    color: "rgba(255,255,255,0.35)",
    fontSize: "0.9rem",
    "&.Mui-focused": { color: "#818cf8" },
  },
};

const buttonSx = {
  mt: 1, py: 1.8, borderRadius: "16px",
  fontSize: "0.85rem", fontWeight: 800,
  letterSpacing: "0.1em", textTransform: "uppercase",
  background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
  boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.4)",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  "&:hover": {
    transform: "translateY(-3px)",
    boxShadow: "0 20px 35px -8px rgba(79, 70, 229, 0.5)",
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
  },
  "&:active": { transform: "translateY(-1px)" },
  "&.Mui-disabled": {
    background: "rgba(255,255,255,0.05)",
    color: "rgba(255,255,255,0.2)"
  },
};

export default Login;
