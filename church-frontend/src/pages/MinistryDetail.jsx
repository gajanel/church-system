import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Button, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, IconButton, Tooltip, Checkbox, LinearProgress,
  CircularProgress
} from "@mui/material";
import {
  ArrowBackOutlined, ReceiptLongOutlined, HowToRegOutlined,
  ViewKanbanOutlined, PhotoLibraryOutlined, AddOutlined,
  DeleteOutlined, CheckCircleOutlined, RadioButtonUncheckedOutlined,
  CloudUploadOutlined, EditOutlined
} from "@mui/icons-material";
import { API_URL } from "../api/api";
import {
  getModuleConfig,
  getMinistryFinance, createMinistryFinance, deleteMinistryFinance,
  getMinistryAttendance, createAttendanceSession,
  getMinistryPlans, createMinistryPlan, updateMinistryPlan, deleteMinistryPlan,
  addPlanTask, togglePlanTask, deletePlanTask,
  getMinistryGallery, uploadGalleryItem, deleteGalleryItem,
} from "../api/ministryWorkspace";
import { getMinistries } from "../api/ministries";
import { toSlug } from "./MinistryWorkspace";

import { PageHeader } from "../components/ui/PageHeader";
import { Badge } from "../components/ui/Badge";
import DataTable from "../components/ui/DataTable";
import { TableRow, TableCell } from "@mui/material";
import MonthlyReportTab from "./ministry/MonthlyReportTab";
import s from "../styles/page.module.css";

const FIN_CATS_INCOME  = ["Ofrenda","Diezmo","Donación","Actividad","Otro"];
const FIN_CATS_EXPENSE = ["Material","Transporte","Alimentación","Decoración","Servicios","Otro"];
const PLAN_STATUS      = ["active","completed","paused"];

