/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
/**
 * MonthlyReportTab.jsx
 * Full monthly ministry report form with 5 sections (accordion style).
 * Also lists previously submitted reports.
 */
import { useState, useEffect } from "react";
import {
  Button, TextField, MenuItem, Accordion, AccordionSummary,
  AccordionDetails, IconButton, CircularProgress, Tooltip,
  Chip,
} from "@mui/material";
import {
  ExpandMoreOutlined, AddOutlined, DeleteOutlined,
  DescriptionOutlined, PeopleOutlined, EventNoteOutlined,
  MicOutlined, AccountBalanceWalletOutlined, AttachFileOutlined,
  CheckCircleOutlined, VisibilityOutlined,
} from "@mui/icons-material";
import { getMonthlyReports, createMonthlyReport, deleteMonthlyReport } from "../../api/ministryWorkspace";
import { getMinistries } from "../../api/ministries";
import { API_URL } from "../../api/api";
import { Badge } from "../../components/ui/Badge";
import { useConfirm } from "../../components/ui/ConfirmDialog";
import s from "../../styles/page.module.css";

const MONTHS = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

const SECTION_COLORS = {
  general:    { bg: "rgba(99,102,241,0.08)",   border: "#6366f1", label: "#6366f1" },
  membership: { bg: "rgba(16,185,129,0.08)",   border: "#10b981", label: "#10b981" },
  attendance: { bg: "rgba(59,130,246,0.08)",   border: "#3b82f6", label: "#3b82f6" },
  activities: { bg: "rgba(245,158,11,0.08)",   border: "#f59e0b", label: "#f59e0b" },
  sermons:    { bg: "rgba(236,72,153,0.08)",   border: "#ec4899", label: "#ec4899" },
  finance:    { bg: "rgba(20,184,166,0.08)",   border: "#14b8a6", label: "#14b8a6" },
};

const sectionHeader = (label, Icon, colorKey) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <div style={{
      width: 28, height: 28, borderRadius: 6,
      background: SECTION_COLORS[colorKey].bg,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Icon sx={{ fontSize: 15, color: SECTION_COLORS[colorKey].label }} />
    </div>
    <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>{label}</span>
  </div>
);

const NumField = ({ label, value, onChange, ...props }) => (
  <TextField
    size="small"
    label={label}
    type="number"
    inputProps={{ min: 0, step: 1 }}
    value={value}
    onChange={e => onChange(e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value) || 0))}
    fullWidth
    {...props}
  />
);

const MoneyField = ({ label, value, onChange }) => (
  <TextField
    size="small"
    label={label}
    type="number"
    inputProps={{ min: 0, step: "0.01" }}
    value={value}
    onChange={e => onChange(e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value) || 0))}
    fullWidth
    InputProps={{ startAdornment: <span style={{ marginRight: 4, color: "var(--text-muted)", fontSize: 12 }}>Q</span> }}
  />
);

const initForm = () => ({
  // Sección 1
  reporter_name: "", report_month: "", ministry_name: "",
  // Membresía
  mem_children: "", mem_teens: "", mem_youth: "", mem_women: "", mem_men: "", mem_seniors: "",
  // Asistencia
  att_children: "", att_teens: "", att_youth: "", att_women: "", att_men: "", att_seniors: "",
  // Actividades
  act_scheduled: "", act_done: "", act_services: "", act_fasts: "",
  act_visits: "", act_sales: "", act_reconciled: "", act_meetings: "",
  // Sermones
  sermon_week1: "", sermon_week2: "", sermon_week3: "", sermon_week4: "", sermon_week5: "",
  // Financiero
  fin_offerings: "", fin_sales: "", fin_special: "", fin_social_expense: "", fin_project_expense: "",
  // Adjunto
  financial_file: null,
});

