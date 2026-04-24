import { useState, useEffect } from "react";
import { getProjects, getProjectsSummary, createProject, updateProject, deleteProject } from "../api/projects";
import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl, InputLabel, LinearProgress, IconButton, Tooltip, TextField
} from "@mui/material";
import {
  Assignment, AddTask, Edit, Delete, AttachMoney, Handshake,
  Timer, CheckCircle, PauseCircle, Cancel
} from "@mui/icons-material";
import { Card, CardHeader, CardBody } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { PageHeader } from "../components/ui/PageHeader";
import { useToast } from "../components/ui/Toast";
import s from "../styles/page.module.css";

const STATUS_OPTIONS = ["Activo", "Pausado", "Completado", "Cancelado"];
const STATUS_BADGE   = { Activo:"success", Pausado:"warning", Completado:"info", Cancelado:"error" };
const STATUS_COLORS  = {
  Activo:    "var(--color-success)",
  Pausado:   "var(--color-warning)",
  Completado:"var(--color-info)",
  Cancelado: "var(--color-error)",
};

const emptyForm = {
  name:"", description:"", status:"Activo",
  budget:"", contributions:"", spent:"",
  start_date:"", end_date:""
};

const fmt     = n => new Intl.NumberFormat("es-GT", { style:"currency", currency:"GTQ", minimumFractionDigits:0 }).format(n || 0);
const fmtDate = d => { if (!d) return "—"; return new Date(d + "T00:00:00").toLocaleDateString("es-GT", { day:"numeric", month:"long", year:"numeric" }); };

