/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import { useState, useEffect } from "react";
import {
  getAnnouncements, createAnnouncement, updateAnnouncement,
  deleteAnnouncement, publishAnnouncement, publishWeeklyProgram, publishPlaylist
} from "../api/announcements";
import {
  Button, TextField, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Checkbox
} from "@mui/material";
import { Campaign, LiveTv, AddCircle, Edit, Delete, CalendarMonth, DesktopWindows, StopCircle } from "@mui/icons-material";
import { Badge } from "../components/ui/Badge";
import { PageHeader } from "../components/ui/PageHeader";
import { getSchedule } from "../api/privileges";
import s from "../styles/page.module.css";

const getMonday = d => { const dt = new Date(d); const day = dt.getDay(); const diff = dt.getDate()-day+(day===0?-6:1); return new Date(dt.setDate(diff)).toISOString().split("T")[0]; };

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [form, setForm]                   = useState(null);
  const [weekToPublish, setWeekToPublish] = useState(() => localStorage.getItem("privileges_week_start") || getMonday(new Date()));
  const [selectedIds, setSelectedIds]     = useState([]);
  const [isPublishingPlaylist, setPubPlay]= useState(false);
  const [publishingId, setPubId]          = useState(null);
  const [isPublishingProgram, setPubProg] = useState(false);
  const [isProjectionActive, setProjActive] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isSuper = currentUser?.is_super_admin;

  const load = async () => {
    setLoading(true);
    try { const { data } = await getAnnouncements(); setAnnouncements(Array.isArray(data)?data:[]); }
    catch { setAnnouncements([]); }
    setLoading(false);
  };

  useEffect(() => { 
    load(); 
    const hbTimer = setInterval(() => {
      const hb = parseInt(localStorage.getItem("projection_heartbeat") || "0", 10);
      setProjActive(Date.now() - hb < 4000);
    }, 1000);
    return () => clearInterval(hbTimer);
  }, []);

  const handleSave = async e => {
    e.preventDefault();
    try {
      if (form.id) await updateAnnouncement(form.id, form);
      else await createAnnouncement(form);
      setForm(null); load();
    } catch { alert("Error al guardar el aviso."); }
  };

  const handleDelete    = async id => { if (!window.confirm("¿Eliminar este anuncio?")) return; try { await deleteAnnouncement(id); load(); } catch (err) { console.error("Error deleting announcement:", err); } };
  const handlePublish   = async id => { 
    setPubId(id); 
    try { 
      await publishAnnouncement(id); 
      if (id === 0) localStorage.setItem("projection_payload", JSON.stringify({ type: "announcement", data: null, _t: Date.now() }));
      else {
        // optimistically update localStorage for instant local projection
        const a = announcements.find(x => x.id === id);
        if (a) localStorage.setItem("projection_payload", JSON.stringify({ type: "announcement", data: a, _t: Date.now() }));
      }
      await load(); 
    } catch (err) { console.error("Error publishing:", err); } 
    setPubId(null); 
  };
  const handleProgram   = async () => { 
    setPubProg(true); 
    try { 
      await publishWeeklyProgram(weekToPublish); 
      // fetch schedule for local projection sync
      const scheduleRes = await getSchedule(weekToPublish);
      localStorage.setItem("projection_payload", JSON.stringify({ 
        type: "weekly_program", 
        data: scheduleRes.data, 
        week_start: weekToPublish, 
        _t: Date.now() 
      }));
      await load(); 
      setSelectedIds([]); 
    } catch (err) { 
      console.error("Error publishing program:", err); 
    } 
    setPubProg(false); 
  };
  const handlePlaylist  = async () => { if (!selectedIds.length) return; setPubPlay(true); try { await publishPlaylist(selectedIds); localStorage.setItem("projection_force_reload", Date.now()); await load(); } catch (err) { console.error("Error publishing playlist:", err); } setPubPlay(false); };
  const toggleSelect    = id => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i!==id) : [...prev, id]);

  const activePubId = Array.isArray(announcements) ? announcements.find(a => a.is_published)?.id : null;

  return (
    <div className={s.page}>
      <PageHeader title="Anuncios y Control de Pantallas" subtitle="Empuja anuncios y el programa semanal hacia los proyectores del templo.">
        <div style={{ display:"flex", gap:8 }}>
          <Button variant="outlined" startIcon={<DesktopWindows />} onClick={() => window.open("/projection", "Proyeccion", "width=1280,height=720,menubar=no,toolbar=no,location=no,status=no")}>
            Proyección Local (Ventana)
          </Button>
          <Button variant="contained" startIcon={<AddCircle />} onClick={() => setForm({ title:"", content:"", is_active:true })}>
            Nuevo Anuncio
          </Button>
        </div>
      </PageHeader>

      {/* Estado de transmisión */}
      <div style={{
        display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12,
        padding:"16px 20px", borderRadius:10, marginBottom:20, border:"1px solid",
        background: activePubId ? "#fef2f2" : "#f9fafb",
        borderColor: activePubId ? "#fca5a5" : "var(--border)"
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {activePubId
            ? <LiveTv sx={{ color:"var(--color-error)", animation:"pulse 1.5s infinite" }} />
            : <StopCircle sx={{ color:"var(--text-disabled)" }} />}
          <span style={{ fontWeight:800, fontSize:14, color:activePubId?"var(--color-error)":"var(--text-secondary)" }}>
            {activePubId ? "TRANSMITIENDO OFICIO EN VIVO AL TEMPLO" : "Proyector descansando (pantalla oscurecida)"}
          </span>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          <TextField type="date" size="small" value={weekToPublish} onChange={e => setWeekToPublish(e.target.value)} sx={{ bgcolor:"white", borderRadius:1, width:160 }} />
          <Button variant="contained" color="warning" startIcon={<CalendarMonth />} onClick={handleProgram} disabled={!isProjectionActive || isPublishingProgram}>Proyectar Privilegios</Button>
          <Button variant="contained" color="success" startIcon={<LiveTv />} onClick={handlePlaylist} disabled={!isProjectionActive || isPublishingPlaylist||!selectedIds.length} sx={{ fontWeight:800 }}>
            Lanzar Selección ({selectedIds.length})
          </Button>
          <Button variant="contained" color="error" startIcon={<StopCircle />} onClick={() => handlePublish(0)}>Cortar Todo</Button>
        </div>
      </div>

      {/* Tabla */}
      <TableContainer component={Paper} elevation={0} sx={{ border:"1px solid var(--border)", borderRadius:"10px" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" align="center">
                <Checkbox
                  indeterminate={selectedIds.length>0&&selectedIds.length<announcements.length}
                  checked={announcements.length>0&&selectedIds.length===announcements.length}
                  onChange={e => { if (e.target.checked) setSelectedIds(announcements.map(a => a.id)); else setSelectedIds([]); }}
                />
              </TableCell>
              <TableCell sx={{ width:"25%" }}>Título</TableCell>
              <TableCell sx={{ width:"40%" }}>Contenido</TableCell>
              <TableCell align="center" sx={{ width:"15%" }}>Estado</TableCell>
              <TableCell align="right" sx={{ width:"20%" }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py:5, color:"text.secondary" }}>Cargando anuncios...</TableCell></TableRow>
            ) : announcements.length === 0 ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py:5, color:"text.secondary" }}>Sin anuncios vigentes.</TableCell></TableRow>
            ) : announcements.map(a => (
              <TableRow key={a.id} sx={{ bgcolor:a.is_published?"#eff6ff":"inherit" }}>
                <TableCell padding="checkbox" align="center">
                  <Checkbox checked={selectedIds.includes(a.id)} onChange={() => toggleSelect(a.id)} />
                </TableCell>
                <TableCell sx={{ fontWeight:800 }}>{a.title}</TableCell>
                <TableCell sx={{ color:"text.secondary", whiteSpace:"pre-wrap", fontSize:13 }}>{a.content}</TableCell>
                <TableCell align="center">
                  {a.is_published
                    ? <Badge variant="error">🔴 VIVO</Badge>
                    : <Badge variant="ghost">Pendiente</Badge>}
                </TableCell>
                <TableCell align="right">
                  <div style={{ display:"flex", gap:4, justifyContent:"flex-end" }}>
                    {!a.is_published && (
                      <Button size="small" variant="outlined" color="success" startIcon={<LiveTv />}
                        onClick={() => handlePublish(a.id)} disabled={!isProjectionActive || publishingId===a.id}>
                        Lanzar
                      </Button>
                    )}
                    {isSuper && <IconButton color="primary" size="small" onClick={() => setForm(a)}><Edit fontSize="small" /></IconButton>}
                    {isSuper && <IconButton color="error" size="small" onClick={() => handleDelete(a.id)}><Delete fontSize="small" /></IconButton>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Form Dialog */}
      <Dialog open={Boolean(form)} onClose={() => setForm(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight:800 }}>{form?.id ? "Modificar Anuncio" : "Nuevo Anuncio"}</DialogTitle>
        <form onSubmit={handleSave}>
          <DialogContent sx={{ display:"flex", flexDirection:"column", gap:2.5, mt:1 }}>
            <TextField required label="Título" value={form?.title||""} onChange={e => setForm({...form, title:e.target.value})} fullWidth />
            <TextField required label="Contenido del Anuncio" multiline rows={4} value={form?.content||""} onChange={e => setForm({...form, content:e.target.value})} fullWidth />
          </DialogContent>
          <DialogActions sx={{ p:3, pt:0 }}>
            <Button onClick={() => setForm(null)} color="inherit">Cancelar</Button>
            <Button type="submit" variant="contained">Guardar</Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}
