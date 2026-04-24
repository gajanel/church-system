import { useState, useEffect, useCallback } from "react";
import { getUsers, createUser, updateUser, deleteUser } from "../api/users";
import { Link } from "react-router-dom";
import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Switch, FormControlLabel, Checkbox, IconButton, Tooltip,
  Box
} from "@mui/material";
import { PersonAdd, Edit, Delete, AdminPanelSettings, CheckCircle, RadioButtonUnchecked, Security } from "@mui/icons-material";
import { Card, CardBody } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { PageHeader } from "../components/ui/PageHeader";
import s from "../styles/page.module.css";

const MODULES_LIST = [
  { id: "members",       label: "Miembros" },
  { id: "ministries",    label: "Ministerios" },
  { id: "finance",       label: "Finanzas" },
  { id: "projects",      label: "Proyectos" },
  { id: "events",        label: "Eventos" },
  { id: "privileges",    label: "Privilegios" },
  { id: "announcements", label: "Anuncios" },
  { id: "reports",       label: "Reportes" },
  { id: "attendance",    label: "Asistencia" },
];

const emptyForm = { name: "", username: "", email: "", password: "", is_admin: false, modules: [] };

export default function Users() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]       = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isSelf = editing && editing.id === currentUser.id;

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try { const res = await getUsers(); setUsers(res.data); setError(""); }
    catch { setError("Error al cargar los usuarios."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    if (name === "is_admin") setForm(f => ({ ...f, is_admin: checked, modules: checked ? [] : f.modules }));
    else setForm(f => ({ ...f, [name]: value }));
  };

  const toggleModule = (modId) =>
    setForm(f => ({
      ...f,
      modules: f.modules.includes(modId) ? f.modules.filter(m => m !== modId) : [...f.modules, modId]
    }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError("");
    try {
      if (editing) {
        const payload = { name: form.name, username: form.username, email: form.email, is_admin: form.is_admin, modules: form.modules };
        if (form.password) payload.password = form.password;
        await updateUser(editing.id, payload);
      } else {
        if (!form.password) { setError("La contraseña es obligatoria para un nuevo usuario"); return; }
        await createUser(form);
      }
      setShowForm(false); setEditing(null); setForm(emptyForm); loadUsers();
    } catch (err) { setError(err.response?.data?.detail || "Error al guardar el usuario"); }
  };

  const handleEdit = (u) => {
    setEditing(u);
    setForm({ name: u.name||"", username: u.username||"", email: u.email||"", password: "", is_admin: u.is_admin, modules: u.modules||[] });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este usuario del sistema?")) return;
    try { await deleteUser(id); loadUsers(); }
    catch { setError("Error al eliminar el usuario"); }
  };

  return (
    <div className={s.page}>
      <PageHeader title="Gestión de Usuarios" subtitle="Administra los accesos y credenciales del personal administrativo.">
        <Button variant="contained" startIcon={<PersonAdd />}
          onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(true); }}>
          Nuevo Usuario
        </Button>
      </PageHeader>

      {error && <div className={s.errorText}>{error}</div>}

      {loading ? (
        <div className={s.empty}><p className={s.emptyText}>Cargando usuarios...</p></div>
      ) : users.length === 0 ? (
        <div className={s.empty}><p className={s.emptyTitle}>No hay usuarios registrados</p></div>
      ) : (
        <div className={s.cardGrid}>
          {users.map(u => (
            <Card key={u.id} style={{ borderTop: `3px solid ${u.is_admin ? "var(--color-error)" : "var(--color-primary)"}` }}>
              <CardBody>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <p className={s.memberName} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {u.name}
                      {u.is_admin && (
                        <Tooltip title="Administrador Master">
                          <AdminPanelSettings sx={{ fontSize: 15, color: "var(--color-error)" }} />
                        </Tooltip>
                      )}
                    </p>
                    <p className={s.memberMeta} style={{ fontSize: 12, margin: "4px 0 10px" }}>
                      @{u.username} · {u.email}
                    </p>
                  </div>
                  <Badge variant={u.is_admin ? "error" : "primary"} size="sm">
                    {u.is_admin ? "Admin" : "Usuario"}
                  </Badge>
                </div>
                {!u.is_admin && (
                  <div className={s.badgeRow}>
                    {u.modules.length > 0
                      ? u.modules.map(m => (
                          <Badge key={m} variant="ghost" size="sm">
                            {MODULES_LIST.find(x => x.id === m)?.label || m}
                          </Badge>
                        ))
                      : <Badge variant="default" size="sm">Sin accesos</Badge>
                    }
                  </div>
                )}
              </CardBody>
              <div className={s.cardFooter} style={{ justifyContent: "flex-end" }}>
                <div className={s.cardActions}>
                  <Tooltip title="Editar"><IconButton color="primary" size="small" onClick={() => handleEdit(u)}><Edit fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Eliminar"><IconButton color="error" size="small" onClick={() => handleDelete(u.id)}><Delete fontSize="small" /></IconButton></Tooltip>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog Form */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 800 }}>{editing ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
          <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {error && <div className={s.errorText}>{error}</div>}
            <TextField label="Nombre completo" name="name" value={form.name} onChange={handleChange} required fullWidth />
            <TextField label="Nombre de Usuario" name="username" value={form.username} onChange={handleChange} required fullWidth />
            <TextField label="Correo Electrónico" name="email" type="email" value={form.email} onChange={handleChange} required fullWidth />
            {isSelf ? (
              <Box sx={{ p: 2, bgcolor: "rgba(59, 130, 246, 0.05)", borderRadius: 2, border: "1px solid rgba(59, 130, 246, 0.2)" }}>
                <p style={{ fontSize: 13, margin: 0, color: "var(--color-primary)", fontWeight: 600 }}>
                  🛡️ Estás editando tu propio perfil.
                </p>
                <p style={{ fontSize: 12, margin: "4px 0 0", color: "var(--text-secondary)" }}>
                  Para cambiar tu contraseña de forma segura, utiliza la sección de 
                  <Link to="/settings" style={{ color: "var(--color-primary)", fontWeight: 700, marginLeft: 4 }}>
                    Seguridad en Configuración
                  </Link>.
                </p>
              </Box>
            ) : (
              <TextField
                label={editing ? "Contraseña Temporal (Forzará cambio)" : "Contraseña Temporal"}
                name="password" type="password" value={form.password} onChange={handleChange} fullWidth
                helperText={editing ? "Dejar en blanco para conservar la actual" : "Obligatoria para la creación"}
              />
            )}
            <div className={s.subPanel}>
              <FormControlLabel
                control={<Switch checked={form.is_admin} onChange={handleChange} name="is_admin" color="error" />}
                label={<span style={{ fontWeight: 600, color: form.is_admin ? "var(--color-error)" : "var(--text-primary)" }}>
                  Privilegios de Administrador
                </span>}
              />
              <p style={{ fontSize: 12, color: "var(--text-secondary)", marginLeft: 44, marginTop: 4 }}>
                {form.is_admin ? "Acceso total al sistema" : "Usuario común. Selecciona módulos abajo."}
              </p>
            </div>
            {!form.is_admin && (
              <div>
                <p className={s.subPanelTitle} style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid var(--border)", paddingBottom: 8, marginBottom: 12 }}>
                  Módulos Autorizados
                </p>
                <div className={s.roleGrid}>
                  {MODULES_LIST.map(mod => {
                    const isActive = form.modules.includes(mod.id);
                    return (
                      <div key={mod.id} className={`${s.roleItem} ${isActive ? s.roleItemActive : ""}`}
                        onClick={() => toggleModule(mod.id)}>
                        <Checkbox checked={isActive} icon={<RadioButtonUnchecked />} checkedIcon={<CheckCircle />}
                          sx={{ p: 0, mr: 1 }} disableRipple size="small" />
                        <span className={s.roleLabel}>{mod.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setShowForm(false)} color="inherit">Cancelar</Button>
            <Button type="submit" variant="contained" sx={{ px: 3 }}>
              {editing ? "Guardar Cambios" : "Crear Usuario"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}