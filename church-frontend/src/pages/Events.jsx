/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import { useState, useEffect, useCallback } from "react";
import { getEvents, getEventsSummary, createEvent, updateEvent, deleteEvent } from "../api/events";
import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl, IconButton, Switch, FormControlLabel,
  ButtonGroup, Paper
} from "@mui/material";
import {
  Event as EventIcon, List as ListIcon, CalendarMonth, AddAlarm,
  Edit, Delete, LocationOn, AccessTime, ChevronLeft, ChevronRight, Visibility
} from "@mui/icons-material";
import ConfirmDialog from "../components/ConfirmDialog";
import { Card, CardHeader, CardBody } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { PageHeader } from "../components/ui/PageHeader";
import s from "../styles/page.module.css";

const MONTHS      = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAYS        = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const EVENT_TYPES = ["Culto","Reunión","Conferencia","Especial","Aniversario","Retiro","General"];
const STATUS_LIST = ["Programado","En Curso","Completado","Cancelado"];

const TYPE_COLOR_MAP = { Culto:"#16a34a", Reunión:"#0369a1", Conferencia:"#7c3aed", Especial:"#d97706", Aniversario:"#dc2626", Retiro:"#1e3a8a", General:"#6b7280" };
const STATUS_BADGE   = { Programado:"info", "En Curso":"success", Completado:"default", Cancelado:"error" };
const TYPE_BADGE     = { Culto:"success", Reunión:"info", Conferencia:"primary", Especial:"warning", Aniversario:"error", Retiro:"primary", General:"ghost" };

const emptyForm = { title:"", description:"", location:"", event_type:"Culto", status:"Programado", start_datetime:"", end_datetime:"", all_day:false };

const toLocalInput  = iso => iso ? iso.slice(0,16) : "";
const fmtTime       = iso => iso ? new Date(iso).toLocaleTimeString("es-GT",{hour:"2-digit",minute:"2-digit"}) : "";
const fmtDateShort  = iso => iso ? new Date(iso).toLocaleDateString("es-GT",{day:"numeric",month:"short"}) : "";
const fmtDateLong   = iso => iso ? new Date(iso).toLocaleDateString("es-GT",{weekday:"long",day:"numeric",month:"long",year:"numeric"}) : "";
const sameDay       = (a,b) => a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();

const EVENT_SUMMARY_STATS = (sum) => [
  { label:"Próximos (Total)", value: sum.proximos,   color:"var(--color-primary)" },
  { label:"Programados",       value: sum.programados, color:"var(--color-info)" },
  { label:"Realizados",        value: sum.completados, color:"var(--color-success)" },
  { label:"Cancelados",        value: sum.cancelados,  color:"var(--color-error)" },
];