export default function MinistryDetail() {
  const { ministrySlug } = useParams();
  const navigate           = useNavigate();
  const [mid, setMid]      = useState(null);   // resolved numeric ID

  const [tab, setTab]           = useState(0);
  const [config, setConfig]     = useState(null);
  const [ministry, setMinistry] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  // Finance
  const [finance, setFinance]   = useState([]);
  const [showFin, setShowFin]   = useState(false);
  const [finForm, setFinForm]   = useState({ type:"expense", category:"", amount:"", description:"", date: new Date().toISOString().split("T")[0] });

  // Attendance
  const [sessions, setSessions] = useState([]);
  const [showSess, setShowSess] = useState(false);
  const [sessForm, setSessForm] = useState({ title:"", date: new Date().toISOString().split("T")[0], notes:"" });

  // Plans
  const [plans, setPlans]       = useState([]);
  const [showPlan, setShowPlan] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [planForm, setPlanForm] = useState({ title:"", description:"", start_date:"", end_date:"", status:"active" });
  const [newTask, setNewTask]   = useState({ planId: null, title:"", assigned_to:"", due_date:"" });

  // Gallery
  const [gallery, setGallery]   = useState([]);
  const [uploading, setUploading] = useState(false);

  // Load — resolve slug first
  useEffect(() => { init(); }, [ministrySlug]);

  const init = async () => {
    setLoading(true);
    try {
      const minRes = await getMinistries();
      const found  = minRes.data.find(m => toSlug(m.name) === ministrySlug);
      if (!found) { setError("Ministerio no encontrado."); setLoading(false); return; }
      setMinistry(found);
      setMid(found.id);
      const cfgRes = await getModuleConfig(found.id);
      setConfig(cfgRes.data);
      await loadTab(0, cfgRes.data, found.id);
    } catch (e) { setError("Error al cargar workspace"); }
    finally { setLoading(false); }
  };

  const loadTab = async (t, cfg = config, resolvedMid = mid) => {
    if (!cfg || !resolvedMid) return;
    try {
      if (t === 0 && cfg.finance)    { const r = await getMinistryFinance(resolvedMid);    setFinance(r.data); }
      if (t === 1 && cfg.attendance) { const r = await getMinistryAttendance(resolvedMid); setSessions(r.data); }
      if (t === 2 && cfg.work_plans) { const r = await getMinistryPlans(resolvedMid);      setPlans(r.data); }
      if (t === 3 && cfg.gallery)    { const r = await getMinistryGallery(resolvedMid);    setGallery(r.data); }
    } catch {}
  };

  const handleTab = (_, v) => { setTab(v); loadTab(v); };

  // Finance
  const saveFin = async (e) => {
    e.preventDefault();
    await createMinistryFinance(mid, { ...finForm, amount: parseFloat(finForm.amount) });
    setShowFin(false); setFinForm({ type:"expense", category:"", amount:"", description:"", date: new Date().toISOString().split("T")[0] });
    loadTab(0);
  };
  const delFin = async (id) => { if (!confirm("¿Eliminar registro?")) return; await deleteMinistryFinance(mid, id); loadTab(0); };

  // Attendance
  const saveSess = async (e) => {
    e.preventDefault();
    await createAttendanceSession(mid, sessForm);
    setShowSess(false); setSessForm({ title:"", date: new Date().toISOString().split("T")[0], notes:"" });
    loadTab(1);
  };

  // Plans
  const savePlan = async (e) => {
    e.preventDefault();
    if (editPlan) await updateMinistryPlan(mid, editPlan.id, planForm);
    else await createMinistryPlan(mid, planForm);
    setShowPlan(false); setEditPlan(null); setPlanForm({ title:"", description:"", start_date:"", end_date:"", status:"active" });
    loadTab(2);
  };
  const openEditPlan = (p) => {
    setEditPlan(p);
    setPlanForm({ title: p.title, description: p.description||"", start_date: p.start_date||"", end_date: p.end_date||"", status: p.status });
    setShowPlan(true);
  };
  const delPlan = async (id) => { if (!confirm("¿Eliminar plan?")) return; await deleteMinistryPlan(mid, id); loadTab(2); };
  const handleToggleTask = async (planId, taskId) => { await togglePlanTask(mid, planId, taskId); loadTab(2); };
  const handleAddTask = async (planId) => {
    if (!newTask.title) return;
    await addPlanTask(mid, planId, { title: newTask.title, assigned_to: newTask.assigned_to, due_date: newTask.due_date });
    setNewTask({ planId: null, title:"", assigned_to:"", due_date:"" });
    loadTab(2);
  };
  const handleDelTask = async (planId, taskId) => { await deletePlanTask(mid, planId, taskId); loadTab(2); };

  // Gallery
  const handleUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("caption", "");
      fd.append("activity_date", new Date().toISOString().split("T")[0]);
      await uploadGalleryItem(mid, fd);
      loadTab(3);
    } catch { setError("Error al subir imagen"); }
    finally { setUploading(false); }
  };
  const delPhoto = async (id) => { if (!confirm("¿Eliminar foto?")) return; await deleteGalleryItem(mid, id); loadTab(3); };

  const totals = {
    income:  finance.filter(f => f.type === "income").reduce((a, b) => a + b.amount, 0),
    expense: finance.filter(f => f.type === "expense").reduce((a, b) => a + b.amount, 0),
  };

  if (loading) return <div className={s.page} style={{ display:"flex", justifyContent:"center", paddingTop:60 }}><CircularProgress size={28} /></div>;

  const TABS = [
    { label:"Finanzas",        key:"finance",        icon:<ReceiptLongOutlined sx={{ fontSize:15 }} /> },
    { label:"Asistencia",      key:"attendance",     icon:<HowToRegOutlined sx={{ fontSize:15 }} /> },
    { label:"Planes",          key:"work_plans",     icon:<ViewKanbanOutlined sx={{ fontSize:15 }} /> },
    { label:"Galería",         key:"gallery",        icon:<PhotoLibraryOutlined sx={{ fontSize:15 }} /> },
    { label:"Reporte Mensual", key:"monthly_report", icon:<ReceiptLongOutlined sx={{ fontSize:15 }} /> },
  ].filter(t => config?.[t.key]);

  return (
    <div className={s.page}>
      <PageHeader
        title={ministry?.name || "Ministerio"}
        subtitle={ministry?.service_day ? `Día de servicio: ${ministry.service_day}` : "Espacio de trabajo del ministerio"}
      >
        <Button size="small" variant="outlined" startIcon={<ArrowBackOutlined sx={{ fontSize:14 }} />}
          onClick={() => navigate("/ministry-workspace")}>
          Volver
        </Button>
      </PageHeader>

      {error && <div className={s.errorText}>{error}</div>}

      {/* Tabs */}
      <Tabs value={tab} onChange={handleTab} sx={{ mb: 2 }}>
        {TABS.map((t, i) => (
          <Tab key={t.key} label={<span style={{ display:"flex", alignItems:"center", gap:5 }}>{t.icon}{t.label}</span>} value={i} />
        ))}
      </Tabs>

      {/* ── FINANCE ── */}
      {TABS[tab]?.key === "finance" && (
        <div>
          {/* Summary row */}
          <div style={{ display:"flex", gap:12, marginBottom:14 }}>
            {[
              { label:"Ingresos", val: totals.income,  color:"var(--color-success)" },
              { label:"Gastos",   val: totals.expense, color:"var(--color-error)" },
              { label:"Balance",  val: totals.income - totals.expense, color: totals.income - totals.expense >= 0 ? "var(--color-success)" : "var(--color-error)" },
            ].map(c => (
              <div key={c.label} style={{ flex:1, background:"#fff", border:"1px solid var(--border)", borderRadius:4, padding:"10px 14px" }}>
                <div style={{ fontSize:11, color:"var(--text-muted)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>{c.label}</div>
                <div style={{ fontSize:20, fontWeight:700, color: c.color, marginTop:2 }}>Q {c.val.toLocaleString("es-GT", { minimumFractionDigits:2 })}</div>
              </div>
            ))}
          </div>
          <DataTable
            columns={[
              { label:"Fecha", width:"12%" }, { label:"Tipo", width:"10%" }, { label:"Categoría", width:"16%" },
              { label:"Descripción", width:"auto" }, { label:"Monto", width:"12%", align:"right" }, { label:"", width:"50px", align:"right" },
            ]}
            rows={finance} emptyText="Sin registros financieros."
            toolbarRight={[
              <Button key="add" size="small" variant="contained" startIcon={<AddOutlined sx={{ fontSize:14 }} />} onClick={() => setShowFin(true)}>Registrar</Button>
            ]}
            renderRow={(f) => (
              <TableRow key={f.id}>
                <TableCell sx={{ fontSize:12 }}>{f.date}</TableCell>
                <TableCell><Badge variant={f.type==="income"?"success":"error"} size="sm">{f.type==="income"?"Ingreso":"Gasto"}</Badge></TableCell>
                <TableCell sx={{ fontSize:12 }}>{f.category}</TableCell>
                <TableCell sx={{ fontSize:12, color:"text.secondary" }}>{f.description||"—"}</TableCell>
                <TableCell align="right" sx={{ fontWeight:700, fontSize:13, color: f.type==="income"?"var(--color-success)":"var(--color-error)" }}>
                  {f.type==="expense"?"-":"+"} Q{f.amount.toFixed(2)}
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" color="error" onClick={() => delFin(f.id)}><DeleteOutlined sx={{ fontSize:14 }} /></IconButton>
                </TableCell>
              </TableRow>
            )}
          />
          <Dialog open={showFin} onClose={() => setShowFin(false)} maxWidth="xs" fullWidth>
            <form onSubmit={saveFin}>
              <DialogTitle>Registrar movimiento</DialogTitle>
              <DialogContent dividers sx={{ display:"flex", flexDirection:"column", gap:2 }}>
                <TextField select label="Tipo" value={finForm.type} onChange={e => setFinForm({...finForm, type:e.target.value, category:""})} fullWidth>
                  <MenuItem value="income">Ingreso</MenuItem><MenuItem value="expense">Gasto</MenuItem>
                </TextField>
                <TextField select label="Categoría" value={finForm.category} onChange={e => setFinForm({...finForm, category:e.target.value})} required fullWidth>
                  {(finForm.type==="income" ? FIN_CATS_INCOME : FIN_CATS_EXPENSE).map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
                <TextField label="Monto (Q)" type="number" inputProps={{ step:"0.01", min:"0" }} value={finForm.amount} onChange={e => setFinForm({...finForm, amount:e.target.value})} required fullWidth />
                <TextField label="Descripción" value={finForm.description} onChange={e => setFinForm({...finForm, description:e.target.value})} fullWidth />
                <TextField label="Fecha" type="date" value={finForm.date} onChange={e => setFinForm({...finForm, date:e.target.value})} InputLabelProps={{ shrink:true }} fullWidth />
              </DialogContent>
              <DialogActions><Button onClick={() => setShowFin(false)}>Cancelar</Button><Button type="submit" variant="contained">Guardar</Button></DialogActions>
            </form>
          </Dialog>
        </div>
      )}

      {/* ── ATTENDANCE ── */}
      {TABS[tab]?.key === "attendance" && (
        <div>
          <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:12 }}>
            <Button size="small" variant="contained" startIcon={<AddOutlined sx={{ fontSize:14 }} />} onClick={() => setShowSess(true)}>Nueva Sesión</Button>
          </div>
          {sessions.length === 0 ? (
            <div className={s.empty}><p className={s.emptyTitle}>Sin sesiones registradas</p></div>
          ) : sessions.map(sess => (
            <div key={sess.id} style={{ background:"#fff", border:"1px solid var(--border)", borderRadius:4, marginBottom:10, overflow:"hidden" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 14px", background:"#FAFAFA", borderBottom:"1px solid var(--border)" }}>
                <div>
                  <span style={{ fontWeight:700, fontSize:13 }}>{sess.title}</span>
                  <span style={{ fontSize:11, color:"var(--text-muted)", marginLeft:10 }}>{sess.date}</span>
                  {sess.notes && <span style={{ fontSize:11, color:"var(--text-muted)", marginLeft:10 }}>{sess.notes}</span>}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <Badge variant="info" size="sm">{sess.records?.filter(r => r.present).length || 0} presentes</Badge>
                  <IconButton size="small" color="error" onClick={async () => { if (!confirm("¿Eliminar sesión?")) return; await deleteAttendanceSession(mid, sess.id); loadTab(1); }}>
                    <DeleteOutlined sx={{ fontSize:14 }} />
                  </IconButton>
                </div>
              </div>
              {sess.records?.length > 0 && (
                <div style={{ padding:"8px 14px", display:"flex", flexWrap:"wrap", gap:6 }}>
                  {sess.records.map(r => (
                    <Badge key={r.id} variant={r.present?"success":"default"} size="sm">{r.member_name}</Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
          <Dialog open={showSess} onClose={() => setShowSess(false)} maxWidth="xs" fullWidth>
            <form onSubmit={saveSess}>
              <DialogTitle>Nueva sesión de asistencia</DialogTitle>
              <DialogContent dividers sx={{ display:"flex", flexDirection:"column", gap:2 }}>
                <TextField label="Título de la sesión" value={sessForm.title} onChange={e => setSessForm({...sessForm, title:e.target.value})} required fullWidth />
                <TextField label="Fecha" type="date" value={sessForm.date} onChange={e => setSessForm({...sessForm, date:e.target.value})} InputLabelProps={{ shrink:true }} fullWidth />
                <TextField label="Notas" value={sessForm.notes} onChange={e => setSessForm({...sessForm, notes:e.target.value})} fullWidth />
              </DialogContent>
              <DialogActions><Button onClick={() => setShowSess(false)}>Cancelar</Button><Button type="submit" variant="contained">Crear</Button></DialogActions>
            </form>
          </Dialog>
        </div>
      )}

      {/* ── WORK PLANS ── */}
      {TABS[tab]?.key === "work_plans" && (
        <div>
          <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:12 }}>
            <Button size="small" variant="contained" startIcon={<AddOutlined sx={{ fontSize:14 }} />} onClick={() => { setEditPlan(null); setShowPlan(true); }}>Nuevo Plan</Button>
          </div>
          {plans.length === 0 ? (
            <div className={s.empty}><p className={s.emptyTitle}>Sin planes de trabajo</p></div>
          ) : plans.map(plan => {
            const done = plan.tasks?.filter(t => t.completed).length || 0;
            const total = plan.tasks?.length || 0;
            const pct = total > 0 ? Math.round(done/total*100) : 0;
            return (
              <div key={plan.id} style={{ background:"#fff", border:"1px solid var(--border)", borderRadius:4, marginBottom:12, overflow:"hidden" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"10px 14px", borderBottom:"1px solid var(--border)", background:"#FAFAFA" }}>
                  <div>
                    <span style={{ fontWeight:700, fontSize:14 }}>{plan.title}</span>
                    <div style={{ display:"flex", gap:6, marginTop:4, flexWrap:"wrap" }}>
                      <Badge variant={plan.status==="completed"?"success":plan.status==="paused"?"warning":"primary"} size="sm">{plan.status}</Badge>
                      {plan.start_date && <span style={{ fontSize:11, color:"var(--text-muted)" }}>{plan.start_date} → {plan.end_date||"..."}</span>}
                    </div>
                    {plan.description && <p style={{ fontSize:12, color:"var(--text-secondary)", marginTop:4 }}>{plan.description}</p>}
                  </div>
                  <div style={{ display:"flex", gap:4 }}>
                    <IconButton size="small" onClick={() => openEditPlan(plan)}><EditOutlined sx={{ fontSize:14 }} /></IconButton>
                    <IconButton size="small" color="error" onClick={() => delPlan(plan.id)}><DeleteOutlined sx={{ fontSize:14 }} /></IconButton>
                  </div>
                </div>
                <div style={{ padding:"10px 14px" }}>
                  {total > 0 && (
                    <div style={{ marginBottom:10 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                        <span style={{ fontSize:11, color:"var(--text-muted)", fontWeight:600 }}>PROGRESO</span>
                        <span style={{ fontSize:11, fontWeight:700 }}>{done}/{total} — {pct}%</span>
                      </div>
                      <LinearProgress variant="determinate" value={pct} sx={{ height:4, borderRadius:2, bgcolor:"#F3F4F6", "& .MuiLinearProgress-bar": { bgcolor:"#1e3a5f" } }} />
                    </div>
                  )}
                  {plan.tasks?.map(task => (
                    <div key={task.id} style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 0", borderBottom:"1px solid #F9FAFB" }}>
                      <Checkbox checked={task.completed} size="small" sx={{ p:0 }}
                        icon={<RadioButtonUncheckedOutlined sx={{ fontSize:16 }} />}
                        checkedIcon={<CheckCircleOutlined sx={{ fontSize:16, color:"var(--color-success)" }} />}
                        onChange={() => handleToggleTask(plan.id, task.id)} />
                      <span style={{ flex:1, fontSize:13, color: task.completed ? "var(--text-muted)" : "var(--text-primary)", textDecoration: task.completed ? "line-through" : "none" }}>{task.title}</span>
                      {task.assigned_to && <span style={{ fontSize:11, color:"var(--text-muted)" }}>{task.assigned_to}</span>}
                      {task.due_date && <span style={{ fontSize:11, color:"var(--text-muted)" }}>{task.due_date}</span>}
                      <IconButton size="small" onClick={() => handleDelTask(plan.id, task.id)}><DeleteOutlined sx={{ fontSize:12 }} /></IconButton>
                    </div>
                  ))}
                  {/* Add task inline */}
                  {newTask.planId === plan.id ? (
                    <div style={{ display:"flex", gap:6, marginTop:8 }}>
                      <TextField size="small" placeholder="Tarea..." value={newTask.title} onChange={e => setNewTask({...newTask, title:e.target.value})} sx={{ flex:1 }} />
                      <TextField size="small" placeholder="Responsable" value={newTask.assigned_to} onChange={e => setNewTask({...newTask, assigned_to:e.target.value})} sx={{ width:140 }} />
                      <TextField size="small" type="date" value={newTask.due_date} onChange={e => setNewTask({...newTask, due_date:e.target.value})} InputLabelProps={{ shrink:true }} sx={{ width:140 }} />
                      <Button size="small" variant="contained" onClick={() => handleAddTask(plan.id)}>+</Button>
                      <Button size="small" onClick={() => setNewTask({ planId:null, title:"", assigned_to:"", due_date:"" })}>✕</Button>
                    </div>
                  ) : (
                    <Button size="small" startIcon={<AddOutlined sx={{ fontSize:13 }} />} sx={{ mt:1 }} onClick={() => setNewTask({ planId: plan.id, title:"", assigned_to:"", due_date:"" })}>
                      Agregar tarea
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          <Dialog open={showPlan} onClose={() => setShowPlan(false)} maxWidth="xs" fullWidth>
            <form onSubmit={savePlan}>
              <DialogTitle>{editPlan ? "Editar Plan" : "Nuevo Plan de Trabajo"}</DialogTitle>
              <DialogContent dividers sx={{ display:"flex", flexDirection:"column", gap:2 }}>
                <TextField label="Título" value={planForm.title} onChange={e => setPlanForm({...planForm, title:e.target.value})} required fullWidth />
                <TextField label="Descripción" value={planForm.description} onChange={e => setPlanForm({...planForm, description:e.target.value})} multiline rows={2} fullWidth />
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  <TextField label="Inicio" type="date" value={planForm.start_date} onChange={e => setPlanForm({...planForm, start_date:e.target.value})} InputLabelProps={{ shrink:true }} />
                  <TextField label="Fin" type="date" value={planForm.end_date} onChange={e => setPlanForm({...planForm, end_date:e.target.value})} InputLabelProps={{ shrink:true }} />
                </div>
                <TextField select label="Estado" value={planForm.status} onChange={e => setPlanForm({...planForm, status:e.target.value})}>
                  {PLAN_STATUS.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                </TextField>
              </DialogContent>
              <DialogActions><Button onClick={() => setShowPlan(false)}>Cancelar</Button><Button type="submit" variant="contained">Guardar</Button></DialogActions>
            </form>
          </Dialog>
        </div>
      )}

      {/* ── GALLERY ── */}
      {TABS[tab]?.key === "gallery" && (
        <div>
          <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:12, gap:8 }}>
            <Button
              size="small" variant="contained"
              startIcon={uploading ? <CircularProgress size={12} color="inherit" /> : <CloudUploadOutlined sx={{ fontSize:14 }} />}
              component="label" disabled={uploading}
            >
              Subir Foto
              <input type="file" hidden accept="image/*" onChange={handleUpload} />
            </Button>
          </div>
          {gallery.length === 0 ? (
            <div className={s.empty}><p className={s.emptyTitle}>Sin fotos en la galería</p><p className={s.emptyText}>Sube fotos de tus actividades.</p></div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(180px, 1fr))", gap:10 }}>
              {gallery.map(item => (
                <div key={item.id} style={{ position:"relative", borderRadius:4, overflow:"hidden", border:"1px solid var(--border)", background:"#000" }}>
                  <img
                    src={`${API_URL}${item.url}`}
                    alt={item.caption || item.filename}
                    style={{ width:"100%", height:140, objectFit:"cover", display:"block", opacity:0.92 }}
                  />
                  <div style={{ position:"absolute", top:4, right:4 }}>
                    <Tooltip title="Eliminar">
                      <IconButton size="small" onClick={() => delPhoto(item.id)} sx={{ bgcolor:"rgba(0,0,0,0.55)", color:"#fff", "&:hover":{ bgcolor:"rgba(220,38,38,0.85)" }, padding:"4px" }}>
                        <DeleteOutlined sx={{ fontSize:13 }} />
                      </IconButton>
                    </Tooltip>
                  </div>
                  {item.caption && (
                    <div style={{ padding:"4px 8px", fontSize:11, color:"var(--text-secondary)", background:"#fff", borderTop:"1px solid var(--border)" }}>{item.caption}</div>
                  )}
                  {item.activity_date && (
                  <div style={{ padding:"0 8px 4px", fontSize:10, color:"var(--text-muted)" }}>{item.activity_date}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MONTHLY REPORT ── */}
      {TABS[tab]?.key === "monthly_report" && (
        <MonthlyReportTab ministryId={mid} />
      )}
    </div>
  );
}
