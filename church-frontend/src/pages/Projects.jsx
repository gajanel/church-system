/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import { useState, useEffect } from "react";
import { getProjects, getProjectsSummary, createProject, updateProject, deleteProject } from "../api/projects";
import {
  Dialog, DialogContent, DialogActions,
  Select, MenuItem, FormControl, InputLabel, TextField, Button
} from "@mui/material";
import { useToast } from "../components/ui/Toast";
import s from "./Projects.module.css";

/* ── Constants ── */
const STATUS_OPTIONS = ["Activo", "Pausado", "Completado", "Cancelado"];

const STATUS_COLORS = {
  Activo:     "#10b981",
  Pausado:    "#f59e0b",
  Completado: "#3b82f6",
  Cancelado:  "#ef4444",
};

const STATUS_PILL = {
  Activo:     s.statusActivo,
  Pausado:    s.statusPausado,
  Completado: s.statusCompletado,
  Cancelado:  s.statusCancelado,
};

const emptyForm = {
  name:"", description:"", status:"Activo",
  budget:"", contributions:"", spent:"",
  start_date:"", end_date:""
};

/* ── Helpers ── */
const fmt     = n => new Intl.NumberFormat("es-GT", { style:"currency", currency:"GTQ", minimumFractionDigits:0 }).format(n || 0);
const fmtDate = d => { if (!d) return "—"; return new Date(d + "T00:00:00").toLocaleDateString("es-GT", { day:"numeric", month:"short", year:"numeric" }); };
const calcProg = (spent, budget) => (!budget || budget === 0) ? 0 : Math.min(100, Math.round((spent / budget) * 100));
const progColor = pct => pct >= 100 ? "#ef4444" : pct >= 75 ? "#f59e0b" : "#10b981";

/* ── KPI data ── */
const KPI_META = [
  { label: "Total / Estado" },
  { label: "Presupuesto Meta" },
  { label: "Aportes / Recaudado" },
  { label: "Gastado / Ejecutado" },
];

