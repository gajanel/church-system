/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import { useState, useEffect, useCallback } from "react";
import { getUsers, createUser, updateUser, deleteUser } from "../api/users";
import { getMinistries } from "../api/ministries";
import { getMembers } from "../api/members";
import { Link } from "react-router-dom";
import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Switch, FormControlLabel, Checkbox, IconButton, Tooltip, Box,
  TableRow, TableCell, Divider, Chip, Radio, RadioGroup, Select, MenuItem, FormControl, InputLabel, Autocomplete
} from "@mui/material";
import {
  PersonAddOutlined, EditOutlined, DeleteOutlined,
  AdminPanelSettingsOutlined, CheckCircleOutlined, RadioButtonUncheckedOutlined,
  SpeedOutlined, BadgeOutlined, VolunteerActivismOutlined,
  DomainOutlined, ReceiptLongOutlined, ViewKanbanOutlined,
  CalendarMonthOutlined, WorkspacePremiumOutlined,
  SpeakerNotesOutlined, QueryStatsOutlined, HowToRegOutlined,
  ChurchOutlined, ExpandMore, ExpandLess
} from "@mui/icons-material";
import { Badge } from "../components/ui/Badge";
import { PageHeader } from "../components/ui/PageHeader";
import DataTable from "../components/ui/DataTable";
import ConfirmDialog from "../components/ConfirmDialog";
import s from "../styles/page.module.css";

const emptyForm = { name: "", username: "", email: "", password: "", is_admin: false, is_super_admin: false, modules: [], userType: "general", member_id: null, is_active: true };

const COLUMNS = [
  { label: "#",         width: "44px" },
  { label: "Nombre",    width: "20%" },
  { label: "Usuario",   width: "14%" },
  { label: "Email",     width: "22%" },
  { label: "Estado",      width: "9%" },
  { label: "Módulos",   width: "auto" },
  { label: "Acciones",  width: "10%", align: "right" },
];

const BASE_MODULES = [
  { id: "dashboard",     label: "Inicio",                  icon: <SpeedOutlined />,              sub: [] },
  { id: "members",       label: "Miembros",                icon: <BadgeOutlined />,               sub: [] },
  { id: "ministries",    label: "Admin. Ministerios",      icon: <VolunteerActivismOutlined />,   sub: [] },
  { id: "finance",       label: "Finanzas",                icon: <ReceiptLongOutlined />,         sub: [
    { id: "finance.offerings", label: "Ofrendas" },
    { id: "finance.incomes",   label: "Ingresos" },
    { id: "finance.expenses",  label: "Gastos" },
    { id: "finance.goals",     label: "Metas" },
    { id: "finance.deposits",  label: "Boletas" },
  ] },
  { id: "projects",      label: "Proyectos",               icon: <ViewKanbanOutlined />,          sub: [] },
  { id: "events",        label: "Eventos",                 icon: <CalendarMonthOutlined />,       sub: [] },
  { id: "privileges",    label: "Privilegios",             icon: <WorkspacePremiumOutlined />,    sub: [] },
  { id: "announcements", label: "Anuncios",                icon: <SpeakerNotesOutlined />,        sub: [] },
  { id: "reports",       label: "Reportes",                icon: <QueryStatsOutlined />,          sub: [
    { id: "reports.monthly",       label: "Balance Mensual" },
    { id: "reports.annual",        label: "Corte Anual" },
    { id: "reports.members",       label: "Demográfico" },
    { id: "reports.projects",      label: "Obras Misioneras" },
    { id: "reports.contributions", label: "Aportes Miembros" },
    { id: "reports.attendance",    label: "Asistencia" },
  ] },
  { id: "attendance",    label: "Asistencia",              icon: <HowToRegOutlined />,            sub: [] },
];

