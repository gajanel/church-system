import { useState, useEffect } from "react";
import {
  getAllProfiles, addMemberPrivilege, removeMemberPrivilege,
  getSchedule, autoGenerateSchedule, updateScheduleEntry, deleteSchedule,
  getPrivilegeCatalog, getPrivilegeTypes, createPrivilegeType, updatePrivilegeType, deletePrivilegeType,
  getServiceDaysConfig, updateServiceDayConfig
} from "../api/privileges";
import {
  Button, TextField, Tabs, Tab, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Select, MenuItem, InputAdornment,
  Tooltip, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Switch, FormControlLabel, Divider
} from "@mui/material";
import {
  AdminPanelSettings, EventNote, Search, AutoFixHigh, Print, DeleteSweep,
  CheckCircle, RadioButtonUnchecked, Settings, AddCircle, Edit, Delete
} from "@mui/icons-material";
import { Card, CardBody } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { PageHeader } from "../components/ui/PageHeader";
import ConfirmDialog from "../components/ConfirmDialog";
import s from "../styles/page.module.css";

const DAYS = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
const CAT_BADGE = { General:"info", Liderazgo:"warning", Música:"primary", Predicación:"success", Otros:"ghost" };

const getCatColor = cat => ({ General:"info", Liderazgo:"warning", Música:"secondary", Predicación:"success", Otros:"default" }[cat] || "default");

const toMonday = d => { const dt = new Date(d); const day = dt.getDay(); const diff = day===0?-6:1-day; dt.setDate(dt.getDate()+diff); return dt.toISOString().split("T")[0]; };
const weekLabel = monday => { if (!monday) return ""; const s = new Date(monday+"T12:00:00"); const e = new Date(monday+"T12:00:00"); e.setDate(e.getDate()+6); return `${s.toLocaleDateString("es-GT",{day:"numeric",month:"short"})} – ${e.toLocaleDateString("es-GT",{day:"numeric",month:"short",year:"numeric"})}`; };
const todayMonday = toMonday(new Date().toISOString().split("T")[0]);

