import { useState, useEffect, useCallback } from "react";
import { getUsers, createUser, updateUser, deleteUser } from "../api/users";
import { getMinistries } from "../api/ministries";
import { Link } from "react-router-dom";
import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Switch, FormControlLabel, Checkbox, IconButton, Tooltip, Box,
  TableRow, TableCell
} from "@mui/material";
import {
  PersonAddOutlined, EditOutlined, DeleteOutlined,
  AdminPanelSettingsOutlined, CheckCircleOutlined, RadioButtonUncheckedOutlined,
  KeyboardArrowDownOutlined, KeyboardArrowUpOutlined,
  SpeedOutlined, BadgeOutlined, VolunteerActivismOutlined,
  DomainOutlined, ReceiptLongOutlined, ViewKanbanOutlined,
  CalendarMonthOutlined, WorkspacePremiumOutlined,
  SpeakerNotesOutlined, QueryStatsOutlined, HowToRegOutlined
} from "@mui/icons-material";
import { Badge } from "../components/ui/Badge";
import { PageHeader } from "../components/ui/PageHeader";
import DataTable from "../components/ui/DataTable";
import s from "../styles/page.module.css";

const emptyForm = { name: "", username: "", email: "", password: "", is_admin: false, is_super_admin: false, modules: [] };

const COLUMNS = [
  { label: "#",         width: "44px" },
  { label: "Nombre",    width: "20%" },
  { label: "Usuario",   width: "14%" },
  { label: "Email",     width: "22%" },
  { label: "Tipo",      width: "9%" },
  { label: "Módulos",   width: "auto" },
  { label: "Acciones",  width: "10%", align: "right" },
];

const BASE_MODULES = [
  { id: "dashboard",     label: "Inicio", icon: <SpeedOutlined />, sub: [] },
  { id: "members",       label: "Miembros", icon: <BadgeOutlined />, sub: [] },
  { id: "ministries",    label: "Admin. Ministerios", icon: <VolunteerActivismOutlined />, sub: [] },
  { id: "workspace",     label: "Portales de Ministerios", icon: <DomainOutlined />, isWorkspace: true, sub: [] },
  { id: "finance",       label: "Finanzas", icon: <ReceiptLongOutlined />, sub: [
    { id: "finance.offerings", label: "Ofrendas" },
    { id: "finance.incomes",   label: "Ingresos" },
    { id: "finance.expenses",  label: "Gastos" },
    { id: "finance.goals",     label: "Metas" },
    { id: "finance.deposits",  label: "Boletas" },
  ] },
  { id: "projects",      label: "Proyectos", icon: <ViewKanbanOutlined />, sub: [] },
  { id: "events",        label: "Eventos", icon: <CalendarMonthOutlined />, sub: [] },
  { id: "privileges",    label: "Privilegios", icon: <WorkspacePremiumOutlined />, sub: [] },
  { id: "announcements", label: "Anuncios", icon: <SpeakerNotesOutlined />, sub: [] },
  { id: "reports",       label: "Reportes", icon: <QueryStatsOutlined />, sub: [
    { id: "reports.monthly",       label: "Balance Mensual" },
    { id: "reports.annual",        label: "Corte Anual" },
    { id: "reports.members",       label: "Demográfico" },
    { id: "reports.projects",      label: "Obras Misioneras" },
    { id: "reports.contributions", label: "Aportes Miembros" },
    { id: "reports.attendance",    label: "Asistencia" },
  ] },
  { id: "attendance",    label: "Asistencia", icon: <HowToRegOutlined />, sub: [] },
];

