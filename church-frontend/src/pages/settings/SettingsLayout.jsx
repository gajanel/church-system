import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Box, CircularProgress, Alert, Button } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { getSettings, updateSettings } from "../../api/settings";
import { PageHeader } from "../../components/ui/PageHeader";

export default function SettingsLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const isLanding = location.pathname === "/settings" || location.pathname === "/settings/";
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

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => { 
    loadSettings(); 
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUser(storedUser);
  }, []);

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

  const handleSubmit = async (e, customData = null) => {
    if (e) e.preventDefault();
    setSaving(true);
    const payloadToSave = customData || data;
    try {
      await updateSettings({
        ...payloadToSave,
        monthly_expense_goal: parseFloat(payloadToSave.monthly_expense_goal) || 0
      });
      // Aplicar branding en tiempo real
      document.documentElement.style.setProperty('--color-primary', payloadToSave.primary_color);
      document.title = payloadToSave.church_name || "Sistema de Gestión Ministerial";
      showMsg("success", "✅ Configuración actualizada correctamente.");
      return true;
    } catch {
      showMsg("error", "Error al guardar los cambios.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <Box sx={{ display: "flex", justifyContent: "center", pt: 10 }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box sx={{ pb: 6, maxWidth: 900, mx: "auto" }}>
      {!isLanding && (
        <PageHeader
          title="Configuración del Sistema"
          subtitle="Administra los parámetros globales, la identidad corporativa y la seguridad."
        >
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate("/settings")}
            variant="outlined"
            size="small"
            sx={{ textTransform: "none", borderRadius: "8px", color: "#374151", borderColor: "#d1d5db" }}
          >
            Volver al Menú
          </Button>
        </PageHeader>
      )}

      {msg.text && (
        <Alert severity={msg.type} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setMsg({ type: null, text: null })}>
          {msg.text}
        </Alert>
      )}

      {/* Outlet para renderizar el contenido específico de la sección */}
      <Box sx={{ mt: 1 }}>
        <Outlet context={{ data, setData, handleSubmit, saving, showMsg, loadSettings, currentUser }} />
      </Box>
    </Box>
  );
}
