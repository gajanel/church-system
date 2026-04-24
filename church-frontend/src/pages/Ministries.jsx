import { useState, useEffect } from "react";
import { getMinistries, createMinistry, updateMinistry, deleteMinistry } from "../api/ministries";
import {
  Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormGroup, FormControlLabel, Checkbox, MenuItem
} from "@mui/material";
import { AddHomeWork, Edit, Delete, AccountBalance } from "@mui/icons-material";
import ConfirmDialog from "../components/ConfirmDialog";
import { Badge } from "../components/ui/Badge";
import { PageHeader } from "../components/ui/PageHeader";
import s from "../styles/page.module.css";

const ALL_ROLES  = ["Coordinador","Subcoordinador","Secretario","Tesorero","Vocal 1","Vocal 2","Vocal 3","Vocal 4"];
const DAYS       = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
const emptyForm  = { name: "", roles: [], service_day: "" };

export default function Ministries() {
  const [ministries, setMinistries] = useState([]);
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(emptyForm);
  const [error, setError]           = useState("");
  
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: "", content: "", onConfirm: () => {} });

  const load = async () => {
    try { const res = await getMinistries(); setMinistries(res.data); }
    catch { setError("Error al cargar ministerios"); }
  };

  useEffect(() => { load(); }, []);

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

  return (
    <div className={s.page}>
      <PageHeader title="Ministerios" subtitle="Administra los departamentos y sus roles dentro de la congregación.">
        <Button variant="contained" startIcon={<AddHomeWork />}
          onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(true); }}>
          Nuevo Ministerio
        </Button>
      </PageHeader>

      {error && !showForm && <div className={s.errorText}>{error}</div>}

      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid var(--border)", borderRadius: "10px" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre del Ministerio</TableCell>
              <TableCell>Día de Servicio</TableCell>
              <TableCell>Roles Disponibles</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ministries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 5, color: "text.secondary" }}>
                  No hay ministerios registrados
                </TableCell>
              </TableRow>
            ) : (
              ministries.map(m => (
                <TableRow key={m.id}>
                  <TableCell sx={{ fontWeight: 600 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <AccountBalance sx={{ fontSize: 14, color: "var(--color-primary)" }} /> {m.name}
                    </span>
                  </TableCell>
                  <TableCell>
                    {m.service_day
                      ? <Badge variant="info">{m.service_day}</Badge>
                      : <span style={{ color: "var(--text-disabled)", fontSize: 12 }}>Sin asignar</span>}
                  </TableCell>
                  <TableCell>
                    <div className={s.badgeRow}>
                      {m.roles.map(r => <Badge key={r.id} variant="ghost">{r.role}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton color="primary" size="small" onClick={() => handleEdit(m)} sx={{ mr: 1 }}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton color="error" size="small" onClick={() => handleDelete(m.id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog Form */}
      <Dialog open={showForm} onClose={() => { setShowForm(false); setError(""); }} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 800 }}>{editing ? "Editar Ministerio" : "Nuevo Ministerio"}</DialogTitle>
          <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {error && <div className={s.errorText}>{error}</div>}
            <TextField label="Nombre del ministerio" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} required fullWidth />
            <TextField select label="Día de Servicio" value={form.service_day}
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
            <Button type="submit" variant="contained" sx={{ px: 3 }}>Guardar</Button>
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