export default function Users() {
  const [users, setUsers]       = useState([]);
  const [ministries, setMinistries] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(emptyForm);
  const [editing, setEditing]   = useState(null);
  const [search, setSearch]     = useState("");

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isSelf = editing && editing.id === currentUser.id;

  const loadData = useCallback(async () => {
    setLoading(true);
    try { 
      const [resUsers, resMin] = await Promise.all([
        getUsers(),
        getMinistries().catch(() => ({ data: [] }))
      ]);
      setUsers(resUsers.data); 
      setMinistries(resMin.data);
      setError(""); 
    }
    catch { setError("Error al cargar los datos."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const computedModules = BASE_MODULES.map(m => {
    if (m.isWorkspace) {
      return {
        ...m,
        sub: ministries.map(min => ({ id: `ministry.${min.id}`, label: min.name }))
      };
    }
    return m;
  });

  const getModuleLabel = (modId) => {
    for (const m of computedModules) {
      if (m.id === modId) return m.label;
      const sub = m.sub.find(s => s.id === modId);
      if (sub) return sub.label;
    }
    return modId;
  };

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    if (name === "is_admin" || name === "is_super_admin") {
      setForm(f => {
        const next = { ...f, [name]: checked };
        if (next.is_admin || next.is_super_admin) next.modules = [];
        // If super admin is checked, ensure is_admin is also checked
        if (name === "is_super_admin" && checked) next.is_admin = true;
        // If is_admin is unchecked, uncheck super_admin too
        if (name === "is_admin" && !checked) next.is_super_admin = false;
        return next;
      });
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const toggleModule = (modId, subIds = []) => {
    setForm(f => {
      let nextModules = [...f.modules];
      const hasParent = nextModules.includes(modId);
      
      if (hasParent) {
        // Remove parent and all its submodules
        nextModules = nextModules.filter(m => m !== modId && !subIds.includes(m));
      } else {
        // Add parent
        nextModules.push(modId);
      }
      return { ...f, modules: nextModules };
    });
  };

  const toggleSubModule = (subId, parentId) => {
    setForm(f => {
      let nextModules = [...f.modules];
      if (nextModules.includes(subId)) {
        nextModules = nextModules.filter(m => m !== subId);
      } else {
        nextModules.push(subId);
        // Ensure parent is selected if a sub is selected
        if (!nextModules.includes(parentId)) {
          nextModules.push(parentId);
        }
      }
      return { ...f, modules: nextModules };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError("");
    try {
      if (editing) {
        const payload = { name: form.name, username: form.username, email: form.email, is_admin: form.is_admin, is_super_admin: form.is_super_admin, modules: form.modules };
        if (form.password) payload.password = form.password;
        await updateUser(editing.id, payload);
      } else {
        if (!form.password) { setError("La contraseña es obligatoria"); return; }
        await createUser(form);
      }
      setShowForm(false); setEditing(null); setForm(emptyForm); loadData();
    } catch (err) { setError(err.response?.data?.detail || "Error al guardar"); }
  };

  const handleEdit = (u) => {
    setEditing(u);
    setForm({ name: u.name||"", username: u.username||"", email: u.email||"", password: "", is_admin: u.is_admin, is_super_admin: u.is_super_admin, modules: u.modules||[] });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este usuario del sistema?")) return;
    try { await deleteUser(id); loadData(); }
    catch { setError("Error al eliminar el usuario"); }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q || u.name?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  return (
    <div className={s.page}>
      <PageHeader title="Gestión de Usuarios" subtitle="Administra los accesos y credenciales del personal administrativo.">
        <Button variant="contained" size="small" disableElevation sx={{ bgcolor:"#0F172A", textTransform:"none", fontWeight:600, '&:hover':{bgcolor:"#1E293B"} }} startIcon={<PersonAddOutlined sx={{ fontSize: 15 }} />}
          onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(true); }}>
          Nuevo Usuario
        </Button>
      </PageHeader>

      {error && <div className={s.errorText}>{error}</div>}

      <DataTable
        columns={COLUMNS} rows={filtered} loading={loading}
        search={search} onSearch={setSearch}
        searchPlaceholder="Buscar por nombre, usuario o email..."
        emptyText="No hay usuarios registrados."
        renderRow={(u, i) => (
          <TableRow key={u.id} sx={{ '&:hover': { bgcolor:"#f9fafb" } }}>
            <TableCell sx={{ color: "text.disabled", fontSize: 11 }}>{i + 1}</TableCell>
            <TableCell>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</span>
                {u.is_super_admin ? (
                  <Tooltip title="Súper Administrador">
                    <AdminPanelSettingsOutlined sx={{ fontSize: 13, color: "var(--color-primary)" }} />
                  </Tooltip>
                ) : u.is_admin ? (
                  <Tooltip title="Administrador">
                    <AdminPanelSettingsOutlined sx={{ fontSize: 13, color: "var(--color-error)" }} />
                  </Tooltip>
                ) : null}
              </div>
            </TableCell>
            <TableCell sx={{ fontSize: 12, color: "text.secondary", fontFamily: "monospace" }}>@{u.username}</TableCell>
            <TableCell sx={{ fontSize: 12, color: "text.secondary" }}>{u.email}</TableCell>
            <TableCell>
              <Badge variant={u.is_super_admin ? "info" : u.is_admin ? "error" : "primary"} size="sm">
                {u.is_super_admin ? "Súper Admin" : u.is_admin ? "Admin" : "Usuario"}
              </Badge>
            </TableCell>
            <TableCell>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                {u.is_admin ? (
                  <Badge variant="error" size="sm">Acceso total</Badge>
                ) : u.modules?.length > 0 ? (
                  u.modules.map(m => (
                    <Badge key={m} variant={m.startsWith("ministry.") ? "info" : "ghost"} size="sm">
                      {getModuleLabel(m)}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="default" size="sm">Sin accesos</Badge>
                )}
              </div>
            </TableCell>
            <TableCell align="right">
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                {(!u.is_admin || currentUser.is_super_admin || currentUser.id === u.id) && (
                  <Tooltip title="Editar">
                    <IconButton size="small" onClick={() => handleEdit(u)}>
                      <EditOutlined sx={{ fontSize: 15 }} />
                    </IconButton>
                  </Tooltip>
                )}
                {!u.is_super_admin && (!u.is_admin || currentUser.is_super_admin) && (
                  <Tooltip title="Eliminar">
                    <IconButton size="small" color="error" onClick={() => handleDelete(u.id)}>
                      <DeleteOutlined sx={{ fontSize: 15 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </div>
            </TableCell>
          </TableRow>
        )}
      />

      {/* Form dialog */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editing ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
          <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {error && <div className={s.errorText}>{error}</div>}
            <TextField size="small" label="Nombre completo" name="name" value={form.name} onChange={handleChange} required fullWidth />
            <TextField size="small" label="Nombre de usuario" name="username" value={form.username} onChange={handleChange} required fullWidth />
            <TextField size="small" label="Correo electrónico" name="email" type="email" value={form.email} onChange={handleChange} required fullWidth />
            {isSelf ? (
              <Box sx={{ p: 1.5, bgcolor: "var(--color-primary-light)", borderRadius: 1, border: "1px solid var(--color-primary-border)" }}>
                <p style={{ fontSize: 13, margin: 0, color: "var(--color-primary)", fontWeight: 600 }}>
                  Editando tu propio perfil.
                </p>
                <p style={{ fontSize: 12, margin: "4px 0 0", color: "var(--text-secondary)" }}>
                  Para cambiar contraseña, ve a <Link to="/settings" style={{ color: "var(--color-primary)", fontWeight: 700 }}>Configuración → Seguridad</Link>.
                </p>
              </Box>
            ) : (
              <TextField
                size="small"
                label={editing ? "Contraseña Temporal (fuerza cambio)" : "Contraseña Temporal"}
                name="password" type="password" value={form.password} onChange={handleChange} fullWidth
                helperText={editing ? "Dejar en blanco para conservar la actual" : "Obligatoria"}
              />
            )}
            {currentUser.is_super_admin && (
              <div className={s.subPanel} style={{ marginBottom: 12 }}>
                <FormControlLabel
                  control={<Switch checked={form.is_super_admin} onChange={handleChange} name="is_super_admin" color="primary" />}
                  label={<span style={{ fontWeight: 600, fontSize: 13, color: form.is_super_admin ? "var(--color-primary)" : "var(--text-primary)" }}>Privilegios de Súper Administrador</span>}
                />
                <p style={{ fontSize: 12, color: "var(--text-secondary)", marginLeft: 44, marginTop: 2 }}>
                  Control total del sistema, auditoría y respaldo de datos. No puede ser eliminado.
                </p>
              </div>
            )}
            <div className={s.subPanel}>
              <FormControlLabel
                control={<Switch checked={form.is_admin} onChange={handleChange} name="is_admin" color="error" />}
                label={<span style={{ fontWeight: 600, fontSize: 13, color: form.is_admin ? "var(--color-error)" : "var(--text-primary)" }}>Privilegios de Administrador</span>}
              />
              <p style={{ fontSize: 12, color: "var(--text-secondary)", marginLeft: 44, marginTop: 2 }}>
                {form.is_admin ? "Acceso total al sistema." : "Usuario común — configura módulos abajo."}
              </p>
            </div>
            {!form.is_admin && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid var(--border)", paddingBottom: 8, marginBottom: 10 }}>
                  Módulos Autorizados
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                  {computedModules.map(mod => {
                    const active = form.modules.includes(mod.id);
                    const hasSubs = mod.sub.length > 0;

                    return (
                      <div 
                        key={mod.id}
                        style={{
                          border: `1px solid ${active ? "var(--color-primary)" : "var(--border)"}`,
                          borderRadius: 8,
                          padding: 12,
                          background: active ? "var(--color-primary-light)" : "transparent",
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                          cursor: "pointer",
                          transition: "all 0.2s ease-in-out"
                        }}
                        onClick={() => toggleModule(mod.id, mod.sub.map(s => s.id))}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ color: active ? "var(--color-primary)" : "var(--text-muted)", display: "flex" }}>
                            {mod.icon}
                          </span>
                          <span style={{ fontWeight: 600, fontSize: 13, color: active ? "var(--color-primary)" : "var(--text-primary)" }}>
                            {mod.label}
                          </span>
                          <Checkbox 
                            checked={active} 
                            icon={<RadioButtonUncheckedOutlined />} 
                            checkedIcon={<CheckCircleOutlined />} 
                            sx={{ ml: "auto", p: 0 }} 
                            size="small" 
                            disableRipple
                          />
                        </div>

                        {hasSubs && active && (
                          <div style={{ 
                            marginTop: 4, 
                            borderTop: "1px dashed var(--border)", 
                            paddingTop: 8, 
                            display: "flex", 
                            flexDirection: "column", 
                            gap: 4 
                          }}>
                            {mod.sub.map(sub => {
                              const subActive = form.modules.includes(sub.id);
                              return (
                                <div 
                                  key={sub.id} 
                                  onClick={(e) => { e.stopPropagation(); toggleSubModule(sub.id, mod.id); }}
                                  style={{ 
                                    display: "flex", 
                                    alignItems: "center", 
                                    gap: 6, 
                                    padding: "4px 8px", 
                                    borderRadius: 4, 
                                    background: subActive ? "var(--color-primary-light)" : "transparent",
                                    transition: "background 0.2s"
                                  }}
                                >
                                  <Checkbox 
                                    checked={subActive} 
                                    icon={<RadioButtonUncheckedOutlined />} 
                                    checkedIcon={<CheckCircleOutlined />} 
                                    size="small" 
                                    sx={{ p: 0 }} 
                                    disableRipple
                                  />
                                  <span style={{ fontSize: 12, color: subActive ? "var(--color-primary)" : "var(--text-secondary)", fontWeight: subActive ? 500 : 400 }}>
                                    {sub.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setShowForm(false)} color="inherit">Cancelar</Button>
            <Button type="submit" variant="contained" disableElevation sx={{ bgcolor:"#0F172A", textTransform:"none", fontWeight:600, '&:hover':{bgcolor:"#1E293B"}, px:3 }}>{editing ? "Guardar Cambios" : "Crear Usuario"}</Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}