export default function Events() {
  const today = new Date();
  const [viewMode, setViewMode]       = useState("calendar");
  const [calMonth, setCalMonth]       = useState(today.getMonth());
  const [calYear, setCalYear]         = useState(today.getFullYear());
  const [events, setEvents]           = useState([]);
  const [summary, setSummary]         = useState({ total:0, programados:0, completados:0, cancelados:0, proximos:0 });
  const [showForm, setShowForm]       = useState(false);
  const [editing, setEditing]         = useState(null);
  const [form, setForm]               = useState(emptyForm);
  const [selected, setSelected]       = useState(null);
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(true);
  const [filterType, setFilterType]   = useState("Todos");
  
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: "", content: "", onConfirm: () => {} });

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isSuper = currentUser?.is_super_admin;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [evRes, sumRes] = await Promise.all([getEvents(calMonth+1, calYear), getEventsSummary()]);
      setEvents(evRes.data); setSummary(sumRes.data); setError("");
    } catch { setError("Error al cargar los eventos"); }
    finally { setLoading(false); }
  }, [calMonth, calYear]);

  useEffect(() => { load(); }, [load]);

  const changeMonth = (diff) => {
    let m = calMonth + diff, y = calYear;
    if (m > 11) { m = 0; y++; } else if (m < 0) { m = 11; y--; }
    setCalMonth(m); setCalYear(y);
  };

  const filteredEvents = filterType === "Todos" ? events : events.filter(e => e.event_type === filterType);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        start_datetime: form.start_datetime ? new Date(form.start_datetime).toISOString() : null,
        end_datetime:   form.end_datetime   ? new Date(form.end_datetime).toISOString()   : null,
      };
      if (editing) await updateEvent(editing.id, payload);
      else         await createEvent(payload);
      setShowForm(false); setEditing(null); setForm(emptyForm); load();
    } catch (err) { setError(err.response?.data?.detail || "Error al guardar el evento."); }
  };

  const openForm = (ev = null, initialDate = null) => {
    if (ev) {
      setEditing(ev);
      setForm({ title:ev.title, description:ev.description||"", location:ev.location||"", event_type:ev.event_type, status:ev.status, all_day:ev.all_day,
        start_datetime: ev.start_datetime ? toLocalInput(ev.start_datetime) : "",
        end_datetime:   ev.end_datetime   ? toLocalInput(ev.end_datetime)   : "" });
    } else {
      setEditing(null);
      let ds = "";
      if (initialDate) { initialDate.setHours(10,0,0,0); ds = toLocalInput(initialDate.toISOString()); }
      setForm({ ...emptyForm, start_datetime: ds });
    }
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setConfirmConfig({
      title: "¿Eliminar evento?",
      content: "¿Estás seguro de que deseas eliminar este evento definitivamente? Esta acción no se puede deshacer.",
      onConfirm: async () => {
        try { await deleteEvent(id); setSelected(null); load(); }
        catch { setError("Error al eliminar evento"); }
        finally { setConfirmOpen(false); }
      }
    });
    setConfirmOpen(true);
  };

  /* ── Calendar ── */
  const renderCalendar = () => {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth+1, 0).getDate();
    const rows = []; let cells = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`e-${i}`} style={{ minHeight:96, background:"#f9fafb", border:"1px solid var(--border)" }} />);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const cur = new Date(calYear, calMonth, d);
      const isToday = sameDay(cur, today);
      const dayEvts = filteredEvents.filter(ev => ev.start_datetime && sameDay(new Date(ev.start_datetime), cur));
      cells.push(
        <div key={d} onClick={() => openForm(null, cur)}
          style={{ minHeight:96, border:"1px solid var(--border)", padding:"6px 8px",
            background: isToday ? "var(--color-primary-light)" : "#fff",
            cursor:"pointer", transition:"background 0.15s" }}
          onMouseOver={e => { if (!isToday) e.currentTarget.style.background="#f9fafb"; }}
          onMouseOut={e  => { if (!isToday) e.currentTarget.style.background="#fff"; }}
        >
          <span style={{ fontSize:12, fontWeight: isToday ? 800 : 500, color: isToday ? "var(--color-primary)" : "var(--text-primary)" }}>{d}</span>
          <div style={{ display:"flex", flexDirection:"column", gap:2, marginTop:3 }}>
            {dayEvts.map(ev => (
              <div key={ev.id} onClick={e => { e.stopPropagation(); setSelected(ev); }}
                style={{ background: TYPE_COLOR_MAP[ev.event_type]||"#6b7280", color:"#fff",
                  padding:"2px 6px", borderRadius:4, fontSize:10, fontWeight:600,
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {!ev.all_day && <span style={{ opacity:.8, marginRight:3 }}>{fmtTime(ev.start_datetime)}</span>}
                {ev.title}
              </div>
            ))}
          </div>
        </div>
      );
      if (cells.length === 7) {
        rows.push(<div key={d} style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)" }}>{cells}</div>);
        cells = [];
      }
    }
    if (cells.length > 0) {
      while (cells.length < 7) cells.push(<div key={`ee-${cells.length}`} style={{ minHeight:96, background:"#f9fafb", border:"1px solid var(--border)" }} />);
      rows.push(<div key="last" style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)" }}>{cells}</div>);
    }
    return (
      <Paper elevation={0} variant="outlined" sx={{ overflow:"hidden", borderRadius:"10px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", background:"#f9fafb", borderBottom:"1px solid var(--border)" }}>
          {DAYS.map(day => <div key={day} style={{ textAlign:"center", padding:"10px 4px", fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase" }}>{day}</div>)}
        </div>
        {rows}
      </Paper>
    );
  };

  /* ── List ── */
  const renderList = () => {
    if (loading) return <div className={s.empty}><p className={s.emptyText}>Cargando eventos...</p></div>;
    if (filteredEvents.length === 0) return (
      <div className={s.empty}>
        <p className={s.emptyTitle}>No hay eventos para mostrar este mes.</p>
      </div>
    );
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {filteredEvents.map(ev => (
          <Card key={ev.id} style={{ display:"flex", borderLeft:`4px solid ${TYPE_COLOR_MAP[ev.event_type]||"#6b7280"}` }}>
            <CardBody style={{ flex:1 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                <p style={{ fontWeight:700, fontSize:14, color:"var(--text-primary)", margin:0 }}>{ev.title}</p>
                <Badge variant={STATUS_BADGE[ev.status]||"default"}>{ev.status}</Badge>
              </div>
              <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginBottom:6 }}>
                <span style={{ fontSize:12, color:"var(--text-secondary)", display:"flex", alignItems:"center", gap:4 }}>
                  <AccessTime sx={{ fontSize:13 }} />
                  {ev.all_day ? "Todo el día" : `${fmtDateShort(ev.start_datetime)} — ${fmtTime(ev.start_datetime)}`}
                </span>
                <span style={{ fontSize:12, color:"var(--text-secondary)", display:"flex", alignItems:"center", gap:4 }}>
                  <LocationOn sx={{ fontSize:13 }} /> {ev.location || "Sede Principal"}
                </span>
                <Badge variant={TYPE_BADGE[ev.event_type]||"ghost"} size="sm">{ev.event_type}</Badge>
              </div>
              {ev.description && <p style={{ fontSize:12, color:"var(--text-muted)", margin:0 }}>{ev.description}</p>}
            </CardBody>
            <div style={{ display:"flex", flexDirection:"column", justifyContent:"center", gap:6, padding:"12px 16px", borderLeft:"1px solid var(--border)" }}>
              <Button size="small" startIcon={<Visibility sx={{ fontSize:13 }} />} onClick={() => setSelected(ev)}>Ver</Button>
              {isSuper && (
                <>
                  <Button size="small" color="primary" startIcon={<Edit sx={{ fontSize:13 }} />} onClick={() => openForm(ev)}>Editar</Button>
                  <Button size="small" color="error" startIcon={<Delete sx={{ fontSize:13 }} />} onClick={() => handleDelete(ev.id)}>Borrar</Button>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className={s.page}>
      <PageHeader title="Calendario y Eventos" subtitle="Planifica servicios, actividades, retiros y conferencias del ministerio.">
        <Button variant="contained" disableElevation sx={{ bgcolor:"#0F172A", textTransform:"none", fontWeight:600, '&:hover':{bgcolor:"#1E293B"} }} size="small" startIcon={<AddAlarm />} onClick={() => openForm()}>Nuevo Evento</Button>
      </PageHeader>

      {error && !showForm && <div className={s.errorText}>{error}</div>}

      {/* Summary */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px,1fr))", gap:16, marginBottom:20 }}>
        {EVENT_SUMMARY_STATS(summary).map((st, i) => (
          <Card key={i} style={{ borderBottom:`3px solid ${st.color}`, textAlign:"center" }}>
            <CardBody>
              <div style={{ fontSize:32, fontWeight:800, color:"var(--text-primary)", lineHeight:1 }}>{st.value}</div>
              <div style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.06em", marginTop:6 }}>{st.label}</div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Navigation + filter bar */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12, marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <ButtonGroup variant="outlined" size="small">
            <IconButton size="small" onClick={() => changeMonth(-1)}><ChevronLeft /></IconButton>
            <Button onClick={() => { setCalMonth(today.getMonth()); setCalYear(today.getFullYear()); }} sx={{ fontWeight:600, px:2 }}>Hoy</Button>
            <IconButton size="small" onClick={() => changeMonth(1)}><ChevronRight /></IconButton>
          </ButtonGroup>
          <span style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)" }}>{MONTHS[calMonth]} {calYear}</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <FormControl size="small" sx={{ minWidth:150 }}>
            <Select value={filterType} onChange={e => setFilterType(e.target.value)}>
              <MenuItem value="Todos">Todos los tipos</MenuItem>
              {EVENT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </FormControl>
          <ButtonGroup variant="outlined" size="small">
            <Button onClick={() => setViewMode("calendar")} variant={viewMode==="calendar"?"contained":"outlined"}><CalendarMonth /></Button>
            <Button onClick={() => setViewMode("list")} variant={viewMode==="list"?"contained":"outlined"}><ListIcon /></Button>
          </ButtonGroup>
        </div>
      </div>

      {viewMode === "calendar" ? renderCalendar() : renderList()}

      {/* Form Dialog */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight:800 }}>{editing ? "Editar Evento" : "Programa Evento"}</DialogTitle>
          <DialogContent dividers sx={{ display:"flex", flexDirection:"column", gap:2 }}>
            {error && <div className={s.errorText}>{error}</div>}
            <input name="title" placeholder="Título del evento *" value={form.title}
              onChange={e => setForm({...form, title:e.target.value})} required
              style={{ padding:"10px 12px", border:"1px solid var(--border)", borderRadius:6, fontFamily:"var(--font)", fontSize:13, width:"100%", outline:"none" }} />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <FormControl fullWidth size="small">
                <Select value={form.event_type} onChange={e => setForm({...form, event_type:e.target.value})}>
                  {EVENT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <Select value={form.status} onChange={e => setForm({...form, status:e.target.value})}>
                  {STATUS_LIST.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
            </div>
            <FormControlLabel
              control={<Switch checked={form.all_day} onChange={e => setForm({...form, all_day:e.target.checked})} color="primary" />}
              label={<span style={{ fontSize:13, fontWeight:600 }}>Todo el día (sin hora específica)</span>}
            />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <input type={form.all_day?"date":"datetime-local"} value={form.start_datetime}
                onChange={e => setForm({...form, start_datetime:e.target.value})} required
                style={{ padding:"10px 12px", border:"1px solid var(--border)", borderRadius:6, fontFamily:"var(--font)", fontSize:13 }} />
              <input type={form.all_day?"date":"datetime-local"} value={form.end_datetime}
                onChange={e => setForm({...form, end_datetime:e.target.value})}
                style={{ padding:"10px 12px", border:"1px solid var(--border)", borderRadius:6, fontFamily:"var(--font)", fontSize:13 }} />
            </div>
            <input name="location" placeholder="Ubicación" value={form.location}
              onChange={e => setForm({...form, location:e.target.value})}
              style={{ padding:"10px 12px", border:"1px solid var(--border)", borderRadius:6, fontFamily:"var(--font)", fontSize:13, width:"100%" }} />
            <textarea name="description" placeholder="Descripción / Agenda" value={form.description}
              onChange={e => setForm({...form, description:e.target.value})} rows={3}
              style={{ padding:"10px 12px", border:"1px solid var(--border)", borderRadius:6, fontFamily:"var(--font)", fontSize:13, width:"100%", resize:"vertical" }} />
          </DialogContent>
          <DialogActions sx={{ px:3, py:2 }}>
            <Button onClick={() => setShowForm(false)} color="inherit">Cancelar</Button>
            <Button type="submit" variant="contained" disableElevation sx={{ bgcolor:"#0F172A", textTransform:"none", fontWeight:600, '&:hover':{bgcolor:"#1E293B"} }}>Guardar Evento</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        {selected && (
          <>
            <DialogTitle sx={{ fontWeight:800 }}>{selected.title}</DialogTitle>
            <DialogContent dividers>
              <div style={{ display:"flex", gap:8, marginBottom:16 }}>
                <Badge variant={STATUS_BADGE[selected.status]||"default"}>{selected.status}</Badge>
                <Badge variant={TYPE_BADGE[selected.event_type]||"ghost"}>{selected.event_type}</Badge>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div>
                  <p style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", margin:"0 0 4px" }}>Cuándo</p>
                  <p style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)", margin:0 }}>
                    {fmtDateLong(selected.start_datetime)} {selected.all_day ? "(Todo el día)" : `a las ${fmtTime(selected.start_datetime)}`}
                  </p>
                  {selected.end_datetime && !selected.all_day && (
                    <p style={{ fontSize:12, color:"var(--text-secondary)", margin:"2px 0 0" }}>
                      Termina: {fmtDateLong(selected.end_datetime)} {fmtTime(selected.end_datetime)}
                    </p>
                  )}
                </div>
                <div>
                  <p style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", margin:"0 0 4px" }}>Dónde</p>
                  <p style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)", margin:0 }}>{selected.location || "Instalaciones de la Iglesia"}</p>
                </div>
                {selected.description && (
                  <div>
                    <p style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", margin:"0 0 4px" }}>Detalles</p>
                    <p style={{ fontSize:13, color:"var(--text-secondary)", margin:0, whiteSpace:"pre-wrap" }}>{selected.description}</p>
                  </div>
                )}
              </div>
            </DialogContent>
            <DialogActions sx={{ px:3, py:2 }}>
              {isSuper && (
                <>
                  <Button color="error" startIcon={<Delete />} onClick={() => handleDelete(selected.id)} sx={{ mr:"auto" }}>Eliminar</Button>
                  <Button variant="outlined" startIcon={<Edit />} onClick={() => { setSelected(null); openForm(selected); }}>Editar</Button>
                </>
              )}
              <Button onClick={() => setSelected(null)} variant="contained" disableElevation sx={{ bgcolor:"#0F172A", textTransform:"none", fontWeight:600, '&:hover':{bgcolor:"#1E293B"} }}>Cerrar</Button>
            </DialogActions>
          </>
        )}
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