export default function MonthlyReportTab({ ministryId }) {
  const [reports, setReports]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [submitting, setSubmitting]   = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isSuper = currentUser?.is_super_admin;
  const [showForm, setShowForm]       = useState(false);
  const [form, setForm]               = useState(initForm());
  const [expanded, setExpanded]       = useState("general");
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState("");
  const [ministries, setMinistries]   = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [confirm, ConfirmDialogNode]  = useConfirm();

  const setF = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const load = async () => {
    setLoading(true);
    try {
      const [rRes, mRes] = await Promise.all([
        getMonthlyReports(ministryId),
        getMinistries(),
      ]);
      setReports(rRes.data);
      setMinistries(mRes.data);
    } catch { setError("Error al cargar reportes"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [ministryId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.reporter_name || !form.report_month || !form.ministry_name) {
      setError("Los campos de Datos Generales son obligatorios.");
      setExpanded("general");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      // Append all form fields
      Object.entries(form).forEach(([k, v]) => {
        if (k === "financial_file") return;
        if (v !== null && v !== undefined) fd.append(k, v);
      });
      if (form.financial_file) fd.append("financial_report", form.financial_file);

      await createMonthlyReport(ministryId, fd);
      setSuccess("Reporte guardado exitosamente.");
      setForm(initForm());
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Error al guardar el reporte.");
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: "¿Eliminar reporte mensual?",
      message: "Esta acción es irreversible y eliminará todos los datos del reporte.",
      confirmLabel: "Eliminar",
      danger: true,
    });
    if (!ok) return;
    
    try {
      await deleteMonthlyReport(ministryId, id);
      if (selectedReport?.id === id) setSelectedReport(null);
      load();
    } catch { setError("Error al eliminar el reporte."); }
  };

  const sectionSx = (key) => ({
    border: `1px solid ${SECTION_COLORS[key].border}22`,
    borderRadius: "8px !important",
    mb: 1,
    "&:before": { display: "none" },
    background: SECTION_COLORS[key].bg,
  });

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
      <CircularProgress size={28} />
    </div>
  );

  // ── Detail view ──────────────────────────────────────────────────────────
  if (selectedReport) {
    const r = selectedReport;
    const totalMem = r.mem_children + r.mem_teens + r.mem_youth + r.mem_women + r.mem_men + r.mem_seniors;
    const totalAtt = r.att_children + r.att_teens + r.att_youth + r.att_women + r.att_men + r.att_seniors;
    const totalIncome = r.fin_offerings + r.fin_sales + r.fin_special;
    const totalExpense = r.fin_social_expense + r.fin_project_expense;
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: "var(--text-primary)" }}>
              {r.ministry_name} — {r.report_month}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              Elaborado por: {r.reporter_name} · {new Date(r.created_at).toLocaleDateString("es-GT")}
            </div>
          </div>
          <Button size="small" variant="outlined" onClick={() => setSelectedReport(null)}>← Volver</Button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {/* Membresía */}
          <Section title="Membresía Actual" icon={PeopleOutlined} colorKey="membership">
            <StatRow label="Niños (4-12)"          val={r.mem_children} />
            <StatRow label="Adolescentes (13-17)"  val={r.mem_teens} />
            <StatRow label="Jóvenes (18-35)"       val={r.mem_youth} />
            <StatRow label="Mujeres (36-60)"       val={r.mem_women} />
            <StatRow label="Hombres (36-60)"       val={r.mem_men} />
            <StatRow label="Adultos mayores (61+)" val={r.mem_seniors} />
            <StatRow label="Total" val={totalMem} bold />
          </Section>

          {/* Asistencia */}
          <Section title="Promedio de Asistencia" icon={PeopleOutlined} colorKey="attendance">
            <StatRow label="Niños (4-12)"          val={r.att_children} />
            <StatRow label="Adolescentes (13-17)"  val={r.att_teens} />
            <StatRow label="Jóvenes (18-35)"       val={r.att_youth} />
            <StatRow label="Mujeres (36-60)"       val={r.att_women} />
            <StatRow label="Hombres (36-60)"       val={r.att_men} />
            <StatRow label="Adultos mayores (61+)" val={r.att_seniors} />
            <StatRow label="Total promedio" val={totalAtt} bold />
          </Section>

          {/* Actividades */}
          <Section title="Actividades" icon={EventNoteOutlined} colorKey="activities">
            <StatRow label="Agendadas"   val={r.act_scheduled} />
            <StatRow label="Realizadas"  val={r.act_done} />
            <StatRow label="Servicios"   val={r.act_services} />
            <StatRow label="Ayunos"      val={r.act_fasts} />
            <StatRow label="Visitas"     val={r.act_visits} />
            <StatRow label="Ventas"      val={r.act_sales} />
            <StatRow label="Reconciliados" val={r.act_reconciled} />
            <StatRow label="Reuniones"   val={r.act_meetings} />
          </Section>

          {/* Sermones */}
          <Section title="Sermones Predicados" icon={MicOutlined} colorKey="sermons">
            {[1,2,3,4,5].map(n => {
              const txt = r[`sermon_week${n}`];
              return txt ? <StatRow key={n} label={`Semana ${n}`} val={txt} /> : null;
            })}
          </Section>

          {/* Financiero */}
          <Section title="Área Financiera" icon={AccountBalanceWalletOutlined} colorKey="finance" style={{ gridColumn: "1 / -1" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-success)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Ingresos</div>
                <StatRow label="Ofrendas"          val={`Q ${r.fin_offerings.toFixed(2)}`} />
                <StatRow label="Ventas"             val={`Q ${r.fin_sales.toFixed(2)}`} />
                <StatRow label="Ofrendas especiales" val={`Q ${r.fin_special.toFixed(2)}`} />
                <StatRow label="Total ingresos" val={`Q ${totalIncome.toFixed(2)}`} bold />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-error)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Egresos</div>
                <StatRow label="Acción social"     val={`Q ${r.fin_social_expense.toFixed(2)}`} />
                <StatRow label="Proyectos especiales" val={`Q ${r.fin_project_expense.toFixed(2)}`} />
                <StatRow label="Total egresos" val={`Q ${totalExpense.toFixed(2)}`} bold />
              </div>
            </div>
            {r.fin_report_url && (
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                <a
                  href={`${API_URL}${r.fin_report_url}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--color-primary)", fontWeight: 600 }}
                >
                  <AttachFileOutlined sx={{ fontSize: 14 }} />
                  Ver reporte financiero adjunto
                </a>
              </div>
            )}
          </Section>
        </div>
      </div>
    );
  }

  // ── List view + form ─────────────────────────────────────────────────────
  return (
    <div>
      {error   && <div className={s.errorText}>{error}</div>}
      {success && <div style={{ color: "var(--color-success)", fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{success}</div>}

      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
          {reports.length} reporte{reports.length !== 1 ? "s" : ""} registrado{reports.length !== 1 ? "s" : ""}
        </span>
        <Button
          size="small" variant="contained"
          startIcon={showForm ? null : <AddOutlined sx={{ fontSize: 14 }} />}
          onClick={() => { setShowForm(!showForm); setError(""); setSuccess(""); }}
          sx={{ bgcolor: showForm ? "var(--color-error)" : undefined }}
        >
          {showForm ? "Cancelar" : "Nuevo Reporte"}
        </Button>
      </div>

      {/* ── FORM ── */}
      {showForm && (
        <form onSubmit={handleSubmit}>
          <div style={{ background: "var(--surface-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 20, marginBottom: 20 }}>

            {/* Sección 1 — Datos Generales */}
            <Accordion expanded={expanded === "general"} onChange={() => setExpanded(expanded === "general" ? false : "general")} sx={sectionSx("general")} disableGutters elevation={0}>
              <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
                {sectionHeader("1. Datos Generales", DescriptionOutlined, "general")}
              </AccordionSummary>
              <AccordionDetails>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <TextField size="small" label="Nombre de quien elabora" value={form.reporter_name}
                    onChange={e => setF("reporter_name", e.target.value)} required fullWidth />
                  <TextField size="small" select label="Mes del reporte" value={form.report_month}
                    onChange={e => setF("report_month", e.target.value)} required fullWidth>
                    {MONTHS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                  </TextField>
                  <TextField size="small" select label="Ministerio" value={form.ministry_name}
                    onChange={e => setF("ministry_name", e.target.value)} required fullWidth>
                    {ministries.map(m => <MenuItem key={m.id} value={m.name}>{m.name}</MenuItem>)}
                  </TextField>
                </div>
              </AccordionDetails>
            </Accordion>

            {/* Sección 2 — Membresía */}
            <Accordion expanded={expanded === "membership"} onChange={() => setExpanded(expanded === "membership" ? false : "membership")} sx={sectionSx("membership")} disableGutters elevation={0}>
              <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
                {sectionHeader("2. Membresía Actual", PeopleOutlined, "membership")}
              </AccordionSummary>
              <AccordionDetails>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <NumField label="Niños (4-12 años)"          value={form.mem_children} onChange={v => setF("mem_children", v)} />
                  <NumField label="Adolescentes (13-17 años)"  value={form.mem_teens}    onChange={v => setF("mem_teens", v)} />
                  <NumField label="Jóvenes (18-35 años)"       value={form.mem_youth}    onChange={v => setF("mem_youth", v)} />
                  <NumField label="Mujeres (36-60 años)"       value={form.mem_women}    onChange={v => setF("mem_women", v)} />
                  <NumField label="Hombres (36-60 años)"       value={form.mem_men}      onChange={v => setF("mem_men", v)} />
                  <NumField label="Adultos mayores (61+)"      value={form.mem_seniors}  onChange={v => setF("mem_seniors", v)} />
                </div>
                <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-muted)" }}>
                  Total de miembros: <strong>{[form.mem_children, form.mem_teens, form.mem_youth, form.mem_women, form.mem_men, form.mem_seniors].reduce((a, v) => a + (parseInt(v) || 0), 0)}</strong>
                </div>
              </AccordionDetails>
            </Accordion>

            {/* Sección 3 — Asistencia */}
            <Accordion expanded={expanded === "attendance"} onChange={() => setExpanded(expanded === "attendance" ? false : "attendance")} sx={sectionSx("attendance")} disableGutters elevation={0}>
              <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
                {sectionHeader("3. Promedio de Asistencia Mensual", EventNoteOutlined, "attendance")}
              </AccordionSummary>
              <AccordionDetails>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <NumField label="Promedio niños (4-12)"         value={form.att_children} onChange={v => setF("att_children", v)} />
                  <NumField label="Promedio adolescentes (13-17)" value={form.att_teens}    onChange={v => setF("att_teens", v)} />
                  <NumField label="Promedio jóvenes (18-35)"      value={form.att_youth}    onChange={v => setF("att_youth", v)} />
                  <NumField label="Promedio mujeres (36-60)"      value={form.att_women}    onChange={v => setF("att_women", v)} />
                  <NumField label="Promedio hombres (36-60)"      value={form.att_men}      onChange={v => setF("att_men", v)} />
                  <NumField label="Promedio adultos mayores (61+)"value={form.att_seniors}  onChange={v => setF("att_seniors", v)} />
                </div>
                <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-muted)" }}>
                  Promedio total: <strong>{[form.att_children, form.att_teens, form.att_youth, form.att_women, form.att_men, form.att_seniors].reduce((a, v) => a + (parseInt(v) || 0), 0)}</strong>
                </div>
              </AccordionDetails>
            </Accordion>

            {/* Sección 4 — Actividades */}
            <Accordion expanded={expanded === "activities"} onChange={() => setExpanded(expanded === "activities" ? false : "activities")} sx={sectionSx("activities")} disableGutters elevation={0}>
              <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
                {sectionHeader("4. Reporte General de Actividades", EventNoteOutlined, "activities")}
              </AccordionSummary>
              <AccordionDetails>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                  <NumField label="Actividades agendadas"  value={form.act_scheduled}  onChange={v => setF("act_scheduled", v)} />
                  <NumField label="Actividades realizadas" value={form.act_done}        onChange={v => setF("act_done", v)} />
                  <NumField label="Servicios"              value={form.act_services}    onChange={v => setF("act_services", v)} />
                  <NumField label="Ayunos"                 value={form.act_fasts}       onChange={v => setF("act_fasts", v)} />
                  <NumField label="Visitas"                value={form.act_visits}      onChange={v => setF("act_visits", v)} />
                  <NumField label="Ventas"                 value={form.act_sales}       onChange={v => setF("act_sales", v)} />
                  <NumField label="Reconciliados"          value={form.act_reconciled}  onChange={v => setF("act_reconciled", v)} />
                  <NumField label="Reuniones de trabajo"   value={form.act_meetings}    onChange={v => setF("act_meetings", v)} />
                </div>
                {(parseInt(form.act_scheduled) || 0) > 0 && (parseInt(form.act_done) || 0) <= (parseInt(form.act_scheduled) || 0) && (
                  <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-muted)" }}>
                    Cumplimiento: <strong style={{ color: "var(--color-success)" }}>
                      {Math.round((parseInt(form.act_done) || 0) / (parseInt(form.act_scheduled) || 1) * 100)}%
                    </strong>
                  </div>
                )}
              </AccordionDetails>
            </Accordion>

            {/* Sección 5 — Sermones */}
            <Accordion expanded={expanded === "sermons"} onChange={() => setExpanded(expanded === "sermons" ? false : "sermons")} sx={sectionSx("sermons")} disableGutters elevation={0}>
              <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
                {sectionHeader("5. Sermones Predicados", MicOutlined, "sermons")}
              </AccordionSummary>
              <AccordionDetails>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[1,2,3,4,5].map(n => (
                    <TextField key={n} size="small" label={`Semana No. ${n}`}
                      value={form[`sermon_week${n}`]}
                      onChange={e => setF(`sermon_week${n}`, e.target.value)}
                      fullWidth placeholder="Título o referencia bíblica del sermón..." />
                  ))}
                </div>
              </AccordionDetails>
            </Accordion>

            {/* Sección 6 — Financiero */}
            <Accordion expanded={expanded === "finance"} onChange={() => setExpanded(expanded === "finance" ? false : "finance")} sx={sectionSx("finance")} disableGutters elevation={0}>
              <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
                {sectionHeader("6. Área Financiera", AccountBalanceWalletOutlined, "finance")}
              </AccordionSummary>
              <AccordionDetails>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {/* Ingresos */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-success)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Ingresos</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <MoneyField label="Ofrendas del ministerio"       value={form.fin_offerings}  onChange={v => setF("fin_offerings", v)} />
                      <MoneyField label="Ventas"                        value={form.fin_sales}      onChange={v => setF("fin_sales", v)} />
                      <MoneyField label="Ofrendas especiales"           value={form.fin_special}    onChange={v => setF("fin_special", v)} />
                    </div>
                    <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px dashed var(--border)", fontSize: 12, display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Subtotal ingresos</span>
                      <strong style={{ color: "var(--color-success)" }}>
                        Q {((parseFloat(form.fin_offerings) || 0) + (parseFloat(form.fin_sales) || 0) + (parseFloat(form.fin_special) || 0)).toFixed(2)}
                      </strong>
                    </div>
                  </div>
                  {/* Egresos */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-error)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Egresos</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <MoneyField label="Acción social"        value={form.fin_social_expense}  onChange={v => setF("fin_social_expense", v)} />
                      <MoneyField label="Proyectos especiales" value={form.fin_project_expense} onChange={v => setF("fin_project_expense", v)} />
                    </div>
                  <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px dashed var(--border)", fontSize: 12, display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Subtotal egresos</span>
                      <strong style={{ color: "var(--color-error)" }}>
                        Q {((parseFloat(form.fin_social_expense) || 0) + (parseFloat(form.fin_project_expense) || 0)).toFixed(2)}
                      </strong>
                    </div>
                  </div>
                </div>
              </AccordionDetails>
            </Accordion>

            {/* Adjunto — sección independiente al final */}
            <div style={{
              background: "rgba(100,116,139,0.06)",
              border: "1px dashed #94a3b8",
              borderRadius: 8,
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "0 0 auto" }}>
                <AttachFileOutlined sx={{ fontSize: 16, color: "#64748b" }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Adjuntar reporte físico
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                <Button
                  size="small" variant="outlined"
                  startIcon={<AttachFileOutlined sx={{ fontSize: 13 }} />}
                  component="label"
                  sx={{ flexShrink: 0 }}
                >
                  {form.financial_file ? "Cambiar archivo" : "Seleccionar archivo (PDF / Imagen)"}
                  <input type="file" hidden accept=".pdf,image/*"
                    onChange={e => setF("financial_file", e.target.files[0] || null)} />
                </Button>
                {form.financial_file && (
                  <Chip
                    size="small"
                    label={form.financial_file.name}
                    onDelete={() => setF("financial_file", null)}
                    icon={<AttachFileOutlined sx={{ fontSize: 12 }} />}
                  />
                )}
                {!form.financial_file && (
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>Sin archivo adjunto</span>
                )}
              </div>
            </div>

            {/* Submit */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
              <Button size="small" color="inherit" onClick={() => { setShowForm(false); setForm(initForm()); setError(""); }}>
                Cancelar
              </Button>
              <Button
                type="submit" size="small" variant="contained"
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={12} color="inherit" /> : <CheckCircleOutlined sx={{ fontSize: 14 }} />}
              >
                {submitting ? "Guardando..." : "Guardar Reporte"}
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* ── REPORT LIST ── */}
      {ConfirmDialogNode}
      
      {reports.length === 0 && !showForm ? (
        <div className={s.empty}>
          <p className={s.emptyTitle}>Sin reportes mensuales</p>
          <p className={s.emptyText}>Haz clic en "Nuevo Reporte" para registrar el primero.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {reports.map(r => {
            const totalMem = r.mem_children + r.mem_teens + r.mem_youth + r.mem_women + r.mem_men + r.mem_seniors;
            const completion = r.act_scheduled > 0 ? Math.round(r.act_done / r.act_scheduled * 100) : null;
            const balance = (r.fin_offerings + r.fin_sales + r.fin_special) - (r.fin_social_expense + r.fin_project_expense);
            return (
              <div key={r.id} style={{
                background: "var(--surface-card)", border: "1px solid var(--border)",
                borderRadius: 8, overflow: "hidden",
                transition: "box-shadow 0.15s",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid var(--border)", background: "#FAFAFA" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
                      {r.ministry_name}
                    </div>
                    <Badge variant="primary" size="sm">{r.report_month}</Badge>
                    {r.fin_report_url && (
                      <Tooltip title="Tiene reporte financiero adjunto">
                        <AttachFileOutlined sx={{ fontSize: 14, color: "var(--text-muted)" }} />
                      </Tooltip>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {new Date(r.created_at).toLocaleDateString("es-GT")} · {r.created_by}
                    </span>
                    <Tooltip title="Ver detalle">
                      <IconButton size="small" onClick={() => setSelectedReport(r)}>
                        <VisibilityOutlined sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Tooltip>
                    {isSuper && (
                      <Tooltip title="Eliminar">
                        <IconButton size="small" color="error" onClick={() => handleDelete(r.id)}>
                          <DeleteOutlined sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 0, padding: "8px 16px", flexWrap: "wrap" }}>
                  <Kpi label="Miembros" val={totalMem} />
                  <Kpi label="Actividades" val={`${r.act_done}/${r.act_scheduled}`} sub={completion !== null ? `${completion}%` : null} />
                  <Kpi label="Servicios" val={r.act_services} />
                  <Kpi label="Visitas" val={r.act_visits} />
                  <Kpi label="Reconciliados" val={r.act_reconciled} />
                  <Kpi label="Balance" val={`Q ${balance.toFixed(2)}`} color={balance >= 0 ? "var(--color-success)" : "var(--color-error)"} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────
function Section({ title, icon: Icon, colorKey, children, style = {} }) {
  return (
    <div style={{
      background: SECTION_COLORS[colorKey].bg,
      border: `1px solid ${SECTION_COLORS[colorKey].border}33`,
      borderRadius: 8, padding: 14,
      ...style,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Icon sx={{ fontSize: 15, color: SECTION_COLORS[colorKey].label }} />
        <span style={{ fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", color: SECTION_COLORS[colorKey].label }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function StatRow({ label, val, bold = false }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: bold ? 700 : 500, color: "var(--text-primary)" }}>{val}</span>
    </div>
  );
}

function Kpi({ label, val, sub, color }) {
  return (
    <div style={{ flex: "0 0 auto", paddingRight: 24, paddingTop: 4, paddingBottom: 4 }}>
      <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: color || "var(--text-primary)", lineHeight: 1.2 }}>{val}</div>
      {sub && <div style={{ fontSize: 10, color: "var(--color-success)", fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}
