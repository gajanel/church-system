/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import { useState, useEffect } from "react";
import { getMinistries, createMinistry, updateMinistry, deleteMinistry } from "../api/ministries";
import {
  Button, TableRow, TableCell, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormGroup, FormControlLabel, Checkbox, MenuItem
} from "@mui/material";
import { AddHomeWorkOutlined, EditOutlined, DeleteOutlined, AccountBalanceOutlined, ArrowBack } from "@mui/icons-material";
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
                <IconButton size="small" onClick={() => handleEdit(m)}>
                  <EditOutlined sx={{ fontSize: 15 }} />
                </IconButton>
                <IconButton size="small" color="error" onClick={() => handleDelete(m.id)}>
                  <DeleteOutlined sx={{ fontSize: 15 }} />
                </IconButton>
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