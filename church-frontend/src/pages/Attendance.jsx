/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Divider, Tooltip, MenuItem, List, ListItem, ListItemText, ListItemSecondaryAction,
  FormControl, InputLabel, Select, Checkbox, FormControlLabel, Box, InputAdornment, Typography
} from "@mui/material";
import { Search as SearchIcon, Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Save as SaveIcon, People as PeopleIcon, TrendingUp as TrendingIcon, AssignmentInd as AttendanceIcon, EventAvailable as EventIcon } from "@mui/icons-material";
import axios from "axios";
import { API_URL as BASE_URL } from "../api/api";
import ConfirmDialog from "../components/ConfirmDialog";
import { Card, CardBody } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { PageHeader } from "../components/ui/PageHeader";
import s from "../styles/page.module.css";

const API_URL      = `${BASE_URL}/attendance`;
const SERVICE_TYPES = [
  "Culto de Oracion",
  "Culto Ministerio de la Mujer",
  "Culto de Caballeros",
  "Culto de Jovenes",
  "Culto general",
  "Reunion",
  "Culto especial",
  "Otro"
];

const STAT_CARDS = (summary) => [
  { label: "Asistencia Total", value: summary.total ?? 0, sub: "Acumulado del periodo", color: "#0F172A", icon: <PeopleIcon sx={{ fontSize: 20, color: "#fff" }} />, textColor: "#fff" },
  { label: "Convertidos", value: summary.converts ?? 0, sub: "Total de almas nuevas", color: "#166534", icon: <TrendingIcon sx={{ fontSize: 20, color: "#fff" }} />, textColor: "#fff" },
  { label: "Invitados Especiales", value: summary.visitors ?? 0, sub: "Nuevas Visitas", color: "#ffffff", icon: <EventIcon sx={{ fontSize: 20, color: "#64748b" }} />, textColor: "#0F172A", border: "1px solid #e5e7eb" },
  { label: "Ministerio Infantil", value: summary.children ?? 0, sub: "Asistencia de menores", color: "#ffffff", icon: <AttendanceIcon sx={{ fontSize: 20, color: "#64748b" }} />, textColor: "#0F172A", border: "1px solid #e5e7eb" },
];

