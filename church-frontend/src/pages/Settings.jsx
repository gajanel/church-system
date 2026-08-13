import { useState, useEffect, useRef } from "react";
import {
  Box, Card, CardContent, Typography, TextField, Button,
  Grid, Alert, CircularProgress, InputAdornment, Tabs, Tab,
  Divider, Switch, FormControlLabel, Tooltip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress,
  Chip, Avatar
} from "@mui/material";
import {
  Save, Business, AttachMoney, Lock, Backup, Restore,
  MenuBook, Palette, CheckCircle, Download, Upload,
  Visibility, VisibilityOff, Info, Warning, Security, Settings as SettingsIcon,
  History
} from "@mui/icons-material";
import { getSettings, updateSettings, downloadBackup, factoryReset } from "../api/settings";
import { API_URL } from "../api/api";
import { getAuditLogs } from "../api/audit";
import { changePassword } from "../api/users";
import { PageHeader } from "../components/ui/PageHeader";

// ── Componente de Sección ─────────────────────────────────────────────
function Section({ icon, title, subtitle, children }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 1, mb: 3, overflow: "visible" }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 3 }}>
          <Box sx={{
            p: 1.2, borderRadius: 1,
            background: "rgba(34, 113, 177, 0.08)",
            color: "primary.main", display: "flex"
          }}>
            {icon}
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2, fontSize: 15 }}>{title}</Typography>
            {subtitle && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>{subtitle}</Typography>}
          </Box>
        </Box>
        {children}
      </CardContent>
    </Card>
  );
}

// ── Tab Panel ─────────────────────────────────────────────────────────
function TabPanel({ value, index, children }) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

