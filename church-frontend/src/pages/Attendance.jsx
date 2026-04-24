import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Divider, Tooltip, MenuItem
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Save as SaveIcon, People as PeopleIcon, TrendingUp as TrendingIcon, AssignmentInd as AttendanceIcon, EventAvailable as EventIcon } from "@mui/icons-material";
import axios from "axios";
import ConfirmDialog from "../components/ConfirmDialog";
import { Card, CardBody } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { PageHeader } from "../components/ui/PageHeader";
import s from "../styles/page.module.css";

const API_URL      = `http://${window.location.hostname}:8000/attendance`;
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

const STAT_CARDS = (latest) => [
  { label: "Asistencia Total", value: latest?.total ?? 0, sub: latest ? `Último: ${latest.service_type}` : "Sin registros", color: "var(--color-primary-hover)", icon: <PeopleIcon sx={{ fontSize: 20, color: "#fff" }} />, textColor: "#fff" },
  { label: "Convertidos", value: latest?.converts ?? 0, sub: "Total de almas nuevas", color: "var(--color-info)", icon: <TrendingIcon sx={{ fontSize: 20, color: "#fff" }} />, textColor: "#fff" },
  { label: "Invitados Especiales", value: latest?.visitors ?? 0, sub: "Nuevas Visitas", color: "var(--surface-card)", icon: <EventIcon sx={{ fontSize: 20 }} />, textColor: "var(--text-primary)" },
  { label: "Ministerio Infantil", value: latest?.children ?? 0, sub: "Asistencia de menores", color: "var(--surface-card)", icon: <AttendanceIcon sx={{ fontSize: 20 }} />, textColor: "var(--text-primary)" },
];

