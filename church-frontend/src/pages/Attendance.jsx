/* Copyright (c) 2024-2026 GEAG. Todos los derechos reservados. */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, IconButton, InputAdornment, MenuItem, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
} from "@mui/material";
import {
  Add as AddIcon, Close as CloseIcon, Delete as DeleteIcon, Edit as EditIcon,
  GroupsOutlined, PersonAddAltOutlined, Search as SearchIcon, Save as SaveIcon,
} from "@mui/icons-material";
import { useLocation } from "react-router-dom";
import API from "../api/api";
import ConfirmDialog from "../components/ConfirmDialog";
import { PageHeader } from "../components/ui/PageHeader";
import styles from "./Attendance.module.css";

const SERVICE_TYPES = ["Culto de Oración", "Culto Ministerio de la Mujer", "Culto de Caballeros", "Culto de Jóvenes", "Culto general", "Reunión", "Culto especial", "Otro"];
const EMPTY_EXTRA = { person_type: "Visitante", person_name: "", gender: "", age_group: "Adulto", is_convert: false };
const AGE_GROUPS = [
  { value: "Niño", label: "Niño (4–12)" },
  { value: "Adolescente", label: "Adolescente (13–17)" },
  { value: "Joven", label: "Joven (18–35)" },
  { value: "Adulto", label: "Adulto (36–60)" },
  { value: "Adulto Mayor", label: "Adulto mayor (61+)" },
];
const ageGroupLabel = value => AGE_GROUPS.find(group => group.value === value)?.label || value;
const today = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().split("T")[0];
};
const emptyForm = () => ({ date: today(), service_type: "Culto general", notes: "" });

const normalizeGender = value => {
  const gender = String(value || "").trim().toLowerCase();
  if (["m", "masculino", "hombre"].includes(gender)) return "Masculino";
  if (["f", "femenino", "mujer"].includes(gender)) return "Femenino";
  return "";
};
const memberGroup = (member, eventDate) => {
  if (!member.birth_date) return "";
  const birth = new Date(`${member.birth_date}T12:00:00`);
  const event = new Date(`${eventDate}T12:00:00`);
  let age = event.getFullYear() - birth.getFullYear();
  if (event.getMonth() < birth.getMonth() || (event.getMonth() === birth.getMonth() && event.getDate() < birth.getDate())) age--;
  if (age < 13) return "Niño";
  if (age < 18) return "Adolescente";
  if (age < 36) return "Joven";
  if (age < 61) return "Adulto";
  return "Adulto Mayor";
};
const messageFrom = error => error.response?.data?.detail || "No se pudo completar la operación.";