// ═══════════════════════════════════════════════════════════════════════
// SETTINGS PAGE
// ═══════════════════════════════════════════════════════════════════════
export default function Settings() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: null, text: null });
  const [data, setData] = useState({
    church_name: "",
    church_address: "",
    church_logo_url: "",
    currency_symbol: "Q",
    monthly_expense_goal: 0,
    bible_verse: "",
    primary_color: "#1e3a8a",
    secondary_color: "#3b82f6",
    font_family: "'Inter', sans-serif",
    app_language: "es",
  });

  // Cambio de contraseña
  const [pwData, setPwData] = useState({ current_password: "", new_password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false); // Nuevo state para ver Clave Actual
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState({ type: null, text: null });

  // Backup / Restore
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreFile, setRestoreFile] = useState(null);
  const [restoreDialog, setRestoreDialog] = useState(false);
  const fileInputRef = useRef();

  // Auditoría
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Tema
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");

  // ── Load ──────────────────────────────────────────────────────────
  useEffect(() => { 
    loadSettings(); 
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUser(storedUser);
    if (!storedUser?.is_admin) setTab(4);
  }, []);

  useEffect(() => {
    if (tab === 7) loadAuditLogs();
  }, [tab]);

  const loadAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const res = await getAuditLogs(0, 100);
      setAuditLogs(res.data);
    } catch {
      showMsg("error", "Error al cargar logs de auditoría.");
    } finally {
      setAuditLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await getSettings();
      setData(res.data);
    } catch {
      showMsg("error", "No se pudo cargar la configuración.");
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: null, text: null }), 5000);
  };

  // ── Guardar Identidad ──────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings({
        ...data,
        monthly_expense_goal: parseFloat(data.monthly_expense_goal) || 0
      });
      // Aplicar branding en tiempo real
      document.documentElement.style.setProperty('--color-primary', data.primary_color);
      document.title = data.church_name || "Sistema de Gestión Ministerial";
      showMsg("success", "✅ Configuración actualizada correctamente.");
    } catch {
      showMsg("error", "Error al guardar los cambios.");
    } finally {
      setSaving(false);
    }
  };

  // ── Cambiar Contraseña ─────────────────────────────────────────────
  const handlePasswordChange = async () => {
    const { current_password, new_password, confirm } = pwData;
    
    if (!current_password) return setPwMsg({ type: "error", text: "Debes ingresar tu contraseña actual." });
    if (new_password.length < 8) return setPwMsg({ type: "error", text: "La nueva contraseña debe tener mínimo 8 caracteres." });
    if (new_password !== confirm) return setPwMsg({ type: "error", text: "Las contraseñas nuevas no coinciden." });
    
    setPwSaving(true);
    setPwMsg({ type: null, text: null });
    try {
      await changePassword({ current_password, new_password });
      setPwMsg({ type: "success", text: "✅ Contraseña cambiada correctamente." });
      setPwData({ current_password: "", new_password: "", confirm: "" });
    } catch (err) {
      setPwMsg({ type: "error", text: err?.response?.data?.detail || "Error al cambiar contraseña. Verifica tu clave actual." });
    } finally {
      setPwSaving(false);
    }
  };

  // ── Backup ────────────────────────────────────────────────────────
  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      await downloadBackup();
      showMsg("success", "✅ Backup descargado correctamente.");
    } catch {
      showMsg("error", "Error al generar el backup.");
    } finally {
      setBackupLoading(false);
    }
  };

  // ── Restore (simulado) ────────────────────────────────────────────
  const handleRestoreSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/json") {
      setRestoreFile(file);
      setRestoreDialog(true);
    } else {
      showMsg("error", "Solo se aceptan archivos .json");
    }
  };

  const handleRestoreConfirm = async () => {
    setRestoreLoading(true);
    setRestoreDialog(false);
    try {
      const token = localStorage.getItem("token");
      const baseUrl = API_URL;
      const formData = new FormData();
      formData.append("file", restoreFile);

      const res = await fetch(`${baseUrl}/settings/restore-data`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.detail || "Error en restauración");

      const total = Object.values(result.restored_rows || {}).reduce((a, b) => a + b, 0);
      showMsg("success", `✅ Restauración completada: ${total} registros restaurados. Recarga la página para ver los cambios.`);
    } catch (err) {
      showMsg("error", err.message || "Error durante la restauración.");
    } finally {
      setRestoreLoading(false);
      setRestoreFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Tema ──────────────────────────────────────────────────────────
  const handleThemeToggle = (checked) => {
    setDarkMode(checked);
    localStorage.setItem("theme", checked ? "dark" : "light");
    if (checked) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  if (loading) return (
    <Box sx={{ display: "flex", justifyContent: "center", pt: 10 }}>
      <CircularProgress />
    </Box>
  );

  const TABS = [
    { id: 0, label: "Identidad",  icon: <Business fontSize="small" />, adminOnly: true },
    { id: 1, label: "Finanzas",  icon: <AttachMoney fontSize="small" />, adminOnly: true },
    { id: 2, label: "Versículo", icon: <MenuBook fontSize="small" />, adminOnly: true },
    { id: 3, label: "Marca",     icon: <Palette fontSize="small" />, adminOnly: true },
    { id: 4, label: "Seguridad", icon: <Lock fontSize="small" /> },
    { id: 5, label: "Datos",     icon: <Backup fontSize="small" />, superAdminOnly: true },
    { id: 6, label: "Apariencia", icon: <SettingsIcon fontSize="small" /> },
    { id: 7, label: "Auditoría", icon: <History fontSize="small" />, superAdminOnly: true },
  ];

  const filteredTabs = TABS.filter(t => {
    if (t.superAdminOnly) return currentUser?.is_super_admin;
    if (t.adminOnly) return currentUser?.is_admin || currentUser?.is_super_admin;
    return true;
  });

  return (
    <Box sx={{ pb: 6, maxWidth: 900, mx: "auto" }}>
      <PageHeader
        title="Configuración"
        subtitle="Administra la identidad de la iglesia y los parámetros globales del sistema."
      />

      {/* Mensaje global */}
      {msg.text && (
        <Alert severity={msg.type} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setMsg({ type: null, text: null })}>
          {msg.text}
        </Alert>
      )}

      {/* Tabs */}
      <Card variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: "divider", px: 1 }}
        >
          {filteredTabs.map((t) => (
            <Tab
              key={t.id}
              value={t.id}
              label={t.label}
              icon={t.icon}
              iconPosition="start"
              sx={{ fontWeight: 600, fontSize: "0.82rem", minHeight: 52, gap: 0.5 }}
            />
          ))}
        </Tabs>
      </Card>

      {/* ── TAB 0: Identidad ── */}
      <TabPanel value={tab} index={0}>
        <form onSubmit={handleSubmit}>
          <Section icon={<Business />} title="Identidad de la Organización" subtitle="Esta información aparecerá en reportes generados e impresiones oficiales del sistema.">
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <TextField
                  fullWidth label="Nombre de la Iglesia" name="church_name"
                  value={data.church_name}
                  onChange={e => setData(p => ({ ...p, church_name: e.target.value }))}
                  required
                  helperText="Se mostrará en la barra lateral y reportes PDF."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth label="Dirección / Ubicación" name="church_address"
                  value={data.church_address || ""}
                  onChange={e => setData(p => ({ ...p, church_address: e.target.value }))}
                  multiline rows={2}
                  placeholder="Ej. Calle Principal #123, Ciudad"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth label="URL del Logo (Opcional)" name="church_logo_url"
                  value={data.church_logo_url || ""}
                  onChange={e => setData(p => ({ ...p, church_logo_url: e.target.value }))}
                  placeholder="https://ejemplo.com/logo.png"
                  helperText="Se usará en el encabezado de reportes PDF."
                />
                {data.church_logo_url && (
                  <Box sx={{ mt: 1.5, p: 1.5, border: "1px dashed #e2e8f0", borderRadius: 2, display: "inline-flex" }}>
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
              variant="contained" type="submit" size="large"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />}
              sx={{ px: 4, py: 1.2, borderRadius: 2, fontWeight: 700 }}
            >
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </Box>
        </form>
      </TabPanel>

      {/* ── TAB 1: Finanzas ── */}
      <TabPanel value={tab} index={1}>
        <form onSubmit={handleSubmit}>
          <Section icon={<AttachMoney />} title="Parámetros Financieros" subtitle="Controla cómo se muestran y calculan los valores monetarios.">
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={5}>
                <TextField
                  fullWidth label="Símbolo de Moneda" name="currency_symbol"
                  value={data.currency_symbol}
                  onChange={e => setData(p => ({ ...p, currency_symbol: e.target.value }))}
                  required
                  helperText="Ej: Q, $, €, L"
                />
              </Grid>
              <Grid item xs={12} sm={7}>
                <TextField
                  fullWidth label="Meta de Gastos Mensual" name="monthly_expense_goal"
                  type="number"
                  value={data.monthly_expense_goal}
                  onChange={e => setData(p => ({ ...p, monthly_expense_goal: e.target.value }))}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Typography variant="body2" fontWeight={700}>{data.currency_symbol}</Typography>
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
                  <Box sx={{ p: 1.5, bgcolor: "#f8fafc", borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">{k}</Typography>
                    <Typography variant="body2" fontWeight={600}>{v}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Section>

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained" type="submit" size="large"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />}
              sx={{ px: 4, py: 1.2, borderRadius: 2, fontWeight: 700 }}
            >
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </Box>
        </form>
      </TabPanel>

      {/* ── TAB 2: Versículo ── */}
      <TabPanel value={tab} index={2}>
        <Section
          icon={<MenuBook />}
          title="Versículo Bíblico del Sistema"
          subtitle="Este versículo aparecerá en la pantalla de inicio (Dashboard) como mensaje de bienvenida."
        >
          <TextField
            fullWidth multiline rows={4}
            label="Versículo"
            value={data.bible_verse || ""}
            onChange={e => setData(p => ({ ...p, bible_verse: e.target.value }))}
            placeholder={'"Y en ningún otro hay salvación..." — Hechos 4:12'}
            helperText="Puedes incluir la referencia bíblica al final del texto."
          />

          {data.bible_verse && (
            <Box sx={{
              mt: 3, p: 3, borderRadius: 3,
              background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
              border: "1px solid rgba(0,0,0,0.06)",
              borderRight: "4px solid #3b82f6",
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

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained" type="submit" size="large"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />}
              sx={{ px: 4, py: 1.2, borderRadius: 2, fontWeight: 700 }}
            >
              {saving ? "Guardando..." : "Guardar Versículo"}
            </Button>
          </Box>
        </form>
      </TabPanel>

      {/* ── TAB 3: Marca / Brand Studio ── */}
      <TabPanel value={tab} index={3}>
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
                    borderRadius: 2,
                    border: "3px solid #e5e7eb",
                    background: data.primary_color,
                    boxShadow: `0 4px 16px ${data.primary_color}55`,
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
                {["#1e3a8a","#7c3aed","#059669","#dc2626","#d97706","#0891b2","#1f2937"].map(color => (
                  <Tooltip key={color} title={color} arrow>
                    <Box
                      onClick={() => {
                        setData(p => ({ ...p, primary_color: color }));
                        document.documentElement.style.setProperty('--color-primary', color);
                      }}
                      sx={{
                        width: 28, height: 28, borderRadius: 1.5,
                        background: color, cursor: "pointer",
                        border: data.primary_color === color ? "3px solid #1e293b" : "2px solid transparent",
                        transition: "transform 0.2s",
                        "&:hover": { transform: "scale(1.2)" }
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
                    borderRadius: 2,
                    border: "3px solid #e5e7eb",
                    background: data.secondary_color,
                    boxShadow: `0 4px 16px ${data.secondary_color}55`,
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
                      border: `2px solid ${data.app_language === lang.value ? data.primary_color : "#e5e7eb"}`,
                      borderRadius: 2,
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
                p: 3, borderRadius: 3,
                border: "1px solid #e5e7eb",
                background: "#f8fafc",
                display: "flex", alignItems: "center", gap: 2
              }}>
                <Box sx={{
                  width: 40, height: 40, borderRadius: 2,
                  background: `linear-gradient(135deg, ${data.primary_color} 0%, ${data.secondary_color} 100%)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 6px 18px ${data.primary_color}44`,
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
            variant="outlined" color="warning" size="small"
            onClick={async () => {
              try {
                await factoryReset();
                await loadSettings();
                showMsg("success", "✅ Configuración de marca reseteada.");
              } catch { showMsg("error", "Error al resetear."); }
            }}
          >
            Restablecer valores predeterminados
          </Button>
          <Button
            variant="contained" size="large"
            onClick={handleSubmit}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />}
            sx={{ px: 4, py: 1.2, borderRadius: 2, fontWeight: 700 }}
          >
            {saving ? "Guardando..." : "Aplicar Cambios de Marca"}
          </Button>
        </Box>
      </TabPanel>

      {/* ── TAB 4: Seguridad ── */}
      <TabPanel value={tab} index={4}>
        <Section
          icon={<Lock />}
          title="Seguridad de la Cuenta"
          subtitle="Administra tus credenciales de acceso. Recomendamos cambiar tu contraseña periódicamente."
        >
          {pwMsg.text && (
            <Alert 
              severity={pwMsg.type} 
              sx={{ mb: 3, borderRadius: 2, border: "1px solid", borderColor: pwMsg.type === "success" ? "success.light" : "error.light" }} 
              onClose={() => setPwMsg({ type: null, text: null })}
            >
              {pwMsg.text}
            </Alert>
          )}

          <Grid container spacing={4}>
            <Grid item xs={12} md={7}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <TextField
                  fullWidth label="Contraseña Actual"
                  type={showCurrentPw ? "text" : "password"}
                  value={pwData.current_password}
                  onChange={e => setPwData(p => ({ ...p, current_password: e.target.value }))}
                  variant="filled"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowCurrentPw(v => !v)} edge="end" size="small">
                          {showCurrentPw ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                    disableUnderline: true,
                    sx: { borderRadius: 2, bgcolor: "rgba(0,0,0,0.03)" }
                  }}
                />

                <TextField
                  fullWidth label="Nueva Contraseña"
                  type={showPw ? "text" : "password"}
                  value={pwData.new_password}
                  onChange={e => setPwData(p => ({ ...p, new_password: e.target.value }))}
                  variant="filled"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPw(v => !v)} edge="end" size="small">
                          {showPw ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                    disableUnderline: true,
                    sx: { borderRadius: 2, bgcolor: "rgba(0,0,0,0.03)" }
                  }}
                />

                <TextField
                  fullWidth label="Confirmar Nueva Contraseña"
                  type={showPw ? "text" : "password"}
                  value={pwData.confirm}
                  onChange={e => setPwData(p => ({ ...p, confirm: e.target.value }))}
                  variant="filled"
                  error={pwData.confirm.length > 0 && pwData.new_password !== pwData.confirm}
                  helperText={pwData.confirm.length > 0 && pwData.new_password !== pwData.confirm ? "Las contraseñas no coinciden." : " "}
                  InputProps={{
                    disableUnderline: true,
                    sx: { borderRadius: 2, bgcolor: "rgba(0,0,0,0.03)" }
                  }}
                />

                <Box>
                  <Button
                    variant="contained" 
                    color="primary" 
                    onClick={handlePasswordChange}
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
                    sx={{ px: 5, py: 1.5, borderRadius: 3, fontWeight: 800, boxShadow: "0 8px 20px rgba(59, 130, 246, 0.3)" }}
                  >
                    {pwSaving ? "Procesando..." : "Actualizar Contraseña"}
                  </Button>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={5}>
              <Box sx={{ 
                p: 3, borderRadius: 3, 
                bgcolor: "rgba(59, 130, 246, 0.04)", 
                border: "1px solid rgba(59, 130, 246, 0.1)",
                height: "100%"
              }}>
                <Typography variant="subtitle2" fontWeight={800} color="primary.main" mb={2} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
                  <strong>Consejo:</strong> Una contraseña segura protege no solo tus datos, sino toda la información de la organización. Evita usar fechas de nacimiento o nombres comunes.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Section>
      </TabPanel>

      {/* ── TAB 5: Datos ── */}
      <TabPanel value={tab} index={5}>
        {restoreLoading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

        <Section
          icon={<Download />}
          title="Backup Manual"
          subtitle="Descarga una copia de seguridad completa de todos los datos del sistema en formato JSON."
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <Button
              variant="contained"
              startIcon={backupLoading ? <CircularProgress size={18} color="inherit" /> : <Backup />}
              onClick={handleBackup}
              disabled={backupLoading}
              size="large"
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              {backupLoading ? "Generando..." : "Descargar Backup"}
            </Button>
            <Chip
              icon={<Info fontSize="small" />}
              label="Incluye: miembros, finanzas, proyectos, usuarios y configuración"
              variant="outlined"
              size="small"
              sx={{ color: "text.secondary" }}
            />
          </Box>
        </Section>

        <Section
          icon={<Upload />}
          title="Restaurar Backup"
          subtitle="Carga un archivo de backup previamente descargado para restaurar los datos del sistema."
        >
          <Alert severity="warning" sx={{ mb: 2.5, borderRadius: 2 }}>
            <strong>Advertencia:</strong> La restauración reemplaza los datos actuales. Haz un backup antes de continuar.
          </Alert>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleRestoreSelect}
            />
            <Button
              variant="outlined"
              color="warning"
              startIcon={<Restore />}
              onClick={() => fileInputRef.current?.click()}
              disabled={restoreLoading}
              size="large"
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              Seleccionar Archivo de Backup
            </Button>
          </Box>
        </Section>

        {/* Dialog de confirmación de restauración */}
        <Dialog open={restoreDialog} onClose={() => setRestoreDialog(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Warning color="warning" />
            Confirmar Restauración
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              Estás a punto de restaurar el sistema usando el archivo:<br />
              <strong>{restoreFile?.name}</strong>
            </Typography>
            <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
              Esta acción sobrescribirá los datos actuales y no se puede deshacer.
            </Alert>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setRestoreDialog(false)} variant="outlined" sx={{ borderRadius: 2 }}>
              Cancelar
            </Button>
            <Button onClick={handleRestoreConfirm} variant="contained" color="error" sx={{ borderRadius: 2, fontWeight: 700 }}>
              Confirmar Restauración
            </Button>
          </DialogActions>
        </Dialog>
      </TabPanel>

      {/* ── TAB 6: Apariencia ── */}
      <TabPanel value={tab} index={6}>
        <Section
          icon={<Palette />}
          title="Tema del Sistema"
          subtitle="Elige entre el modo claro y el modo oscuro para tu experiencia visual."
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 2.5, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: darkMode ? "#1e293b" : "#f8fafc" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ fontSize: 32 }}>{darkMode ? "🌙" : "☀️"}</Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={700} color={darkMode ? "#f1f5f9" : "text.primary"}>
                  {darkMode ? "Modo Oscuro" : "Modo Claro"}
                </Typography>
                <Typography variant="body2" color={darkMode ? "#94a3b8" : "text.secondary"}>
                  {darkMode ? "Interfaz con fondo oscuro, ideal para ambientes con poca luz." : "Interfaz con fondo claro, ideal para uso diurno."}
                </Typography>
              </Box>
            </Box>
            <Switch
              checked={darkMode}
              onChange={e => handleThemeToggle(e.target.checked)}
              color="primary"
              size="medium"
            />
          </Box>


        </Section>
      </TabPanel>

      {/* ── TAB 7: Auditoría ── */}
      <TabPanel value={tab} index={7}>
        <Section
          icon={<History />}
          title="Registro de Auditoría"
          subtitle="Historial detallado de todas las acciones administrativas realizadas en el sistema."
        >
          {auditLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[...Array(8)].map((_, i) => (
                <LinearProgress key={i} sx={{ height: 40, borderRadius: 1, opacity: 0.1 + (i * 0.1) }} />
              ))}
            </Box>
          ) : (
            <Box sx={{ border: '1px solid var(--border)', borderRadius: 3, overflow: 'hidden', bgcolor: "var(--surface-card)" }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ backgroundColor: 'rgba(0,0,0,0.03)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', width: '150px' }}>Fecha y Hora</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', width: '120px' }}>Módulo</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', width: '140px' }}>Usuario</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Acción Realizada</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No hay registros de actividad todavía.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 600 }}>
                            {new Date(log.created_at).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.muted', display: 'block' }}>
                            {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <Chip 
                            label={log.module} 
                            size="small" 
                            variant="outlined" 
                            sx={{ 
                              fontWeight: 700, 
                              fontSize: 10, 
                              borderRadius: 1, 
                              height: 22,
                              borderColor: 'rgba(0,0,0,0.1)',
                              bgcolor: 'rgba(0,0,0,0.02)'
                            }} 
                          />
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 24, height: 24, fontSize: 10, fontWeight: 800, bgcolor: 'primary.main' }}>
                              {log.user_name?.charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                              {log.user_name}
                            </Typography>
                          </Box>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ 
                              width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                              bgcolor: log.action === 'CREATE' ? 'var(--color-success)' : log.action === 'DELETE' ? 'var(--color-error)' : 'var(--color-info)',
                              boxShadow: `0 0 8px ${log.action === 'CREATE' ? 'var(--color-success)' : log.action === 'DELETE' ? 'var(--color-error)' : 'var(--color-info)'}66`
                            }} />
                            <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                              {log.description}
                            </Typography>
                            {log.ip_address && (
                              <Typography variant="caption" sx={{ color: 'text.muted', ml: 'auto', fontSize: 10, fontFamily: 'monospace' }}>
                                IP: {log.ip_address}
                              </Typography>
                            )}
                          </Box>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </Box>
          )}
        </Section>
      </TabPanel>
    </Box>
  );
}