function Attendance() {
  const location = useLocation();
  const [attendanceList, setList]  = useState([]);
  const [membersList, setMembersList] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState(new Set());
  const [extraAttendees, setExtraAttendees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [tempExtra, setTempExtra] = useState({ person_type: "Visitante", person_name: "", is_convert: false });
  const [open, setOpen]            = useState(false);
  const [loading, setLoading]      = useState(false);
  const [error, setError]          = useState(null);
  const [success, setSuccess]      = useState(null);
  const [editingId, setEditingId]  = useState(null);
  const [dateFilter, setDateFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [ministryFilter, setMinistryFilter] = useState("all");
  const [ministries, setMinistries] = useState([]);
  
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: "", content: "", onConfirm: () => {} });

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isSuper = currentUser?.is_super_admin;

  const [formData, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    service_type: "Culto general",
    men: "", women: "", youth: "", children: "", visitors: "", converts: "", notes: ""
  });

  useEffect(() => { 
    fetchAttendance(); 
    fetchMembers();
    fetchMinistries();
  }, [location.key]); 

  const token = () => localStorage.getItem("token");

  const fetchAttendance = async () => {
    try { const res = await axios.get(API_URL, { headers:{ Authorization:`Bearer ${token()}` } }); setList(res.data); }
    catch { setError("No se pudo cargar el historial de asistencia."); }
  };

  const fetchMembers = async () => {
    try { 
      const res = await axios.get(`${BASE_URL}/members?page=1&size=1000`, { headers:{ Authorization:`Bearer ${token()}` } }); 
      setMembersList(res.data.items || []); 
    }
    catch { console.error("Error loading members"); }
  };

  const fetchMinistries = async () => {
    try { 
      const res = await axios.get(`${BASE_URL}/ministries`, { headers:{ Authorization:`Bearer ${token()}` } }); 
      setMinistries(res.data); 
    }
    catch { console.error("Error loading ministries"); }
  };

  const handleOpen = () => {
    setEditingId(null);
    setForm({ date: new Date().toISOString().split("T")[0], service_type: "Culto general", notes: "" });
    setSelectedMembers(new Set());
    setExtraAttendees([]);
    setSearchTerm("");
    setTempExtra({ person_type: "Visitante", person_name: "", is_convert: false });
    setOpen(true);
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setForm({
      date: row.date,
      service_type: row.service_type,
      notes: row.notes || ""
    });
    
    const newSelected = new Set();
    const newExtra = [];
    if (row.records) {
      row.records.forEach(r => {
        if (r.person_type === "Miembro" && r.member_id) newSelected.add(r.member_id);
        else newExtra.push(r);
      });
    }
    setSelectedMembers(newSelected);
    setExtraAttendees(newExtra);
    setSearchTerm("");
    setTempExtra({ person_type: "Visitante", person_name: "", is_convert: false });
    setOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Permitir string vacío para facilitar la edición
    setForm(prev => ({ ...prev, [name]: name === "service_type" || name === "date" || name === "notes" ? value : value }));
  };

  const handleToggleMember = (id) => {
    const next = new Set(selectedMembers);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedMembers(next);
  };

  const handleAddExtra = () => {
    if (!tempExtra.person_name.trim()) return;
    setExtraAttendees([...extraAttendees, { ...tempExtra, id: Date.now() }]);
    setTempExtra({ person_type: "Visitante", person_name: "", is_convert: false });
  };

  const handleRemoveExtra = (idx) => {
    setExtraAttendees(extraAttendees.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setLoading(true); 
    setError(null);
    
    // Unificamos miembros seleccionados y extras
    const cleanRecords = [];
    selectedMembers.forEach(id => {
      cleanRecords.push({ person_type: "Miembro", member_id: id, is_convert: false });
    });
    
    extraAttendees.forEach(r => {
      cleanRecords.push({
        person_type: r.person_type,
        person_name: r.person_name,
        is_convert: r.is_convert || false
      });
    });

    const payload = {
      ...formData,
      records: cleanRecords
    };

    try {
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, payload, { headers: { Authorization: `Bearer ${token()}` } });
        setSuccess("Asistencia actualizada correctamente");
      } else {
        await axios.post(API_URL, payload, { headers: { Authorization: `Bearer ${token()}` } });
        setSuccess("Asistencia registrada correctamente");
      }
      setOpen(false); fetchAttendance();
      setTimeout(() => setSuccess(null), 3000);
    } catch { setError("Error al guardar asistencia. Verifica los datos."); }
    finally { setLoading(false); }
  };

  const handleDelete = (id) => {
    setConfirmConfig({
      title: "¿Eliminar registro?",
      content: "¿Estás seguro de que deseas eliminar este registro de asistencia? Esta acción no se puede deshacer.",
      onConfirm: async () => {
        try {
          await axios.delete(`${API_URL}/${id}`, { headers:{ Authorization:`Bearer ${token()}` } });
          setSuccess("Registro eliminado"); fetchAttendance();
          setTimeout(() => setSuccess(null), 3000);
        } catch { setError("Error al eliminar registro."); }
        finally { setConfirmOpen(false); }
      }
    });
    setConfirmOpen(true);
  };

  const filteredList = attendanceList.filter(row => {
    if (dateFilter !== "all") {
      const date = new Date(row.date + "T12:00:00");
      const now = new Date();
      if (dateFilter === "month" && (date.getMonth() !== now.getMonth() || date.getFullYear() !== now.getFullYear())) return false;
      if (dateFilter === "7days" && (now - date) / (1000 * 60 * 60 * 24) > 7) return false;
    }
    
    if (serviceFilter !== "all" && row.service_type !== serviceFilter) return false;
    
    return true;
  }).map(row => {
    if (ministryFilter === "all") return row; // No filter by ministry, return as is
    
    let men = 0, women = 0, youth = 0, children = 0, visitors = 0, converts = 0, total = 0;
    
    if (row.records) {
      row.records.forEach(r => {
        if (r.ministry_ids && r.ministry_ids.includes(Number(ministryFilter))) {
          total++;
          if (r.is_convert) converts++;
          if (r.person_type === "Visitante") visitors++;
          else if (r.person_type === "Miembro" && r.member_id) {
            const m = membersList.find(x => x.id === r.member_id);
            if (m) {
              let age = 30;
              if (m.birth_date) {
                const b = new Date(m.birth_date);
                const t = new Date();
                age = t.getFullYear() - b.getFullYear();
                if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) age--;
              }
              if (age < 13) children++;
              else if (age < 30) youth++;
              else {
                if (m.gender === "Masculino") men++;
                else women++;
              }
            }
          }
        }
      });
    }

    return { ...row, men, women, youth, children, visitors, converts, total };
  });

  const summary = {
    total: filteredList.reduce((acc, row) => acc + (row.total || 0), 0),
    converts: filteredList.reduce((acc, row) => acc + (row.converts || 0), 0),
    visitors: filteredList.reduce((acc, row) => acc + (row.visitors || 0), 0),
    children: filteredList.reduce((acc, row) => acc + (row.children || 0), 0)
  };

  return (
    <div className={s.page}>
      <PageHeader title="Registro de Asistencia" subtitle="Gestiona la asistencia de los diferentes cultos y sociedades.">
        <div style={{ display: 'flex', gap: 12 }}>
          <TextField 
            select 
            size="small" 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)} 
            sx={{ minWidth: 150, bgcolor: 'white' }}
          >
            <MenuItem value="all">Todos los registros</MenuItem>
            <MenuItem value="month">Este Mes</MenuItem>
            <MenuItem value="7days">Últimos 7 días</MenuItem>
          </TextField>
          <TextField select size="small" value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)} sx={{ minWidth: 150, bgcolor: 'white' }}>
            <MenuItem value="all">Todos los cultos</MenuItem>
            {SERVICE_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
          
          <TextField select size="small" value={ministryFilter} onChange={(e) => setMinistryFilter(e.target.value)} sx={{ minWidth: 150, bgcolor: 'white' }}>
            <MenuItem value="all">Todos los ministerios</MenuItem>
            {ministries.map(m => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
          </TextField>
          <Button variant="contained" disableElevation sx={{ bgcolor:"#0F172A", textTransform:"none", fontWeight:600, '&:hover':{bgcolor:"#1E293B"} }} size="small" startIcon={<AddIcon />} onClick={handleOpen}>Registrar Asistencia</Button>
        </div>
      </PageHeader>

      {success && <div style={{ padding:"10px 16px", borderRadius:8, background:"#dcfce7", border:"1px solid #86efac", color:"#166534", fontSize:13, fontWeight:600, marginBottom:16 }}>{success}</div>}
      {error   && <div className={s.errorText}>{error}</div>}

      {/* Summary cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px,1fr))", gap:16, marginBottom:24 }}>
        {STAT_CARDS(summary).map((sc, i) => (
          <Card key={i} style={{ background:sc.color, border: sc.border || "none", boxShadow: "none" }}>
            <CardBody>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, opacity:sc.color==="#ffffff"?1:0.85 }}>{sc.icon}<span style={{ fontSize:11, fontWeight:700, color:sc.textColor, opacity:.9 }}>{sc.label}</span></div>
              <div style={{ fontSize:36, fontWeight:800, color:sc.textColor, lineHeight:1 }}>{sc.value}</div>
              <div style={{ fontSize:11, color:sc.textColor, opacity:.8, marginTop:6, fontWeight:500 }}>{sc.sub}</div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Table */}
      <TableContainer component={Paper} elevation={0} sx={{ border:"1px solid #e5e7eb", borderRadius:"4px", boxShadow:"none" }}>
        <Table size="small" sx={{ '& .MuiTableCell-root': { padding: '6px 12px', fontSize: '0.8125rem', borderBottom: '1px solid #e5e7eb' } }}>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight:600, color:"#374151", bgcolor:"#f9fafb" } }}>
              <TableCell>Fecha</TableCell>
              <TableCell>Culto / Actividad</TableCell>
              <TableCell align="center" sx={{ width: '8%' }}>Caballeros</TableCell>
              <TableCell align="center" sx={{ width: '8%' }}>Damas</TableCell>
              <TableCell align="center" sx={{ width: '8%' }}>Jóvenes</TableCell>
              <TableCell align="center" sx={{ width: '8%' }}>Niños</TableCell>
              <TableCell align="center" sx={{ width: '8%' }}>Visitas</TableCell>
              <TableCell align="center" sx={{ width: '9%' }}>Convertidos</TableCell>
              <TableCell align="center" sx={{ width: '9%' }}>Total</TableCell>
              <TableCell align="center" sx={{ width: '10%' }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredList.map(row => (
              <TableRow key={row.id} sx={{ '&:nth-of-type(even)': { bgcolor: '#F9FAFB' }, '&:hover': { bgcolor:"#f1f5f9" }, transition: 'background-color 0.2s' }}>
                <TableCell sx={{ fontWeight:500 }}>{row.date}</TableCell>
                <TableCell><Badge variant="info" size="sm">{row.service_type}</Badge></TableCell>
                <TableCell align="center">{row.men}</TableCell>
                <TableCell align="center">{row.women}</TableCell>
                <TableCell align="center">{row.youth}</TableCell>
                <TableCell align="center">{row.children}</TableCell>
                <TableCell align="center">{row.visitors}</TableCell>
                <TableCell align="center" sx={{ fontWeight:700, color:"#166534" }}>{row.converts}</TableCell>
                <TableCell align="center" sx={{ fontWeight:800, bgcolor: "#f1f5f9", borderRight: "1px solid #e5e7eb", borderLeft: "1px solid #e5e7eb" }}>
                  {row.total}
                </TableCell>
                <TableCell align="center">
                  {isSuper && (
                    <>
                      <Tooltip title="Editar">
                        <IconButton color="primary" size="small" onClick={() => handleEdit(row)} sx={{ mr: 1 }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton color="error" size="small" onClick={() => handleDelete(row.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filteredList.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py:6, color:"text.secondary" }}>
                  No hay registros de asistencia actualmente.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Form Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight:800 }}>Registrar Nueva Asistencia</DialogTitle>
          <DialogContent dividers>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
              <TextField size="small" label="Fecha" type="date" name="date" fullWidth value={formData.date}
                onChange={handleChange} InputLabelProps={{ shrink:true }} required />
              <TextField size="small" select label="Tipo de Actividad" name="service_type" fullWidth
                value={formData.service_type} onChange={handleChange} required>
                {SERVICE_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </div>
            <Divider sx={{ my:2 }}>Pase de Lista de Miembros</Divider>
            
            <TextField 
              fullWidth size="small" 
              placeholder="Buscar miembro..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small"/></InputAdornment> }}
              sx={{ mb: 2 }}
            />
            
            <Paper variant="outlined" sx={{ maxHeight: 250, overflowY: "auto", mb: 2 }}>
              <List dense disablePadding>
                {membersList.filter(m => `${m.first_name} ${m.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())).map(m => {
                  const isChecked = selectedMembers.has(m.id);
                  return (
                    <ListItem key={m.id} disablePadding divider button onClick={() => handleToggleMember(m.id)}>
                      <Checkbox checked={isChecked} tabIndex={-1} disableRipple size="small" />
                      <ListItemText 
                        primary={`${m.first_name} ${m.last_name}`} 
                        secondary={m.church_role || "Miembro"} 
                        primaryTypographyProps={{ fontWeight: isChecked ? 600 : 400 }}
                      />
                    </ListItem>
                  );
                })}
                {membersList.length === 0 && <Box p={2} textAlign="center" color="text.secondary">No hay miembros registrados.</Box>}
              </List>
            </Paper>

            <Divider sx={{ my:2 }}>Añadir Visitantes / Adherentes</Divider>
            
            <Box sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 1, border: "1px solid #e2e8f0", mb: 2 }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", flexWrap: "wrap" }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    label="Tipo"
                    value={tempExtra.person_type}
                    onChange={(e) => setTempExtra({...tempExtra, person_type: e.target.value})}
                  >
                    <MenuItem value="Visitante">Visitante</MenuItem>
                    <MenuItem value="Adherente">Adherente</MenuItem>
                  </Select>
                </FormControl>

                <TextField 
                  size="small" 
                  label="Nombre Completo" 
                  value={tempExtra.person_name} 
                  onChange={(e) => setTempExtra({...tempExtra, person_name: e.target.value})}
                  sx={{ flexGrow: 1, minWidth: 200 }} 
                />

                <FormControlLabel
                  control={<Checkbox size="small" checked={tempExtra.is_convert} onChange={(e) => setTempExtra({...tempExtra, is_convert: e.target.checked})} />}
                  label={<span style={{fontSize: 13}}>Es Convertido</span>}
                  sx={{ ml: 0 }}
                />

                <Button variant="outlined" onClick={handleAddExtra} disabled={!tempExtra.person_name.trim()}>
                  Añadir
                </Button>
              </div>
              
              {extraAttendees.length > 0 && (
                <List dense sx={{ mt: 2, borderTop: "1px solid #e5e7eb", pt: 1 }}>
                  {extraAttendees.map((r, idx) => (
                    <ListItem key={r.id || idx} disablePadding sx={{ py: 0.5 }}>
                      <ListItemText 
                        primary={r.person_name} 
                        secondary={`${r.person_type} ${r.is_convert ? " • (Convertido)" : ""}`} 
                        primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 500 }}
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" size="small" color="error" onClick={() => handleRemoveExtra(idx)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
            <TextField size="small" label="Notas / Observaciones" name="notes" fullWidth multiline rows={3}
              value={formData.notes} onChange={handleChange} placeholder="Detalles sobre el servicio..." />
          </DialogContent>
          <DialogActions sx={{ p:2.5 }}>
            <Button onClick={() => setOpen(false)} color="inherit">Cancelar</Button>
            <Button type="submit" variant="contained" disableElevation sx={{ bgcolor:"#0F172A", textTransform:"none", fontWeight:600, '&:hover':{bgcolor:"#1E293B"}, px:3 }} startIcon={<SaveIcon />} disabled={loading}>
              Guardar Registro
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

export default Attendance;