// ── TAB 1: Perfiles ────────────────────────────────────────────
function TabProfiles({ members, categories }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [search, setSearch]     = useState("");

  const allPrivileges = Object.values(categories).flat();
  const privCatMap = {};
  Object.entries(categories).forEach(([cat, privs]) => privs.forEach(p => { privCatMap[p] = cat; }));

  const load = async () => { setLoading(true); try { const r = await getAllProfiles(); setProfiles(r.data); } catch (err) { console.error("Error loading profiles:", err); } setLoading(false); };
  useEffect(() => { load(); }, []);

  const profileMap = {};
  profiles.forEach(p => { profileMap[p.member_id] = p.privileges; });

  const toggle = async (memberId, privilege, has) => {
    try {
      if (has) await removeMemberPrivilege(memberId, privilege);
      else await addMemberPrivilege({ member_id:memberId, privilege });
      load();
    } catch (err) { console.error("Error toggling privilege:", err); }
  };

  const filtered = members.filter(m => `${m.first_name} ${m.last_name}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <Card style={{ marginBottom:20 }}>
        <CardBody style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 }}>
          <div>
            <p style={{ fontWeight:700, fontSize:14, margin:"0 0 4px" }}>Asignación de Capacidades por Miembro</p>
            <p style={{ fontSize:12, color:"var(--text-secondary)", margin:0 }}>Activa o desactiva los privilegios de cada miembro.</p>
          </div>
          <TextField size="small" placeholder="Buscar miembro..." value={search} onChange={e => setSearch(e.target.value)}
            InputProps={{ startAdornment:<InputAdornment position="start"><Search /></InputAdornment> }} sx={{ minWidth:260 }} />
        </CardBody>
      </Card>

      <div className={s.badgeRow} style={{ marginBottom:16 }}>
        {Object.entries(categories).map(([cat, privs]) => (
          <Badge key={cat} variant={CAT_BADGE[cat]||"ghost"}>{cat}: {privs.join(", ")}</Badge>
        ))}
      </div>

      {loading ? (
        <div className={s.empty}><p className={s.emptyText}>Levantando perfiles...</p></div>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border:"1px solid var(--border)", borderRadius:"10px", overflowX:"auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Miembro Habilitado</TableCell>
                {Object.entries(categories).map(([cat, privs]) =>
                  privs.map(p => (
                    <TableCell key={p} align="center">
                      <div style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", color:`var(--color-${CAT_BADGE[cat]||"primary"})`, lineHeight:1.2 }}>{cat}</div>
                      <div style={{ fontSize:11, fontWeight:600, color:"var(--text-primary)" }}>{p}</div>
                    </TableCell>
                  ))
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={allPrivileges.length+1} align="center">No se encontraron miembros</TableCell></TableRow>
              ) : filtered.map(m => {
                const myPrivs = profileMap[m.id] || [];
                return (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div style={{ fontWeight:700, fontSize:13 }}>{m.first_name} {m.last_name}</div>
                      <div style={{ fontSize:11, color:"var(--text-muted)" }}>Habilitado para {myPrivs.length} tareas</div>
                    </TableCell>
                    {allPrivileges.map(priv => {
                      const has = myPrivs.includes(priv);
                      const cat = privCatMap[priv];
                      const mColor = getCatColor(cat);
                      return (
                        <TableCell key={priv} align="center">
                          <Tooltip title={has ? `Quitar ${priv}` : `Autorizar ${priv}`}>
                            <IconButton onClick={() => toggle(m.id, priv, has)} color={has?mColor:"default"}
                              sx={{ bgcolor:has?`${mColor}.50`:"transparent", "&:hover":{ bgcolor:has?`${mColor}.100`:"grey.100" } }}>
                              {has ? <CheckCircle /> : <RadioButtonUnchecked color="disabled" />}
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}

// ── TAB 2: Programa Semanal ────────────────────────────────────
function TabSchedule({ members, categories }) {
  const [weekStart, setWeekStart]       = useState(todayMonday);
  const [schedule, setSchedule]         = useState([]);
  const [loading, setLoading]           = useState(false);
  const [generating, setGenerating]     = useState(false);
  const [editCell, setEditCell]         = useState(null);
  const [selectedDays, setSelectedDays] = useState(DAYS);

  const allPrivileges = Object.values(categories).flat();
  const privCatMap = {};
  Object.entries(categories).forEach(([cat, privs]) => privs.forEach(p => { privCatMap[p] = cat; }));

  const toggleDay  = d => setSelectedDays(prev => prev.includes(d) ? prev.filter(x => x!==d) : [...prev, d]);
  const loadSched  = async (ws = weekStart) => { setLoading(true); try { const r = await getSchedule(ws); setSchedule(r.data); } catch { setSchedule([]); } setLoading(false); };
  useEffect(() => { loadSched(); }, [weekStart]);

  const weekNav = delta => { const dt = new Date(weekStart+"T12:00:00"); dt.setDate(dt.getDate()+delta*7); setWeekStart(dt.toISOString().split("T")[0]); };

  const handleAutoGenerate = async () => {
    if (!selectedDays.length) return;
    setGenerating(true);
    try { const r = await autoGenerateSchedule({ week_start:weekStart, days:selectedDays }); setSchedule(r.data); } catch (err) { console.error("Error generating schedule:", err); }
    setGenerating(false);
  };

  const handleClear = async () => {
    if (!window.confirm("¿Eliminar el programa de esta semana?")) return;
    await deleteSchedule(weekStart); setSchedule([]);
  };

  const handleManualChange = async (entry, newMemberId) => {
    try { await updateScheduleEntry(entry.id, parseInt(newMemberId)); await loadSched(); } catch (err) { console.error("Error updating entry:", err); }
    setEditCell(null);
  };

  const grid = {};
  DAYS.forEach(d => { grid[d] = {}; });
  schedule.forEach(entry => { if (grid[entry.day_name]) grid[entry.day_name][entry.privilege] = entry; });
  const hasSchedule = schedule.length > 0;

  const printSchedule = () => {
    const rows = DAYS.map(day =>
      `<tr><td style="font-weight:700;padding:8px 10px;border:1px solid #ccc;background:#ebebeb;">${day}</td>${allPrivileges.map(priv => { const entry = grid[day]?.[priv]; const name = entry?.member_name||(entry?.notes||"—"); return `<td style="padding:8px 10px;border:1px solid #ccc;">${name}</td>`; }).join("")}</tr>`
    ).join("");
    const catHeaders = Object.entries(categories).map(([cat, privs]) =>
      privs.map(p => `<th style="padding:8px 10px;border:1px solid #ccc;background:#e2e8f0;font-size:11px;">${cat}<br/><span style="font-weight:600">${p}</span></th>`).join("")
    ).join("");
    const win = window.open("", "_blank");
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Programa Semanal</title><style>body{font-family:Arial,sans-serif;padding:24px;font-size:13px;}table{width:100%;border-collapse:collapse;}th{background:#f1f5f9;padding:8px 10px;border:1px solid #ccc;text-align:center;}</style></head><body><h2>Programa Semanal de Privilegios</h2><p>Semana: ${weekLabel(weekStart)}</p><table><thead><tr><th style="padding:8px;border:1px solid #ccc;">Día</th>${catHeaders}</tr></thead><tbody>${rows}</tbody></table></body></html>`);
    win.document.close(); win.focus(); setTimeout(() => win.print(), 300);
  };

  return (
    <div>
      <Card style={{ marginBottom:20 }}>
        <CardBody style={{ display:"flex", alignItems:"center", flexWrap:"wrap", gap:16 }}>
          <Button variant="outlined" onClick={() => weekNav(-1)}>← Semana Anterior</Button>
          <div style={{ flex:1, textAlign:"center" }}>
            <p style={{ fontWeight:800, fontSize:15, margin:"0 0 2px" }}>Corte del {weekLabel(weekStart)}</p>
            <p style={{ fontSize:11, color:"var(--text-muted)", margin:0 }}>Lunes virtual: {weekStart}</p>
          </div>
          <Button variant="outlined" onClick={() => weekNav(1)}>Semana Siguiente →</Button>
        </CardBody>
      </Card>

      <div style={{ background:"#f9fafb", border:"1px solid var(--border)", borderRadius:10, padding:"12px 16px", marginBottom:16, display:"flex", alignItems:"center", flexWrap:"wrap", gap:16 }}>
        <p style={{ fontWeight:700, fontSize:13, margin:0 }}>Días activos de servicio:</p>
        <div className={s.badgeRow}>
          {DAYS.map(d => (
            <button key={d} onClick={() => toggleDay(d)}
              style={{ padding:"4px 12px", border:"1px solid", borderRadius:99, fontSize:12, fontWeight:600, cursor:"pointer",
                borderColor: selectedDays.includes(d)?"var(--color-primary)":"var(--border)",
                background:  selectedDays.includes(d)?"var(--color-primary)":"transparent",
                color:       selectedDays.includes(d)?"#fff":"var(--text-secondary)" }}>
              {d}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display:"flex", gap:12, marginBottom:16, flexWrap:"wrap" }}>
        <Button variant="contained" startIcon={<AutoFixHigh />} onClick={handleAutoGenerate} disabled={generating||!selectedDays.length}>
          {generating ? "Formulando..." : "Auto-Asignador"}
        </Button>
        {hasSchedule && (
          <>
            <Button variant="contained" color="secondary" startIcon={<Print />} onClick={printSchedule}>Imprimir</Button>
            <Button variant="contained" color="error" startIcon={<DeleteSweep />} onClick={handleClear}>Purgar Cronograma</Button>
          </>
        )}
      </div>

      {!hasSchedule && !loading && (
        <Alert severity="warning" sx={{ mb:2 }}>Semana vacía. Use el Auto-Asignador para inyectar automáticamente al personal disponible.</Alert>
      )}

      {loading ? (
        <div className={s.empty}><p className={s.emptyText}>Poblando la grilla ministerial...</p></div>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border:"1px solid var(--border)", borderRadius:"10px", overflowX:"auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Día</TableCell>
                {Object.entries(categories).map(([cat, privs]) =>
                  privs.map(priv => (
                    <TableCell key={priv} align="center">
                      <div style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", lineHeight:1.2 }}>{cat}</div>
                      <div style={{ fontSize:11, fontWeight:600 }}>{priv}</div>
                    </TableCell>
                  ))
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {DAYS.map((day, di) => (
                <TableRow key={day} sx={{ bgcolor:di%2===0?"transparent":"grey.50" }}>
                  <TableCell>
                    <div style={{ fontWeight:800, fontSize:13 }}>{day}</div>
                    <div style={{ fontSize:11, color:"var(--text-muted)" }}>
                      {(() => { const di2 = {Lunes:0,Martes:1,"Miércoles":2,Jueves:3,Viernes:4,Sábado:5,Domingo:6}; const dt = new Date(weekStart+"T12:00:00"); dt.setDate(dt.getDate()+(di2[day]??0)); return dt.toLocaleDateString("es-GT",{day:"numeric",month:"short"}); })()}
                    </div>
                  </TableCell>
                  {allPrivileges.map(priv => {
                    const entry = grid[day]?.[priv];
                    const cat = privCatMap[priv];
                    const mColor = getCatColor(cat);
                    const isEditing = editCell?.entryId === entry?.id;
                    return (
                      <TableCell key={priv} align="center">
                        {!entry ? <span style={{ color:"var(--text-disabled)", fontSize:12 }}>—</span>
                        : isEditing ? (
                          <Select autoFocus size="small" sx={{ width:150, fontSize:13 }} defaultValue={entry.member_id||""} onChange={e => handleManualChange(entry, e.target.value)} onBlur={() => setEditCell(null)}>
                            <MenuItem value=""><em>Vacante</em></MenuItem>
                            {members.map(m => <MenuItem key={m.id} value={m.id}>{m.first_name} {m.last_name}</MenuItem>)}
                          </Select>
                        ) : (
                          <Button size="small" variant={entry.member_id?"outlined":"contained"} color={entry.member_id?mColor:"warning"}
                            onClick={() => setEditCell({ entryId:entry.id })}
                            sx={{ width:"100%", minWidth:100, textTransform:"none", fontWeight:700 }}>
                            {entry.member_name || "⚠ Vacío"}
                          </Button>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {hasSchedule && <Alert severity="info" sx={{ mt:2 }}>Toque a cualquier siervo directamente en la celda para reasignar manualmente.</Alert>}
    </div>
  );
}

// ── TAB 3: Catálogo ────────────────────────────────────────────
function TabSettings({ onUpdate }) {
  const [types, setTypes]             = useState([]);
  const [serviceDays, setServiceDays] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [showForm, setShowForm]       = useState(false);
  const [editing, setEditing]         = useState(null);
  const [form, setForm]               = useState({ name:"", category:"General", description:"", ignore_ministry_day:false });
  const [error, setError]             = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: "", content: "", onConfirm: () => {} });

  const load = async () => { setLoading(true); try { const [t,d] = await Promise.all([getPrivilegeTypes(), getServiceDaysConfig()]); setTypes(t.data); setServiceDays(d.data); } catch (err) { console.error("Error loading config:", err); } setLoading(false); };
  useEffect(() => { load(); }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      if (editing) await updatePrivilegeType(editing.id, form);
      else await createPrivilegeType(form);
      setShowForm(false); setEditing(null); setForm({ name:"", category:"General", description:"", ignore_ministry_day:false }); load(); onUpdate();
    } catch { setError("Error al guardar. Posible nombre duplicado."); }
  };

  const handleDelete = (id) => {
    setConfirmConfig({
      title: "¿Eliminar privilegio?",
      content: "¿Estás seguro de que deseas eliminar este privilegio del catálogo? Esta acción no se puede deshacer.",
      onConfirm: async () => {
        try { await deletePrivilegeType(id); load(); onUpdate(); } catch (err) { console.error("Error deleting privilege type:", err); }
        finally { setConfirmOpen(false); }
      }
    });
    setConfirmOpen(true);
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <p style={{ fontWeight:700, fontSize:15, margin:"0 0 4px" }}>Catálogo de Privilegios</p>
          <p style={{ fontSize:12, color:"var(--text-secondary)", margin:0 }}>Configura las áreas y tareas en las que los miembros pueden ser asignados.</p>
        </div>
        <Button variant="contained" startIcon={<AddCircle />}
          onClick={() => { setEditing(null); setForm({ name:"", category:"General", description:"", ignore_ministry_day:false }); setShowForm(true); }}>
          Nueva Tarea
        </Button>
      </div>

      {/* Días de servicio */}
      <Card style={{ marginBottom:24, background:"var(--color-primary-light)", borderColor:"var(--border-strong)" }}>
        <CardBody>
          <p style={{ fontWeight:800, fontSize:14, margin:"0 0 8px" }}>⚡ Configuración de días de participación</p>
          <p style={{ fontSize:12, color:"var(--text-secondary)", margin:"0 0 16px" }}>
            Los días marcados como <b>"General"</b> incluirán todos los ministerios. En los demás, solo el ministerio del día.
          </p>
          <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
            {serviceDays.map(d => (
              <div key={d.day_name} style={{ padding:"10px 16px", borderRadius:10, background:"#fff", border:`1px solid ${d.is_general?"var(--color-primary)":"var(--border)"}`, minWidth:140 }}>
                <p style={{ fontWeight:700, margin:"0 0 6px", fontSize:13 }}>{d.day_name}</p>
                <FormControlLabel
                  control={<Switch size="small" checked={d.is_general} onChange={() => { updateServiceDayConfig(d.day_name, !d.is_general).then(load); }} />}
                  label={<span style={{ fontSize:11 }}>{d.is_general?"General":"Restringido"}</span>}
                />
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {loading ? (
        <div className={s.empty}><p className={s.emptyText}>Cargando catálogo...</p></div>
      ) : types.length === 0 ? (
        <Alert severity="info">No hay privilegios configurados en el catálogo.</Alert>
      ) : (
        <div className={s.cardGrid}>
          {types.map(t => (
            <Card key={t.id} style={{ borderTop:`3px solid var(--color-${CAT_BADGE[t.category]||"primary"})` }}>
              <CardBody>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div>
                    <div className={s.badgeRow} style={{ marginBottom:8 }}>
                      <Badge variant={CAT_BADGE[t.category]||"ghost"}>{t.category}</Badge>
                      {t.ignore_ministry_day===1 && <Badge variant="info" size="sm">Día Libre</Badge>}
                    </div>
                    <p style={{ fontWeight:800, fontSize:15, margin:0 }}>{t.name}</p>
                    {t.description && <p style={{ fontSize:12, color:"var(--text-secondary)", margin:"4px 0 0" }}>{t.description}</p>}
                  </div>
                  <div style={{ display:"flex", gap:4 }}>
                    <IconButton size="small" color="primary" onClick={() => { setEditing(t); setForm({...t, ignore_ministry_day:!!t.ignore_ministry_day}); setShowForm(true); }}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(t.id)}><Delete fontSize="small" /></IconButton>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onClose={() => setShowForm(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight:800 }}>{editing ? "Editar Tarea" : "Nueva Tarea de Privilegio"}</DialogTitle>
          <DialogContent dividers sx={{ display:"flex", flexDirection:"column", gap:2 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="Nombre del Privilegio" fullWidth required value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="Ej: Proyección, Bienvenida..." />
            <FormControl fullWidth>
              <InputLabel>Categoría</InputLabel>
              <Select label="Categoría" value={form.category} onChange={e => setForm({...form, category:e.target.value})}>
                {["General","Liderazgo","Música","Predicación","Otros"].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Descripción (Opcional)" fullWidth multiline rows={2} value={form.description||""} onChange={e => setForm({...form, description:e.target.value})} />
            <Divider />
            <FormControlLabel
              control={<Switch checked={form.ignore_ministry_day} onChange={e => setForm({...form, ignore_ministry_day:e.target.checked})} />}
              label={<div><p style={{ fontWeight:700, fontSize:13, margin:0 }}>Ignorar restricción de ministerio</p><p style={{ fontSize:11, color:"var(--text-secondary)", margin:0 }}>Cualquier miembro puede participar el día que sea.</p></div>}
            />
          </DialogContent>
          <DialogActions sx={{ p:2 }}>
            <Button onClick={() => setShowForm(false)} color="inherit">Cancelar</Button>
            <Button type="submit" variant="contained">Guardar Tarea</Button>
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

// ── PÁGINA PRINCIPAL ────────────────────────────────────────────
export default function Privileges() {
  const [tab, setTab]         = useState(0);
  const [members, setMembers] = useState([]);
  const [categories, setCategories] = useState({});

  const loadData = async () => {
    try {
      const [mRes, cRes] = await Promise.all([import("../api/members").then(m => m.getMembers(1, 1000)), getPrivilegeCatalog()]);
      setMembers(mRes.data.items.filter(m => m.status==="active"));
      setCategories(cRes.data);
    } catch (err) { console.error("Error loading base data:", err); }
  };

  useEffect(() => { loadData(); }, []);

  return (
    <div className={s.page}>
      <PageHeader title="Asignación de Privilegios" subtitle="Gestione qué miembros pueden correr áreas técnicas y comande el organizador de turnos semanal." />
      <Paper sx={{ mb:3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} indicatorColor="primary" textColor="primary">
          <Tab icon={<AdminPanelSettings />} iconPosition="start" label="Acreditaciones Fijas" />
          <Tab icon={<EventNote />} iconPosition="start" label="Matriz Semanal" />
          <Tab icon={<Settings />} iconPosition="start" label="Configurar Catálogo" />
        </Tabs>
      </Paper>
      {tab === 0 && <TabProfiles members={members} categories={categories} />}
      {tab === 1 && <TabSchedule members={members} categories={categories} />}
      {tab === 2 && <TabSettings onUpdate={loadData} />}
    </div>
  );
}