function Attendance() {
  const location = useLocation();
  const [attendanceList, setList]  = useState([]);
  const [open, setOpen]            = useState(false);
  const [loading, setLoading]      = useState(false);
  const [error, setError]          = useState(null);
  const [success, setSuccess]      = useState(null);
  const [editingId, setEditingId]  = useState(null);
  
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: "", content: "", onConfirm: () => {} });

  const [formData, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    service_type: "Culto general",
    men: 0, women: 0, youth: 0, children: 0, visitors: 0, converts: 0, notes: ""
  });

  useEffect(() => { 
    fetchAttendance(); 
  }, [location.key]); 

  const token = () => localStorage.getItem("token");

  const fetchAttendance = async () => {
    try { const res = await axios.get(API_URL, { headers:{ Authorization:`Bearer ${token()}` } }); setList(res.data); }
    catch { setError("No se pudo cargar el historial de asistencia."); }
  };

  const handleOpen = () => {
    setEditingId(null);
    setForm({ date: new Date().toISOString().split("T")[0], service_type: "Culto general", men: 0, women: 0, youth: 0, children: 0, visitors: 0, converts: 0, notes: "" });
    setOpen(true);
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setForm({
      date: row.date,
      service_type: row.service_type,
      men: row.men, women: row.women, youth: row.youth, children: row.children, visitors: row.visitors, converts: row.converts, notes: row.notes || ""
    });
    setOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Permitir string vacío para facilitar la edición
    setForm(prev => ({ ...prev, [name]: name === "service_type" || name === "date" || name === "notes" ? value : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setLoading(true); 
    setError(null);
    
    const payload = {
      ...formData,
      men: parseInt(formData.men) || 0,
      women: parseInt(formData.women) || 0,
      youth: parseInt(formData.youth) || 0,
      children: parseInt(formData.children) || 0,
      visitors: parseInt(formData.visitors) || 0,
      converts: parseInt(formData.converts) || 0
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

  const latest = attendanceList[0] || null;

  return (
    <div className={s.page}>
      <PageHeader title="Registro de Asistencia" subtitle="Gestiona la asistencia de los diferentes cultos y sociedades.">
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>Registrar Asistencia</Button>
      </PageHeader>

      {success && <div style={{ padding:"10px 16px", borderRadius:8, background:"var(--color-success-light)", border:"1px solid var(--color-success-border)", color:"var(--color-success)", fontSize:13, fontWeight:600, marginBottom:16 }}>{success}</div>}
      {error   && <div className={s.errorText}>{error}</div>}

      {/* Summary cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px,1fr))", gap:16, marginBottom:24 }}>
        {STAT_CARDS(latest).map((sc, i) => (
          <Card key={i} style={{ background:sc.color, border: sc.color==="var(--surface-card)"?"1px solid var(--border)":"none" }}>
            <CardBody>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, opacity:sc.color!=="var(--surface-card)"?.85:1 }}>{sc.icon}<span style={{ fontSize:11, fontWeight:700, color:sc.textColor, opacity:.9 }}>{sc.label}</span></div>
              <div style={{ fontSize:36, fontWeight:800, color:sc.textColor, lineHeight:1 }}>{sc.value}</div>
              <div style={{ fontSize:11, color:sc.textColor, opacity:.8, marginTop:6, fontWeight:500 }}>{sc.sub}</div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Table */}
      <TableContainer component={Paper} elevation={0} sx={{ border:"1px solid var(--border)", borderRadius:"10px", overflow:"hidden" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Culto / Actividad</TableCell>
              <TableCell align="center">Caballeros</TableCell>
              <TableCell align="center">Damas</TableCell>
              <TableCell align="center">Jóvenes</TableCell>
              <TableCell align="center">Niños</TableCell>
              <TableCell align="center">Visitas</TableCell>
              <TableCell align="center">Convertidos</TableCell>
              <TableCell align="center">Total</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {attendanceList.map(row => (
              <TableRow key={row.id}>
                <TableCell sx={{ fontWeight:500 }}>{row.date}</TableCell>
                <TableCell><Badge variant="info" size="sm">{row.service_type}</Badge></TableCell>
                <TableCell align="center">{row.men}</TableCell>
                <TableCell align="center">{row.women}</TableCell>
                <TableCell align="center">{row.youth}</TableCell>
                <TableCell align="center">{row.children}</TableCell>
                <TableCell align="center">{row.visitors}</TableCell>
                <TableCell align="center" sx={{ fontWeight:700, color:"var(--color-primary)" }}>{row.converts}</TableCell>
                <TableCell align="center">
                  <span style={{ fontWeight:700, padding:"2px 10px", background:"var(--color-primary)", color:"#fff", borderRadius:99, fontSize:12 }}>{row.total}</span>
                </TableCell>
                <TableCell align="center">
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
                </TableCell>
              </TableRow>
            ))}
            {attendanceList.length === 0 && (
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
              <TextField label="Fecha" type="date" name="date" fullWidth value={formData.date}
                onChange={handleChange} InputLabelProps={{ shrink:true }} required />
              <TextField select label="Tipo de Actividad" name="service_type" fullWidth
                value={formData.service_type} onChange={handleChange} required>
                {SERVICE_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </div>
            <Divider sx={{ my:2 }}>Asistentes por Categoría</Divider>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:16 }}>
              {[["Caballeros","men"],["Damas","women"],["Jóvenes","youth"],["Niños","children"],["Visitas","visitors"],["Convertidos","converts"]].map(([lbl,nm]) => (
                <TextField key={nm} label={lbl} type="number" name={nm} value={formData[nm]} onChange={handleChange} />
              ))}
            </div>
            <TextField label="Notas / Observaciones" name="notes" fullWidth multiline rows={3}
              value={formData.notes} onChange={handleChange} placeholder="Detalles sobre el servicio..." />
          </DialogContent>
          <DialogActions sx={{ p:2.5 }}>
            <Button onClick={() => setOpen(false)} color="inherit">Cancelar</Button>
            <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={loading} sx={{ px:3 }}>
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
