import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CircularProgress, Collapse, Alert } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useToast } from "../components/ui/Toast";
import { getPublicSettings } from "../api/settings";
import { API_URL } from "../api/api";
import styles from "./Login.module.css";
import logoSigdem from "../assets/logo-sigdem.png";

function Login() {
  const [username, setUsername]               = useState("");
  const [password, setPassword]               = useState("");
  const [needsPasswordChange, setNeedsPwChange] = useState(false);
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tokenToSave, setTokenToSave]         = useState(null);
  const [userToSave, setUserToSave]           = useState(null);
  const [showPassword, setShowPassword]       = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState("");
  const toast    = useToast();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    getPublicSettings().then(r => setSettings(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (localStorage.getItem("token")) navigate("/");
  }, [navigate]);

  const handleLogin = async () => {
    if (!username || !password) { setError("Ingresa tu usuario y contraseña"); return; }
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.detail || "Credenciales incorrectas";
        setError(msg); toast.error(msg); setLoading(false); return;
      }
      if (data.user.must_change_password) {
        setTokenToSave(data.access_token);
        setUserToSave(data.user);
        setNeedsPwChange(true);
      } else {
        localStorage.setItem("token",         data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        localStorage.setItem("user",          JSON.stringify(data.user));
        navigate("/");
      }
    } catch { setError("Error de conexión. Verifica tu red."); }
    setLoading(false);
  };

  const handlePwChange = async () => {
    const rx = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!rx.test(newPassword)) { setError("8+ caracteres, mayúscula, minúscula, número y símbolo."); return; }
    if (newPassword !== confirmPassword) { setError("Las contraseñas no coinciden"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tokenToSave}` },
        body: JSON.stringify({ current_password: password, new_password: newPassword }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.detail || "Error al cambiar contraseña"); setLoading(false); return; }
      localStorage.setItem("token", tokenToSave);
      localStorage.setItem("user",  JSON.stringify({ ...userToSave, must_change_password: false }));
      navigate("/");
    } catch { setError("Error de conexión."); }
    setLoading(false);
  };

  const churchName = settings?.church_name || "Sistema Ministerial";

  return (
    <div className={styles.page}>
      {/* ── Geometric background shapes ── */}
      <div className={styles.geo1} />
      <div className={styles.geo2} />
      <div className={styles.geo3} />

      {/* ── Login Card ── */}
      <div className={styles.card}>

        {/* Branding */}
        <div className={styles.brand}>
          <div className={styles.brandText}>
            <span className={styles.brandName}>SIGDEM</span>
          </div>
        </div>

        {/* Panel title */}
        <div className={styles.panelTitle}>
          {needsPasswordChange ? "Cambiar Contraseña" : "Portal de Acceso"}
        </div>

        {/* Error */}
        <Collapse in={!!error}>
          <div className={styles.errorBox}>
            <span>{error}</span>
            <button className={styles.errorClose} onClick={() => setError("")}>✕</button>
          </div>
        </Collapse>

        {/* Form */}
        {needsPasswordChange ? (
          <div className={styles.formStack}>
            <div className={styles.fieldsCol}>
              <div className={styles.fieldWrap}>
                <label className={styles.label}>Nueva Contraseña:</label>
                <input
                  className={styles.input}
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className={styles.fieldWrap}>
                <label className={styles.label}>Confirmar Contraseña:</label>
                <input
                  className={styles.input}
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handlePwChange(); }}
                />
              </div>
            </div>
            <button className={styles.loginBtn} onClick={handlePwChange} disabled={loading}>
              {loading
                ? <CircularProgress size={18} sx={{ color: "#fff" }} />
                : <><span>Actualizar</span><span className={styles.btnArrow}>→</span></>
              }
            </button>
          </div>
        ) : (
          <div className={styles.formStack}>
            <div className={styles.fieldsCol}>
              <div className={styles.fieldWrap}>
                <label className={styles.label}>Usuario:</label>
                <input
                  className={styles.input}
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") document.getElementById("pw-field")?.focus(); }}
                  autoCapitalize="none"
                  autoComplete="username"
                />
              </div>
              <div className={styles.fieldWrap}>
                <label className={styles.label}>Contraseña:</label>
                <div className={styles.pwWrap}>
                  <input
                    id="pw-field"
                    className={styles.input}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleLogin(); }}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowPassword(s => !s)}
                    tabIndex={-1}
                  >
                    {showPassword ? <VisibilityOff sx={{ fontSize: 14 }} /> : <Visibility sx={{ fontSize: 14 }} />}
                  </button>
                </div>
              </div>
            </div>

            <button className={styles.loginBtn} onClick={handleLogin} disabled={loading}>
              {loading
                ? <CircularProgress size={18} sx={{ color: "#fff" }} />
                : <><span>Ingresar</span><span className={styles.btnArrow}>→</span></>
              }
            </button>
          </div>
        )}

      </div>

      {/* ── Page footer ── */}
      <div className={styles.pageFooter}>
        © {new Date().getFullYear()} {churchName}
      </div>
    </div>
  );
}

export default Login;