export default function Projects() {
  const [projects, setProjects]        = useState([]);
  const [summary, setSummary]          = useState({ total:0, total_budget:0, total_contributions:0, total_spent:0 });
  const [selectedProject, setSelected] = useState(null);
  const [showForm, setShowForm]        = useState(false);
  const [editing, setEditing]          = useState(null);
  const [form, setForm]                = useState(emptyForm);
  const [error, setError]              = useState("");
  const [loading, setLoading]          = useState(true);
  const [filterStatus, setFilter]      = useState("Todos");
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [projRes, sumRes] = await Promise.all([getProjects(), getProjectsSummary()]);
      const updated = projRes.data;
      setProjects(updated);
      setSummary(sumRes.data);
      if (selectedProject) setSelected(updated.find(p => p.id === selectedProject.id) || null);
      setError("");
    } catch { setError("Error al cargar los proyectos"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered  = filterStatus === "Todos" ? projects : projects.filter(p => p.status === filterStatus);
  const handleChg = e => setForm({ ...form, [e.target.name]: e.target.value });

  /* ── KPI data ── */
  const kpiValues = selectedProject
    ? [selectedProject.status, selectedProject.budget, selectedProject.contributions, selectedProject.spent]
    : [summary.total, summary.total_budget, summary.total_contributions, summary.total_spent];

  /* ── Submit ── */
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
      setError(msg); toast.error(msg);
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
    } catch {
      toast.error("Error al eliminar el proyecto");
    }
  };

  return (
    <div className={s.page}>

      {/* ── Header ── */}
      <div className={s.header}>
        <div className={s.headerLeft}>
          <h1>Gestión de Proyectos</h1>
          <p>Administra proyectos de construcción, misiones y actividades internas</p>
        </div>
        <button className={s.newBtn} onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(true); }}>
          <span style={{ fontSize:16 }}>+</span> Nuevo Proyecto
        </button>
      </div>

      {/* ── KPI Row ── */}
      <div className={s.kpiRow}>
        {KPI_META.map((k, i) => (
          <div
            key={i}
            className={`${s.kpiCard} ${selectedProject ? s.highlighted : ""}`}
          >
            <div className={s.kpiLabel}>
              {i === 0 ? (selectedProject ? "Estado" : "Proyectos activos") : k.label}
            </div>
            <div className={s.kpiValue}>
              {i === 0
                ? kpiValues[0]
                : fmt(kpiValues[i])}
            </div>
          </div>
        ))}
      </div>

      {/* ── Detail banner (when a project is selected) ── */}
      {selectedProject && (
        <div className={s.detailBanner}>
          <div>
            <p className={s.detailBannerTitle}>{selectedProject.name}</p>
            <p className={s.detailBannerSub}>Viendo datos específicos de este proyecto</p>
          </div>
          <button className={s.backBtn} onClick={() => setSelected(null)}>← Ver todos</button>
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className={s.toolbar}>
        <div className={s.filterGroup}>
          {["Todos", ...STATUS_OPTIONS].map(st => (
            <button
              key={st}
              className={`${s.filterBtn} ${filterStatus === st ? s.active : ""}`}
              onClick={() => setFilter(st)}
            >
              {st}
            </button>
          ))}
        </div>
        <span className={s.countBadge}>
          {filtered.length} {filtered.length === 1 ? "proyecto" : "proyectos"}
        </span>
      </div>

      {/* ── Project grid ── */}
      <div className={s.grid}>
        {loading ? (
          <div className={s.emptyState}>
            <div className={s.emptyText}>Cargando proyectos…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className={s.emptyState}>
            <p className={s.emptyTitle}>
              {filterStatus !== "Todos" ? `No hay proyectos "${filterStatus}"` : "Sin proyectos registrados"}
            </p>
            <p className={s.emptyText}>Crea tu primer proyecto haciendo clic en "Nuevo Proyecto".</p>
          </div>
        ) : (
          filtered.map(p => {
            const prog       = calcProg(p.spent, p.budget);
            const isSelected = selectedProject?.id === p.id;
            const accentColor = STATUS_COLORS[p.status] || "#94a3b8";

            return (
              <div
                key={p.id}
                className={`${s.projectCard} ${isSelected ? s.selected : ""}`}
                onClick={() => setSelected(isSelected ? null : p)}
              >
                {/* Accent bar */}
                <div className={s.cardAccent} style={{ background: accentColor }} />

                <div className={s.cardBody}>
                  {/* Name + status */}
                  <div className={s.cardTop}>
                    <p className={`${s.cardName} ${isSelected ? s.selectedText : ""}`}>{p.name}</p>
                    <span className={`${s.statusPill} ${STATUS_PILL[p.status] || ""}`}>{p.status}</span>
                  </div>

                  {/* Description */}
                  <p className={s.cardDesc}>{p.description || "Sin descripción"}</p>

                  {/* Progress */}
                  <div className={s.progressSection}>
                    <div className={s.progressHeader}>
                      <span className={s.progressLabel}>Ejecución del presupuesto</span>
                      <span className={s.progressPct} style={{ color: progColor(prog) }}>{prog}%</span>
                    </div>
                    <div className={s.progressTrack}>
                      <div
                        className={s.progressFill}
                        style={{ width: `${Math.min(prog, 100)}%`, background: progColor(prog) }}
                      />
                    </div>
                  </div>

                  {/* Finance cells */}
                  <div className={s.finGrid}>
                    {[
                      ["Presupuesto", fmt(p.budget),        "#0f172a"],
                      ["Aportes",     fmt(p.contributions), "#10b981"],
                      ["Gastado",     fmt(p.spent),         "#ef4444"],
                    ].map(([lbl, val, color]) => (
                      <div key={lbl} className={s.finCell}>
                        <span className={s.finCellLabel}>{lbl}</span>
                        <span className={s.finCellValue} style={{ color }}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className={s.cardFooter} onClick={e => e.stopPropagation()}>
                  <span className={s.cardDate}>
                    {p.start_date ? fmtDate(p.start_date) : "Sin fecha de inicio"}
                  </span>
                  <div className={s.cardActions}>
                    <button className={`${s.actionBtn} ${s.edit}`} title="Editar" onClick={() => handleEdit(p)}>Editar</button>
                    <button className={`${s.actionBtn} ${s.delete}`} title="Eliminar" onClick={() => handleDelete(p.id)}>Eliminar</button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Dialog: Form ── */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: "14px" } }}>
        <form onSubmit={handleSubmit}>
          <div className={s.dialogTitle}>
            {editing ? "Editar Proyecto" : "Nuevo Proyecto"}
          </div>
          <DialogContent sx={{ display:"flex", flexDirection:"column", gap:2, pt:"4px !important" }}>
            {error && <div className={s.errorBanner}>{error}</div>}

            <TextField size="small" name="name" label="Nombre del proyecto *"
              value={form.name} onChange={handleChg} required fullWidth />

            <TextField size="small" name="description" label="Descripción"
              value={form.description} onChange={handleChg} fullWidth multiline rows={3} />

            <div className={s.formGrid2}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select name="status" value={form.status} label="Estado" onChange={handleChg}>
                  {STATUS_OPTIONS.map(st => <MenuItem key={st} value={st}>{st}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField size="small" name="budget" type="number" label="Presupuesto (Q) *"
                value={form.budget} onChange={handleChg} required inputProps={{ step:"0.01", min:"0" }} />
            </div>

            <div className={s.formGrid2}>
              <TextField size="small" name="contributions" type="number" label="Aportaciones (Q)"
                value={form.contributions} onChange={handleChg} inputProps={{ step:"0.01", min:"0" }} />
              <TextField size="small" name="spent" type="number" label="Gastado (Q)"
                value={form.spent} onChange={handleChg} inputProps={{ step:"0.01", min:"0" }} />
            </div>

            <div className={s.formGrid2}>
              <TextField size="small" name="start_date" type="date" label="Fecha de inicio"
                value={form.start_date} onChange={handleChg} InputLabelProps={{ shrink:true }} />
              <TextField size="small" name="end_date" type="date" label="Fecha de fin estimado"
                value={form.end_date} onChange={handleChg} InputLabelProps={{ shrink:true }} />
            </div>
          </DialogContent>
          <DialogActions sx={{ px:3, py:2, gap:1 }}>
            <Button onClick={() => { setShowForm(false); setEditing(null); }} color="inherit" size="small">
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disableElevation size="small"
              sx={{ bgcolor:"#0f172a", textTransform:"none", fontWeight:600, borderRadius:"8px", '&:hover':{bgcolor:"#1e3a5f"} }}>
              {editing ? "Guardar Cambios" : "Crear Proyecto"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}