export default function Users() {
  const [users, setUsers]           = useState([]);
  const [ministries, setMinistries] = useState([]);
  const [members, setMembers]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(emptyForm);
  const [editing, setEditing]       = useState(null);
  const [search, setSearch]         = useState("");
  const [expandedMods, setExpandedMods] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: "", content: "", onConfirm: () => {} });

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isSelf = editing && editing.id === currentUser.id;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [resUsers, resMin, resMem] = await Promise.all([
        getUsers(),
        getMinistries().catch(() => ({ data: [] })),
        getMembers(1, 1000).catch(() => ({ data: { items: [] } }))
      ]);
      setUsers(resUsers.data);
      setMinistries(resMin.data);
      setMembers(resMem.data.items || []);
      setError("");
    } catch { setError("Error al cargar los datos."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Detect userType from existing modules when editing
  const detectUserType = (modules = []) => {
    const specificMinistries = modules.filter(m => m.startsWith("ministry."));
    if (specificMinistries.length > 0) return "ministry";
    if (modules.includes("workspace")) return "general";
    return "general";
  };

  const getModuleLabel = (modId) => {
    for (const m of BASE_MODULES) {
      if (m.id === modId) return m.label;
      const sub = m.sub.find(s => s.id === modId);
      if (sub) return sub.label;
    }
    if (modId.startsWith("ministry.")) {
      const mId = parseInt(modId.replace("ministry.", ""));
      const min = ministries.find(m => m.id === mId);
      return min ? min.name : modId;
    }
    if (modId === "workspace") return "Portal Ministerios";
    return modId;
  };

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    if (name === "is_admin" || name === "is_super_admin") {
      setForm(f => {
        const next = { ...f, [name]: checked };
        if (next.is_admin || next.is_super_admin) next.modules = [];
        if (name === "is_super_admin" && checked) next.is_admin = true;
        if (name === "is_admin" && !checked) next.is_super_admin = false;
        return next;
      });
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleUserTypeChange = (type) => {
    setForm(f => {
      // Reset ministry/workspace modules when switching type
      const clearWorkspace = f.modules.filter(m => !m.startsWith("ministry.") && m !== "workspace");
      return { ...f, userType: type, modules: clearWorkspace };
    });
  };

  const handleMinistryToggle = (ministryId) => {
    const key = `ministry.${ministryId}`;
    setForm(f => {
      let mods = [...f.modules];
      if (mods.includes(key)) {
        mods = mods.filter(m => m !== key);
        // If no more specific ministries, remove workspace too
        if (!mods.some(m => m.startsWith("ministry."))) {
          mods = mods.filter(m => m !== "workspace");
        }
      } else {
        if (!mods.includes("workspace")) mods.push("workspace");
        mods.push(key);
      }
      return { ...f, modules: mods };
    });
  };

  const toggleModule = (modId, subIds = []) => {
    setForm(f => {
      let nextModules = [...f.modules];
      const hasParent = nextModules.includes(modId);
      if (hasParent) {
        nextModules = nextModules.filter(m => m !== modId && !subIds.includes(m));
      } else {
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
        if (!nextModules.includes(parentId)) nextModules.push(parentId);
      }
      return { ...f, modules: nextModules };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError("");
    try {
      if (editing) {
        const payload = { name: form.name, username: form.username, email: form.email, is_admin: form.is_admin, is_super_admin: form.is_super_admin, modules: form.modules, member_id: form.member_id, is_active: form.is_active };
        if (form.password) payload.password = form.password;
        await updateUser(editing.id, payload);
      } else {
        if (!form.password) { setError("La contraseña es obligatoria"); return; }
        const { userType, ...payload } = form;
        await createUser(payload);
      }
      setShowForm(false); setEditing(null); setForm(emptyForm); loadData();
    } catch (err) { setError(err.response?.data?.detail || "Error al guardar"); }
  };

  const handleEdit = (u) => {
    const mods = u.modules || [];
    const uType = detectUserType(mods);
    setEditing(u);
    setForm({ name: u.name||"", username: u.username||"", email: u.email||"", password: "", is_admin: u.is_admin, is_super_admin: u.is_super_admin, modules: mods, userType: uType, member_id: u.member_id || null, is_active: u.is_active !== false });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setConfirmConfig({
      title: "¿Desactivar este usuario?",
      content: "Esta acción desactivará al usuario del sistema. No podrá iniciar sesión hasta ser reactivado.",
      onConfirm: async () => {
        try { await deleteUser(id); loadData(); }
        catch { setError("Error al desactivar el usuario"); }
        finally { setConfirmOpen(false); }
      }
    });
    setConfirmOpen(true);
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

      {error && !showForm && <div className={s.errorText}>{error}</div>}

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
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                    {u.name}
                    {u.is_super_admin ? (
                      <Tooltip title="Súper Administrador">
                        <AdminPanelSettingsOutlined sx={{ fontSize: 13, color: "var(--color-primary)" }} />
                      </Tooltip>
                    ) : u.is_admin ? (
                      <Tooltip title="Administrador">
                        <AdminPanelSettingsOutlined sx={{ fontSize: 13, color: "var(--color-error)" }} />
                      </Tooltip>
                    ) : null}
                  </span>
                  {u.member_id && members.find(m => m.id === u.member_id)?.church_role && (
                    <span style={{ 
                      fontSize: 10, fontWeight: 700, textTransform: "uppercase", 
                      letterSpacing: "0.05em", color: "#7c3aed", marginTop: 2,
                      display: "flex", alignItems: "center", gap: 3
                    }}>
                      ◆ {members.find(m => m.id === u.member_id)?.church_role}
                    </span>
                  )}
                </div>
              </div>
            </TableCell>
            <TableCell sx={{ fontSize: 12, color: "text.secondary", fontFamily: "monospace" }}>@{u.username}</TableCell>
            <TableCell sx={{ fontSize: 12, color: "text.secondary" }}>{u.email}</TableCell>
            <TableCell>
              {u.is_active === false ? (
                <Badge variant="ghost" size="sm">Inactivo</Badge>
              ) : (
                <Badge variant={u.is_super_admin ? "info" : u.is_admin ? "error" : "primary"} size="sm">
                  {u.is_super_admin ? "Súper Admin" : u.is_admin ? "Admin" : "Usuario"}
                </Badge>
              )}
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
                {!u.is_super_admin && (!u.is_admin || currentUser.is_super_admin) && u.is_active !== false && (
                  <Tooltip title="Desactivar">
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
      <Dialog open={showForm} onClose={() => setShowForm(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem", pb: 1 }}>
            {editing ? "Editar Usuario" : "Nuevo Usuario"}
          </DialogTitle>
          <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {error && <div className={s.errorText}>{error}</div>}

            {/* Basic Info */}
            <Autocomplete
              size="small"
              options={members}
              getOptionLabel={(option) => `${option.first_name} ${option.last_name}`}
              value={members.find(m => m.id === form.member_id) || null}
              onChange={(e, newValue) => {
                setForm(f => ({
                  ...f, 
                  member_id: newValue ? newValue.id : null,
                  name: newValue && !f.name ? `${newValue.first_name} ${newValue.last_name}` : f.name,
                  email: newValue && newValue.email && !f.email ? newValue.email : f.email
                }));
              }}
              renderInput={(params) => (
                <TextField {...params} label="Vincular a Miembro (Opcional)" helperText="Auto-completa nombre y correo" />
              )}
            />

            <TextField size="small" label="Nombre completo" name="name" value={form.name} onChange={handleChange} required fullWidth />
            <TextField size="small" label="Nombre de usuario" name="username" value={form.username} onChange={handleChange} required fullWidth />
            <TextField size="small" label="Correo electrónico" name="email" type="email" value={form.email} onChange={handleChange} required fullWidth />
            {isSelf ? (
              <Box sx={{ p: 1.5, bgcolor: "var(--color-primary-light)", borderRadius: 1, border: "1px solid var(--color-primary-border)" }}>
                <p style={{ fontSize: 13, margin: 0, color: "var(--color-primary)", fontWeight: 600 }}>Editando tu propio perfil.</p>
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

            <Divider />

            {/* Admin toggles */}
            {currentUser.is_super_admin && (
              <div className={s.subPanel} style={{ marginBottom: 0 }}>
                <FormControlLabel
                  control={<Switch checked={form.is_super_admin} onChange={handleChange} name="is_super_admin" color="primary" />}
                  label={<span style={{ fontWeight: 600, fontSize: 13, color: form.is_super_admin ? "var(--color-primary)" : "var(--text-primary)" }}>Súper Administrador</span>}
                />
                <p style={{ fontSize: 12, color: "var(--text-secondary)", marginLeft: 44, marginTop: 2 }}>
                  Control total del sistema, auditoría y respaldo de datos.
                </p>
              </div>
            )}
            {editing && currentUser.is_super_admin && (
              <div className={s.subPanel} style={{ marginBottom: 0 }}>
                <FormControlLabel
                  control={<Switch checked={form.is_active} onChange={handleChange} name="is_active" color="success" />}
                  label={<span style={{ fontWeight: 600, fontSize: 13, color: form.is_active ? "#059669" : "var(--text-primary)" }}>Cuenta Activa</span>}
                />
                <p style={{ fontSize: 12, color: "var(--text-secondary)", marginLeft: 44, marginTop: 2 }}>
                  Si está inactiva, el usuario no podrá iniciar sesión.
                </p>
              </div>
            )}
            {currentUser.is_super_admin && (
              <div className={s.subPanel} style={{ marginBottom: 0 }}>
                <FormControlLabel
                  control={<Switch checked={form.is_admin} onChange={handleChange} name="is_admin" color="error" />}
                  label={<span style={{ fontWeight: 600, fontSize: 13, color: form.is_admin ? "var(--color-error)" : "var(--text-primary)" }}>Administrador</span>}
                />
                <p style={{ fontSize: 12, color: "var(--text-secondary)", marginLeft: 44, marginTop: 2 }}>
                  {form.is_admin ? "Acceso total al sistema." : "Usuario común — configura módulos abajo."}
                </p>
              </div>
            )}

            {/* Module selection (only for non-admin users) */}
            {!form.is_admin && (
              <>
                <Divider />

                {/* USER TYPE SELECTOR */}
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                    Tipo de Acceso al Portal de Ministerios
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {/* GENERAL ACCESS */}
                    <button
                      type="button"
                      onClick={() => handleUserTypeChange("general")}
                      style={{
                        border: `2px solid ${form.userType === "general" ? "var(--color-primary)" : "var(--border)"}`,
                        borderRadius: 10,
                        padding: "12px 14px",
                        background: form.userType === "general" ? "var(--color-primary-light)" : "transparent",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.2s",
                        display: "flex",
                        gap: 10,
                        alignItems: "flex-start"
                      }}
                    >
                      <DomainOutlined sx={{ color: form.userType === "general" ? "var(--color-primary)" : "var(--text-muted)", mt: "2px", fontSize: 20 }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: form.userType === "general" ? "var(--color-primary)" : "var(--text-primary)" }}>
                          Acceso General
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
                          Ve todos los ministerios habilitados
                        </div>
                      </div>
                    </button>

                    {/* MINISTRY-SPECIFIC ACCESS */}
                    <button
                      type="button"
                      onClick={() => handleUserTypeChange("ministry")}
                      style={{
                        border: `2px solid ${form.userType === "ministry" ? "#7c3aed" : "var(--border)"}`,
                        borderRadius: 10,
                        padding: "12px 14px",
                        background: form.userType === "ministry" ? "rgba(124,58,237,0.06)" : "transparent",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.2s",
                        display: "flex",
                        gap: 10,
                        alignItems: "flex-start"
                      }}
                    >
                      <ChurchOutlined sx={{ color: form.userType === "ministry" ? "#7c3aed" : "var(--text-muted)", mt: "2px", fontSize: 20 }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: form.userType === "ministry" ? "#7c3aed" : "var(--text-primary)" }}>
                          Solo mi Ministerio
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
                          Solo ve los ministerios asignados
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* MINISTRY PICKER (shown only if "ministry" type) */}
                {form.userType === "ministry" && (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                      Selecciona el o los ministerios
                    </p>
                    {ministries.length === 0 ? (
                      <p style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>No hay ministerios registrados.</p>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 6 }}>
                        {ministries.map(min => {
                          const key = `ministry.${min.id}`;
                          const selected = form.modules.includes(key);
                          return (
                            <div
                              key={min.id}
                              onClick={() => handleMinistryToggle(min.id)}
                              style={{
                                border: `1px solid ${selected ? "#7c3aed" : "var(--border)"}`,
                                borderRadius: 8,
                                padding: "8px 12px",
                                background: selected ? "rgba(124,58,237,0.06)" : "transparent",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                transition: "all 0.15s"
                              }}
                            >
                              <Checkbox
                                checked={selected}
                                icon={<RadioButtonUncheckedOutlined />}
                                checkedIcon={<CheckCircleOutlined />}
                                sx={{ p: 0, color: "#7c3aed", '&.Mui-checked': { color: "#7c3aed" } }}
                                size="small"
                                disableRipple
                              />
                              <span style={{ fontSize: 12, fontWeight: selected ? 600 : 400, color: selected ? "#7c3aed" : "var(--text-primary)" }}>
                                {min.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <Divider />

                {/* GENERAL MODULES */}
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                    Módulos Adicionales del Sistema
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
                    {BASE_MODULES.map(mod => {
                      const active = form.modules.includes(mod.id);
                      const hasSubs = mod.sub.length > 0;
                      const isExpanded = expandedMods[mod.id];

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
                            gap: 6,
                            transition: "all 0.2s ease-in-out"
                          }}
                        >
                          <div
                            style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
                            onClick={() => toggleModule(mod.id, mod.sub.map(s => s.id))}
                          >
                            <span style={{ color: active ? "var(--color-primary)" : "var(--text-muted)", display: "flex" }}>
                              {mod.icon}
                            </span>
                            <span style={{ fontWeight: 600, fontSize: 13, color: active ? "var(--color-primary)" : "var(--text-primary)", flex: 1 }}>
                              {mod.label}
                            </span>
                            {hasSubs && (
                              <IconButton
                                size="small"
                                sx={{ p: 0 }}
                                onClick={(e) => { e.stopPropagation(); setExpandedMods(x => ({ ...x, [mod.id]: !x[mod.id] })); }}
                              >
                                {isExpanded ? <ExpandLess sx={{ fontSize: 16 }} /> : <ExpandMore sx={{ fontSize: 16 }} />}
                              </IconButton>
                            )}
                            <Checkbox
                              checked={active}
                              icon={<RadioButtonUncheckedOutlined />}
                              checkedIcon={<CheckCircleOutlined />}
                              sx={{ p: 0 }}
                              size="small"
                              disableRipple
                              onClick={(e) => e.stopPropagation()}
                              onChange={() => toggleModule(mod.id, mod.sub.map(s => s.id))}
                            />
                          </div>

                          {hasSubs && active && isExpanded && (
                            <div style={{ borderTop: "1px dashed var(--border)", paddingTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                              {mod.sub.map(sub => {
                                const subActive = form.modules.includes(sub.id);
                                return (
                                  <div
                                    key={sub.id}
                                    onClick={() => toggleSubModule(sub.id, mod.id)}
                                    style={{
                                      display: "flex", alignItems: "center", gap: 6,
                                      padding: "4px 8px", borderRadius: 4, cursor: "pointer",
                                      background: subActive ? "var(--color-primary-light)" : "transparent",
                                      transition: "background 0.2s"
                                    }}
                                  >
                                    <Checkbox
                                      checked={subActive}
                                      icon={<RadioButtonUncheckedOutlined />}
                                      checkedIcon={<CheckCircleOutlined />}
                                      size="small" sx={{ p: 0 }} disableRipple
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
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setShowForm(false)} color="inherit">Cancelar</Button>
            <Button type="submit" variant="contained" disableElevation sx={{ bgcolor:"#0F172A", textTransform:"none", fontWeight:600, '&:hover':{bgcolor:"#1E293B"}, px:3 }}>
              {editing ? "Guardar Cambios" : "Crear Usuario"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title={confirmConfig.title}
        content={confirmConfig.content}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}