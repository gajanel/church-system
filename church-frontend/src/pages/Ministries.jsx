/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import { useState, useEffect } from "react";
import { getMinistries, createMinistry, updateMinistry, deleteMinistry, getMinistryMembers, assignMinistryMember, unassignMinistryMember } from "../api/ministries";
import { getMembers } from "../api/members";
import {
  Button, TableRow, TableCell, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormGroup, FormControlLabel, Checkbox, MenuItem,
  Autocomplete, Box, Avatar, Typography, List, ListItem, ListItemText, ListItemSecondaryAction
} from "@mui/material";
import { AddHomeWorkOutlined, EditOutlined, DeleteOutlined, AccountBalanceOutlined, ArrowBack, PeopleAltOutlined, Close as CloseIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import { Badge } from "../components/ui/Badge";
import { PageHeader } from "../components/ui/PageHeader";
import DataTable from "../components/ui/DataTable";
import s from "../styles/page.module.css";

const ALL_ROLES  = ["Coordinador","Subcoordinador","Secretario","Tesorero","Vocal 1","Vocal 2","Vocal 3","Vocal 4"];
const DAYS       = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
const emptyForm  = { name: "", roles: [], service_day: "" };

export default function Ministries() {
  const navigate = useNavigate();
  const [ministries, setMinistries] = useState([]);
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(emptyForm);
  const [error, setError]           = useState("");
  
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: "", content: "", onConfirm: () => {} });

  // Members Management State
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedMinistry, setSelectedMinistry] = useState(null);
  const [allMembers, setAllMembers] = useState([]);
  const [ministryMembers, setMinistryMembers] = useState([]); // Array of MemberMinistry assignments

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isSuper = currentUser?.is_super_admin;

  const load = async () => {
    try { const res = await getMinistries(); setMinistries(res.data); }
    catch { setError("Error al cargar ministerios"); }
  };

  const loadMembers = async () => {
    try {
      const res = await getMembers(1, 1000);
      setAllMembers(res.data.items || []);
    } catch { console.error("Error al cargar miembros"); }
  };

  useEffect(() => { load(); loadMembers(); }, []);

  const toggleRole = (role) =>
    setForm(prev => ({
      ...prev,
      roles: prev.roles.includes(role) ? prev.roles.filter(r => r !== role) : [...prev.roles, role],
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.roles.length === 0) { setError("Debes seleccionar al menos un rol"); return; }
    try {
      if (editing) await updateMinistry(editing.id, form);
      else await createMinistry(form);
      setShowForm(false); setEditing(null); setForm(emptyForm); setError(""); load();
    } catch (err) { setError(err.response?.data?.detail || "Error al guardar el ministerio"); }
  };

  const handleEdit = (m) => {
    setForm({ name: m.name, roles: m.roles.map(r => r.role), service_day: m.service_day || "" });
    setEditing(m); setShowForm(true);
  };

  const handleDelete = (id) => {
    setConfirmConfig({
      title: "¿Eliminar ministerio?",
      content: "¿Estás seguro de que deseas eliminar este ministerio? Se quitará la asignación de todos los miembros que pertenezcan a él.",
      onConfirm: async () => {
        try { await deleteMinistry(id); load(); }
        catch { setError("Error al eliminar el ministerio"); }
        finally { setConfirmOpen(false); }
      }
    });
    setConfirmOpen(true);
  };

  const handleManageMembers = async (m) => {
    setSelectedMinistry(m);
    setShowMembersModal(true);
    try {
      const res = await getMinistryMembers(m.id);
      setMinistryMembers(res.data);
    } catch {
      setError("Error al cargar los integrantes");
    }
  };

  const handleAssign = async (roleId, memberId) => {
    if (!memberId) return;
    try {
      const res = await assignMinistryMember(selectedMinistry.id, { member_id: memberId, ministry_role_id: roleId });
      setMinistryMembers(prev => {
        const filtered = prev.filter(m => m.ministry_role_id !== roleId); // Remover asignacion previa en la UI temporalmente si existía
        return [...filtered, res.data];
      });
      load(); // Recargar contador
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnassign = async (memberMinistryId) => {
    try {
      await unassignMinistryMember(memberMinistryId);
      setMinistryMembers(prev => prev.filter(m => m.id !== memberMinistryId));
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const [search, setSearch] = useState("");

  return (
    <div className={s.page}>
      <PageHeader title="Ministerios" subtitle="Administra los departamentos y sus roles dentro de la congregación.">
        <div style={{ display: "flex", gap: "10px" }}>
          <Button 
            variant="outlined" 
            size="small"
            startIcon={<ArrowBack />}
            onClick={() => navigate("/ministries")}
            sx={{ textTransform: "none", borderRadius: "8px", color: "#374151", borderColor: "#d1d5db" }}
          >
            Volver al Menú
          </Button>
          <Button variant="contained" size="small" disableElevation sx={{ bgcolor:"#0F172A", textTransform:"none", fontWeight:600, '&:hover':{bgcolor:"#1E293B"} }} startIcon={<AddHomeWorkOutlined sx={{ fontSize: 15 }} />}
            onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(true); }}>
            Nuevo Ministerio
          </Button>
        </div>
      </PageHeader>

      {error && !showForm && <div className={s.errorText}>{error}</div>}

      <DataTable
        columns={[
          { label: "Ministerio",  width: "28%" },
          { label: "Día",         width: "12%" },
          { label: "Roles",       width: "auto" },
          { label: "Miembros",    width: "10%" },
          { label: "Acciones",    width: "10%", align: "right" },
        ]}
        rows={ministries.filter(m => !search || m.name.toLowerCase().includes(search.toLowerCase()))}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Buscar ministerio..."
        emptyText="No hay ministerios registrados."
        renderRow={(m) => (
          <TableRow key={m.id} sx={{ '&:hover': { bgcolor:"#f9fafb" } }}>
            <TableCell>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <AccountBalanceOutlined sx={{ fontSize: 14, color: "var(--color-primary)" }} />
                <span style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</span>
              </div>
            </TableCell>
            <TableCell>
              {m.service_day
                ? <Badge variant="info" size="sm">{m.service_day}</Badge>
                : <span style={{ color: "var(--text-disabled)", fontSize: 12 }}>—</span>}
            </TableCell>
            <TableCell>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                {m.roles.map(r => <Badge key={r.id} variant="ghost" size="sm">{r.role}</Badge>)}
              </div>
            </TableCell>
            <TableCell sx={{ fontSize: 12, color: "text.secondary" }}>{m.member_count ?? "—"}</TableCell>
            <TableCell align="right">
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <IconButton size="small" color="primary" onClick={() => handleManageMembers(m)} title="Gestionar Integrantes">
                  <PeopleAltOutlined sx={{ fontSize: 17 }} />
                </IconButton>
                {isSuper && (
                  <>
                    <IconButton size="small" onClick={() => handleEdit(m)} title="Editar">
                      <EditOutlined sx={{ fontSize: 15 }} />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(m.id)} title="Eliminar">
                      <DeleteOutlined sx={{ fontSize: 15 }} />
                    </IconButton>
                  </>
                )}
              </div>
            </TableCell>
          </TableRow>
        )}
      />

      {/* Dialog Form */}
      <Dialog open={showForm} onClose={() => { setShowForm(false); setError(""); }} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 800 }}>{editing ? "Editar Ministerio" : "Nuevo Ministerio"}</DialogTitle>
          <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {error && <div className={s.errorText}>{error}</div>}
            <TextField size="small" label="Nombre del ministerio" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} required fullWidth />
            <TextField size="small" select label="Día de Servicio" value={form.service_day}
              onChange={e => setForm({ ...form, service_day: e.target.value })}
              fullWidth InputLabelProps={{ shrink: true }}>
              <MenuItem value=""><em>(Sin día asignado)</em></MenuItem>
              {DAYS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </TextField>
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
              Selecciona los roles requeridos
            </p>
            <div className={s.roleGrid}>
              {ALL_ROLES.map(role => {
                const isActive = form.roles.includes(role);
                return (
                  <div key={role} className={`${s.roleItem} ${isActive ? s.roleItemActive : ""}`}
                    onClick={() => toggleRole(role)}>
                    <Checkbox checked={isActive} onChange={() => {}} sx={{ p: 0 }} size="small" />
                    <span className={s.roleLabel}>{role}</span>
                  </div>
                );
              })}
            </div>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => { setShowForm(false); setError(""); setEditing(null); }} color="inherit">Cancelar</Button>
            <Button type="submit" variant="contained" disableElevation sx={{ bgcolor:"#0F172A", textTransform:"none", fontWeight:600, '&:hover':{bgcolor:"#1E293B"}, px:3 }}>Guardar</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Manage Members Dialog */}
      <Dialog open={showMembersModal} onClose={() => setShowMembersModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Integrantes de {selectedMinistry?.name}</DialogTitle>
        <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 3, p: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: -1 }}>
            Asigna a un miembro a cada uno de los roles definidos para este ministerio utilizando el buscador.
          </Typography>
          
          {selectedMinistry?.roles?.length === 0 && (
            <Typography variant="body2" color="error">Este ministerio no tiene roles asignados. Edítalo primero para agregar roles.</Typography>
          )}

          {selectedMinistry?.roles?.map(role => {
            const assignment = ministryMembers.find(m => m.ministry_role_id === role.id);
            
            return (
              <Box key={role.id} sx={{ display: 'flex', alignItems: 'center', p: 1.5, border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: '#f8fafc' }}>
                <Box sx={{ width: 140, flexShrink: 0 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155' }}>
                    {role.role}
                  </Typography>
                </Box>
                
                <Box sx={{ flexGrow: 1, ml: 2 }}>
                  {assignment ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'white', p: 0.5, pl: 1.5, borderRadius: 1, border: '1px solid #cbd5e1' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: 11, bgcolor: '#0F172A' }}>{assignment.member_name.charAt(0)}</Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{assignment.member_name}</Typography>
                      </Box>
                      <IconButton size="small" color="error" onClick={() => handleUnassign(assignment.id)}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ) : (
                    <Autocomplete
                      size="small"
                      options={allMembers}
                      getOptionLabel={(option) => `${option.first_name} ${option.last_name}`}
                      onChange={(event, newValue) => {
                        if (newValue) handleAssign(role.id, newValue.id);
                      }}
                      renderInput={(params) => (
                        <TextField {...params} placeholder="Buscar miembro..." sx={{ bgcolor: 'white' }} />
                      )}
                      noOptionsText="No se encontraron miembros"
                    />
                  )}
                </Box>
              </Box>
            );
          })}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowMembersModal(false)} variant="contained" disableElevation sx={{ bgcolor:"#0F172A" }}>
            Cerrar
          </Button>
        </DialogActions>
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