export default function Projects() {
  const [projects, setProjects]         = useState([]);
  const [summary, setSummary]           = useState({ total:0, total_budget:0, total_contributions:0, total_spent:0 });
  const [selectedProject, setSelected]  = useState(null);
  const [showForm, setShowForm]         = useState(false);
  const [editing, setEditing]           = useState(null);
  const [form, setForm]                 = useState(emptyForm);
  const [error, setError]               = useState("");
  const [loading, setLoading]           = useState(true);
  const [filterStatus, setFilter]       = useState("Todos");
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [projRes, sumRes] = await Promise.all([getProjects(), getProjectsSummary()]);
      const updated = projRes.data;
      setProjects(updated);
      setSummary(sumRes.data);
      // Actualiza el proyecto seleccionado si aún existe
      if (selectedProject) {
        setSelected(updated.find(p => p.id === selectedProject.id) || null);
      }
      setError("");
    } catch { setError("Error al cargar los proyectos"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered   = filterStatus === "Todos" ? projects : projects.filter(p => p.status === filterStatus);
  const handleChg  = e => setForm({ ...form, [e.target.name]: e.target.value });
  const calcProg   = (spent, budget) => (!budget || budget === 0) ? 0 : Math.min(100, Math.round((spent / budget) * 100));

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        budget:        parseFloat(form.budget)        || 0,
        contributions: parseFloat(form.contributions) || 0,
        spent:         parseFloat(form.spent)         || 0,
        start_date:    form.start_date || null,
        end_date:      form.end_date   || null,
      };
      if (editing) {
        await updateProject(editing.id, payload);
        toast.success("Proyecto actualizado correctamente");
      } else {
        await createProject(payload);
        toast.success("Proyecto creado correctamente");
      }
      setShowForm(false); setEditing(null); setForm(emptyForm); load();
    } catch (err) { 
      const msg = err.response?.data?.detail || "Error al guardar el proyecto";
      setError(msg); 
      toast.error(msg);
    }
  };

  const handleEdit = p => {
    setEditing(p);
    setForm({
      name:p.name, description:p.description||"", status:p.status,
      budget:p.budget, contributions:p.contributions, spent:p.spent,
      start_date:p.start_date||"", end_date:p.end_date||""
    });
    setShowForm(true);
  };

  const handleDelete = async id => {
    if (!window.confirm("¿Eliminar este proyecto? Esta acción no se puede deshacer.")) return;
    try { 
      await deleteProject(id); 
      if (selectedProject?.id === id) setSelected(null); 
      toast.success("Proyecto eliminado");
      load(); 
    }
    catch { 
      setError("Error al eliminar el proyecto"); 
      toast.error("Error al eliminar el proyecto");
    }
  };

  // ── Datos de resumen: cambia entre globales y del proyecto seleccionado ──
  const sumData = [
    {
      label: selectedProject ? "Estado del Proyecto" : "Total en curso",
      value: selectedProject ? selectedProject.status : summary.total,
      icon:  <Assignment sx={{ fontSize:16, color:"var(--color-primary)" }} />,
      isMoney: false,
    },
    {
      label: "Presupuesto (Meta)",
      value: selectedProject ? selectedProject.budget        : summary.total_budget,
      icon:  <AttachMoney sx={{ fontSize:16, color:"var(--text-secondary)" }} />,
      isMoney: true,
    },
    {
      label: "Aportes / Recaudado",
      value: selectedProject ? selectedProject.contributions : summary.total_contributions,
      icon:  <Handshake sx={{ fontSize:16, color:"var(--color-success)" }} />,
      isMoney: true,
    },
    {
      label: "Gastado / Ejecutado",
      value: selectedProject ? selectedProject.spent         : summary.total_spent,
      icon:  <Timer sx={{ fontSize:16, color:"var(--color-error)" }} />,
      isMoney: true,
    },
  ];

  return (
    <div className={s.page}>
      <PageHeader title="Gestión de Proyectos" subtitle="Administra proyectos de construcción o misiones con sus metas y presupuestos.">
        <Button variant="contained" startIcon={<AddTask />}
          onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(true); }}>
          Nuevo Proyecto
        </Button>
      </PageHeader>

      {error && !showForm && <div className={s.errorText}>{error}</div>}

      {/* ── Resumen / Detalle ── */}
      <div style={{ marginBottom:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <p style={{ margin:0, fontSize:13, fontWeight:700, color:"var(--text-secondary)" }}>
            {selectedProject
              ? `📊 Detalle: ${selectedProject.name}`
              : "🌍 Totales Generales de la Iglesia"}
          </p>
          {selectedProject && (
            <Button size="small" variant="outlined" onClick={() => setSelected(null)}>
              ← Ver Todos
            </Button>
          )}
        </div>

        <div className={s.cardGrid4}>
          {sumData.map((sd, i) => (
            <Card key={i} style={{ borderLeft: selectedProject ? "3px solid var(--color-primary)" : "none" }}>
              <CardBody>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  {sd.icon}
                  <span style={{ fontSize:10, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.06em" }}>
                    {sd.label}
                  </span>
                </div>
                <div style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.02em" }}>
                  {sd.isMoney ? fmt(sd.value) : sd.value}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Filtros por estado ── */}
      <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
        {["Todos", ...STATUS_OPTIONS].map(st => (
          <button key={st} onClick={() => setFilter(st)}
            style={{
              padding:"4px 14px", border:"1px solid", borderRadius:99,
              fontSize:12, fontWeight:600, cursor:"pointer",
              borderColor: filterStatus === st ? "var(--color-primary)" : "var(--border)",
              background:  filterStatus === st ? "var(--color-primary-light)" : "transparent",
              color:       filterStatus === st ? "var(--color-primary)" : "var(--text-secondary)",
            }}>
            {st}
          </button>
        ))}
      </div>

      {/* ── Grid de proyectos ── */}
      {loading ? (
        <div className={s.empty}><p className={s.emptyText}>Cargando proyectos...</p></div>
      ) : filtered.length === 0 ? (
        <div className={s.empty}>
          <Assignment sx={{ fontSize:48, color:"var(--border-strong)", marginBottom:8 }} />
          <p className={s.emptyTitle}>
            No hay proyectos {filterStatus !== "Todos" ? `con estado "${filterStatus}"` : "registrados"}
          </p>
        </div>
      ) : (
        <div className={s.cardGrid}>
          {filtered.map(p => {
            const prog       = calcProg(p.spent, p.budget);
            const isSelected = selectedProject?.id === p.id;

            return (
              <Card key={p.id}
                onClick={() => setSelected(isSelected ? null : p)}
                style={{
                  cursor: "pointer",
                  borderTop: `3px solid ${STATUS_COLORS[p.status] || "var(--border-strong)"}`,
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}>
                <CardBody>
                  {/* Nombre + badge */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                    <p style={{
                      fontWeight:700, fontSize:14, margin:0, lineHeight:1.3,
                      color: isSelected ? "var(--color-primary)" : "var(--text-primary)"
                    }}>
                      {p.name}
                    </p>
                    <Badge variant={STATUS_BADGE[p.status] || "default"}>{p.status}</Badge>
                  </div>

                  {/* Descripción */}
                  <p style={{
                    fontSize:12, color:"var(--text-secondary)", margin:"0 0 16px",
                    display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical",
                    overflow:"hidden", minHeight:34
                  }}>
                    {p.description || "Sin descripción"}
                  </p>

                  {/* Barra de progreso */}
                  <div style={{ marginBottom:14 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ fontSize:10, fontWeight:600, color:"var(--text-muted)", textTransform:"uppercase" }}>
                        Ejecución del Presupuesto
                      </span>
                      <span style={{
                        fontSize:11, fontWeight:700,
                        color: prog >= 100 ? "var(--color-error)" : "var(--text-primary)"
                      }}>
                        {prog}%
                      </span>
                    </div>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(prog, 100)}
                      color={prog >= 100 ? "error" : prog >= 75 ? "warning" : "success"}
                      sx={{ height:7, borderRadius:4 }}
                    />
                  </div>

                  {/* Financiero */}
                  <div style={{
                    display:"grid", gridTemplateColumns:"1fr 1fr 1fr",
                    gap:6, background:"#f9fafb", padding:"10px 12px", borderRadius:8
                  }}>
                    {[
                      ["Presupuesto", fmt(p.budget),        "var(--text-primary)"],
                      ["Aportes",     fmt(p.contributions), "var(--color-success)"],
                      ["Gastos",      fmt(p.spent),         "var(--color-error)"],
                    ].map(([lbl, val, color]) => (
                      <div key={lbl}>
                        <span style={{ fontSize:9, color:"var(--text-muted)", display:"block", textTransform:"uppercase", letterSpacing:"0.04em" }}>{lbl}</span>
                        <span style={{ fontSize:11, fontWeight:700, color }}>{val}</span>
                      </div>
                    ))}
                  </div>
                </CardBody>

                {/* Footer */}
                <div className={s.cardFooter}>
                  <span style={{ fontSize:11, color:"var(--text-muted)" }}>
                    {p.start_date ? `Inicio: ${fmtDate(p.start_date)}` : "Sin fecha de inicio"}
                  </span>
                  <div onClick={e => e.stopPropagation()} className={s.cardActions}>
                    <Tooltip title="Editar Proyecto">
                      <IconButton size="small" color="primary" onClick={() => handleEdit(p)}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar Proyecto">
                      <IconButton size="small" color="error" onClick={() => handleDelete(p.id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Dialog: Formulario ── */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight:800 }}>
            {editing ? "Editar Proyecto" : "Nuevo Proyecto"}
          </DialogTitle>
          <DialogContent dividers sx={{ display:"flex", flexDirection:"column", gap:2 }}>
            {error && <div className={s.errorText}>{error}</div>}

            <TextField name="name" label="Nombre del proyecto *" value={form.name}
              onChange={handleChg} required fullWidth />

            <TextField name="description" label="Descripción" value={form.description}
              onChange={handleChg} fullWidth multiline rows={3} />

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select name="status" value={form.status} label="Estado" onChange={handleChg}>
                  {STATUS_OPTIONS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField name="budget" type="number" label="Presupuesto (Meta Q) *"
                value={form.budget} onChange={handleChg} required
                inputProps={{ step:"0.01", min:"0" }} />
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <TextField name="contributions" type="number" label="Aportaciones (Q)"
                value={form.contributions} onChange={handleChg}
                inputProps={{ step:"0.01", min:"0" }} />
              <TextField name="spent" type="number" label="Gastado (Q)"
                value={form.spent} onChange={handleChg}
                inputProps={{ step:"0.01", min:"0" }} />
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <TextField name="start_date" type="date" label="Fecha de inicio"
                value={form.start_date} onChange={handleChg} InputLabelProps={{ shrink:true }} />
              <TextField name="end_date" type="date" label="Fecha de fin estimado"
                value={form.end_date} onChange={handleChg} InputLabelProps={{ shrink:true }} />
            </div>
          </DialogContent>
          <DialogActions sx={{ px:3, py:2 }}>
            <Button onClick={() => { setShowForm(false); setEditing(null); }} color="inherit">
              Cancelar
            </Button>
            <Button type="submit" variant="contained">Guardar Proyecto</Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}