export default function Attendance() {
  const location = useLocation();
  const [rows, setRows] = useState([]);
  const [members, setMembers] = useState([]);
  const [ministries, setMinistries] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [extras, setExtras] = useState([]);
  const [extra, setExtra] = useState(EMPTY_EXTRA);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("month");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [ministryFilter, setMinistryFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  const canManageHistory = useMemo(() => {
    try { return Boolean(JSON.parse(localStorage.getItem("user") || "{}").is_super_admin); }
    catch { return false; }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const result = await Promise.allSettled([API.get("/attendance"), API.get("/members?page=1&size=1000"), API.get("/ministries")]);
    if (result[0].status === "fulfilled") setRows(result[0].value.data || []); else setError("No se pudo cargar el historial de asistencia.");
    if (result[1].status === "fulfilled") setMembers(result[1].value.data?.items || []); else setError("No se pudo cargar el listado de miembros.");
    if (result[2].status === "fulfilled") setMinistries(result[2].value.data || []);
    setLoading(false);
  }, []);
  useEffect(() => { loadData(); }, [loadData, location.key]);

  const memberById = useMemo(() => new Map(members.map(member => [member.id, member])), [members]);
  const visibleMembers = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es");
    return members.filter(member => member.status !== "inactive").filter(member => !term || `${member.first_name} ${member.last_name}`.toLocaleLowerCase("es").includes(term));
  }, [members, search]);
  const selectedMembers = useMemo(() => [...selected].map(id => memberById.get(id)).filter(Boolean), [memberById, selected]);
  const incompleteMembers = selectedMembers.filter(member => !memberGroup(member, form.date) || !normalizeGender(member.gender));

  const openCreate = () => {
    setEditingId(null); setForm(emptyForm()); setSelected(new Set()); setExtras([]);
    setExtra(EMPTY_EXTRA); setSearch(""); setError(""); setOpen(true);
  };
  const openEdit = row => {
    setEditingId(row.id);
    setForm({ date: row.date, service_type: row.service_type, notes: row.notes || "" });
    setSelected(new Set((row.records || []).filter(record => record.person_type === "Miembro" && record.member_id).map(record => record.member_id)));
    setExtras((row.records || []).filter(record => record.person_type !== "Miembro").map(record => ({ ...record, gender: normalizeGender(record.gender), age_group: record.age_group || "Adulto" })));
    setExtra(EMPTY_EXTRA); setSearch(""); setError(""); setOpen(true);
  };
  const toggleMember = id => setSelected(current => {
    const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next;
  });
  const addExtra = () => {
    if (!extra.person_name.trim() || !extra.gender || !extra.age_group) return;
    setExtras(current => [...current, { ...extra, person_name: extra.person_name.trim(), localId: crypto.randomUUID() }]);
    setExtra(EMPTY_EXTRA);
  };

  const saveAttendance = async event => {
    event.preventDefault();
    const records = [
      ...selectedMembers.map(member => ({ person_type: "Miembro", member_id: member.id, is_convert: false, gender: normalizeGender(member.gender) || null, age_group: memberGroup(member, form.date) })),
      ...extras.map(({ person_type, person_name, gender, age_group, is_convert }) => ({ person_type, person_name, gender, age_group, is_convert })),
    ];
    if (!records.length) { setError("Selecciona o agrega al menos una persona."); return; }
    if (incompleteMembers.length) { setError("Hay miembros sin fecha de nacimiento o género. Actualiza su ficha antes de guardar."); return; }
    setSaving(true); setError("");
    try {
      if (editingId) await API.put(`/attendance/${editingId}`, { ...form, records }); else await API.post("/attendance", { ...form, records });
      setSuccess(editingId ? "Asistencia actualizada correctamente." : "Asistencia registrada correctamente.");
      setOpen(false); await loadData();
    } catch (requestError) { setError(messageFrom(requestError)); }
    finally { setSaving(false); }
  };
  const deleteAttendance = async () => {
    try { await API.delete(`/attendance/${deleteId}`); setSuccess("Registro eliminado correctamente."); await loadData(); }
    catch (requestError) { setError(messageFrom(requestError)); }
    finally { setDeleteId(null); }
  };

  const filteredRows = useMemo(() => rows.filter(row => {
    const rowDate = new Date(`${row.date}T12:00:00`), now = new Date();
    if (dateFilter === "month" && (rowDate.getMonth() !== now.getMonth() || rowDate.getFullYear() !== now.getFullYear())) return false;
    if (dateFilter === "7days" && (now - rowDate) / 86400000 > 7) return false;
    if (serviceFilter !== "all" && row.service_type !== serviceFilter) return false;
    return ministryFilter === "all" || (row.records || []).some(record => record.ministry_ids?.includes(Number(ministryFilter)));
  }).map(row => {
    if (ministryFilter === "all") return row;
    const stats = { men: 0, women: 0, youth: 0, children: 0, teens: 0, seniors: 0, visitors: 0, converts: 0, total: 0 };
    (row.records || []).filter(record => record.ministry_ids?.includes(Number(ministryFilter))).forEach(record => {
      stats.total++; if (record.is_convert) stats.converts++; if (record.person_type === "Visitante") stats.visitors++;
      const member = memberById.get(record.member_id);
      const group = record.age_group || (member ? memberGroup(member, row.date) : "Adulto");
      const gender = normalizeGender(record.gender || member?.gender);
      if (group === "Niño") stats.children++; else if (group === "Adolescente") stats.teens++;
      else if (group === "Joven") stats.youth++; else if (group === "Adulto Mayor") stats.seniors++;
      else if (gender === "Masculino") stats.men++; else if (gender === "Femenino") stats.women++;
    });
    return { ...row, ...stats };
  }), [rows, dateFilter, serviceFilter, ministryFilter, memberById]);

  const summary = useMemo(() => filteredRows.reduce((totals, row) => {
    ["total", "men", "women", "youth", "children", "teens", "seniors", "visitors", "converts"].forEach(key => { totals[key] += Number(row[key] || 0); });
    return totals;
  }, { sessions: filteredRows.length, total: 0, men: 0, women: 0, youth: 0, children: 0, teens: 0, seniors: 0, visitors: 0, converts: 0 }), [filteredRows]);
  const stats = [["Cultos", summary.sessions], ["Asistencia", summary.total], ["Niños · 4–12", summary.children], ["Adolescentes · 13–17", summary.teens], ["Jóvenes · 18–35", summary.youth], ["Mujeres · 36–60", summary.women], ["Hombres · 36–60", summary.men], ["Adulto mayor · 61+", summary.seniors], ["Visitas", summary.visitors], ["Convertidos", summary.converts]];

  return <div className={styles.page}>
    <PageHeader title="Asistencia" subtitle="Registra personas por culto y consulta la composición de la congregación."><Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Registrar asistencia</Button></PageHeader>
    {success && <Alert severity="success" onClose={() => setSuccess("")} className={styles.notice}>{success}</Alert>}
    {error && !open && <Alert severity="error" onClose={() => setError("")} className={styles.notice}>{error}</Alert>}

    <section className={styles.filters} aria-label="Filtros de asistencia">
      <TextField select label="Periodo" value={dateFilter} onChange={event => setDateFilter(event.target.value)}><MenuItem value="month">Este mes</MenuItem><MenuItem value="7days">Últimos 7 días</MenuItem><MenuItem value="all">Todo el historial</MenuItem></TextField>
      <TextField select label="Actividad" value={serviceFilter} onChange={event => setServiceFilter(event.target.value)}><MenuItem value="all">Todas</MenuItem>{SERVICE_TYPES.map(type => <MenuItem key={type} value={type}>{type}</MenuItem>)}</TextField>
      <TextField select label="Ministerio" value={ministryFilter} onChange={event => setMinistryFilter(event.target.value)}><MenuItem value="all">Todos</MenuItem>{ministries.map(ministry => <MenuItem key={ministry.id} value={ministry.id}>{ministry.name}</MenuItem>)}</TextField>
    </section>
    <section className={styles.stats}>{stats.map(([label, value]) => <div className={styles.stat} key={label}><span>{label}</span><strong>{value}</strong></div>)}</section>
    <p className={styles.breakdownNote}>La clasificación usa la edad cumplida en la fecha del culto. Los menores de 4 años se incluyen en Niños para mantener íntegro el total; visitas y convertidos son indicadores complementarios.</p>

    <TableContainer component={Paper} variant="outlined" className={styles.tableWrap}><Table size="small">
      <TableHead><TableRow><TableCell>Fecha</TableCell><TableCell>Actividad</TableCell><TableCell align="center">Niños<br />4–12</TableCell><TableCell align="center">Adoles.<br />13–17</TableCell><TableCell align="center">Jóvenes<br />18–35</TableCell><TableCell align="center">Mujeres<br />36–60</TableCell><TableCell align="center">Hombres<br />36–60</TableCell><TableCell align="center">Adulto mayor<br />61+</TableCell><TableCell align="center">Visitas</TableCell><TableCell align="center">Convertidos</TableCell><TableCell align="center">Total</TableCell>{canManageHistory && <TableCell align="right">Acciones</TableCell>}</TableRow></TableHead>
      <TableBody>{filteredRows.map(row => <TableRow key={row.id} hover>
        <TableCell className={styles.nowrap}>{new Date(`${row.date}T12:00:00`).toLocaleDateString("es-GT")}</TableCell><TableCell><strong>{row.service_type}</strong>{row.notes && <span className={styles.rowNote}>{row.notes}</span>}</TableCell>
        <TableCell align="center">{row.children || 0}</TableCell><TableCell align="center">{row.teens || 0}</TableCell><TableCell align="center">{row.youth || 0}</TableCell><TableCell align="center">{row.women || 0}</TableCell><TableCell align="center">{row.men || 0}</TableCell><TableCell align="center">{row.seniors || 0}</TableCell><TableCell align="center">{row.visitors || 0}</TableCell><TableCell align="center">{row.converts || 0}</TableCell><TableCell align="center"><Chip size="small" label={row.total} color="primary" /></TableCell>
        {canManageHistory && <TableCell align="right" className={styles.nowrap}><Tooltip title="Editar"><IconButton size="small" onClick={() => openEdit(row)}><EditIcon fontSize="small" /></IconButton></Tooltip><Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => setDeleteId(row.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip></TableCell>}
      </TableRow>)}
      {!loading && !filteredRows.length && <TableRow><TableCell colSpan={canManageHistory ? 12 : 11} align="center" className={styles.empty}>No hay registros para los filtros seleccionados.</TableCell></TableRow>}
      {loading && <TableRow><TableCell colSpan={canManageHistory ? 12 : 11} align="center" className={styles.empty}>Cargando asistencia…</TableCell></TableRow>}</TableBody>
    </Table></TableContainer>

    <Dialog open={open} onClose={() => !saving && setOpen(false)} fullWidth maxWidth="md"><form onSubmit={saveAttendance}>
      <DialogTitle>{editingId ? "Editar asistencia" : "Registrar asistencia"}</DialogTitle>
      <DialogContent className={styles.dialogContent}>
        {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
        <div className={styles.eventFields}><TextField label="Fecha" type="date" value={form.date} onChange={event => setForm(current => ({ ...current, date: event.target.value }))} InputLabelProps={{ shrink: true }} required /><TextField select label="Actividad" value={form.service_type} onChange={event => setForm(current => ({ ...current, service_type: event.target.value }))} required>{SERVICE_TYPES.map(type => <MenuItem key={type} value={type}>{type}</MenuItem>)}</TextField></div>

        <div className={styles.sectionHeading}><div><Typography variant="h6">Miembros</Typography><Typography variant="body2" color="text.secondary">El género y el grupo se toman de la ficha de cada miembro.</Typography></div><Chip label={`${selected.size} seleccionados`} /></div>
        <div className={styles.memberTools}><TextField placeholder="Buscar por nombre" value={search} onChange={event => setSearch(event.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} /><Button onClick={() => setSelected(current => { const next = new Set(current); visibleMembers.forEach(member => next.add(member.id)); return next; })}>Marcar visibles</Button><Button color="inherit" onClick={() => setSelected(new Set())}>Limpiar</Button></div>
        <Paper variant="outlined" className={styles.memberList}>{visibleMembers.map(member => {
          const gender = normalizeGender(member.gender), group = memberGroup(member, form.date);
          return <label className={`${styles.memberRow} ${selected.has(member.id) ? styles.memberSelected : ""}`} key={member.id}><Checkbox checked={selected.has(member.id)} onChange={() => toggleMember(member.id)} /><span className={styles.memberName}>{member.first_name} {member.last_name}</span><span className={styles.memberMeta}><Chip size="small" variant="outlined" color={group ? "default" : "warning"} label={group ? ageGroupLabel(group) : "Sin fecha"} /><Chip size="small" variant="outlined" color={gender ? "default" : "warning"} label={gender || "Sin género"} /></span></label>;
        })}{!visibleMembers.length && <div className={styles.empty}>No se encontraron miembros.</div>}</Paper>
        {incompleteMembers.length > 0 && <Alert severity="warning">{incompleteMembers.length} miembro(s) seleccionado(s) no tienen fecha de nacimiento o género. Actualiza esos datos antes de guardar.</Alert>}

        <div className={styles.sectionHeading}><div><Typography variant="h6">Visitantes y adherentes</Typography><Typography variant="body2" color="text.secondary">Completa género y grupo para clasificarlos correctamente.</Typography></div><PersonAddAltOutlined color="action" /></div>
        <Paper variant="outlined" className={styles.extraForm}><TextField select label="Tipo" value={extra.person_type} onChange={event => setExtra(current => ({ ...current, person_type: event.target.value }))}><MenuItem value="Visitante">Visitante</MenuItem><MenuItem value="Adherente">Adherente</MenuItem></TextField><TextField label="Nombre completo" value={extra.person_name} onChange={event => setExtra(current => ({ ...current, person_name: event.target.value }))} /><TextField select label="Género" value={extra.gender} onChange={event => setExtra(current => ({ ...current, gender: event.target.value }))}><MenuItem value="Masculino">Masculino</MenuItem><MenuItem value="Femenino">Femenino</MenuItem></TextField><TextField select label="Grupo de edad" value={extra.age_group} onChange={event => setExtra(current => ({ ...current, age_group: event.target.value }))}>{AGE_GROUPS.map(group => <MenuItem key={group.value} value={group.value}>{group.label}</MenuItem>)}</TextField><FormControlLabel control={<Checkbox checked={extra.is_convert} onChange={event => setExtra(current => ({ ...current, is_convert: event.target.checked }))} />} label="Nuevo convertido" /><Button variant="outlined" startIcon={<AddIcon />} onClick={addExtra} disabled={!extra.person_name.trim() || !extra.gender}>Agregar</Button></Paper>
        {extras.length > 0 && <div className={styles.extraList}>{extras.map((person, index) => <div className={styles.extraRow} key={person.localId || person.id || index}><GroupsOutlined color="action" /><span><strong>{person.person_name}</strong><small>{person.person_type} · {ageGroupLabel(person.age_group)} · {person.gender}{person.is_convert ? " · Convertido" : ""}</small></span><IconButton aria-label={`Quitar a ${person.person_name}`} onClick={() => setExtras(current => current.filter((_, itemIndex) => itemIndex !== index))}><CloseIcon /></IconButton></div>)}</div>}
        <TextField label="Notas u observaciones" multiline minRows={2} fullWidth value={form.notes} onChange={event => setForm(current => ({ ...current, notes: event.target.value }))} />
      </DialogContent>
      <DialogActions><Button color="inherit" onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button><Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={saving}>{saving ? "Guardando…" : "Guardar asistencia"}</Button></DialogActions>
    </form></Dialog>
    <ConfirmDialog open={deleteId !== null} title="Eliminar registro" content="Se eliminará este registro de asistencia y su detalle." onConfirm={deleteAttendance} onCancel={() => setDeleteId(null)} />
  </div>;
}
