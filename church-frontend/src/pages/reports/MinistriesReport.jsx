/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
/**
 * MinistriesReport.jsx
 * Admin report: consolidated view of all monthly ministry reports.
 */
import { useState, useEffect, useRef } from "react";
import {
  Box, Typography, Button, CircularProgress, Chip,
  MenuItem, TextField, Collapse, IconButton, Tooltip, Divider,
} from "@mui/material";
import {
  FilterListOutlined, ExpandMoreOutlined, ExpandLessOutlined,
  PrintOutlined, RefreshOutlined, ChurchOutlined,
  PeopleOutlined, EventNoteOutlined, MicOutlined,
  AccountBalanceWalletOutlined, AttachFileOutlined, VisibilityOutlined, TableChartOutlined
} from "@mui/icons-material";
import { getAllMonthlyReports } from "../../api/ministryWorkspace";
import { getMinistries } from "../../api/ministries";
import { API_URL } from "../../api/api";
import { useOutletContext } from "react-router-dom";
import { exportToExcel } from "./utils";

const MONTHS = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

const SECTION_COLORS = {
  membership: { bg: "rgba(16,185,129,0.08)",  border: "#10b981", label: "#059669" },
  attendance: { bg: "rgba(59,130,246,0.08)",  border: "#3b82f6", label: "#2563eb" },
  activities: { bg: "rgba(245,158,11,0.08)",  border: "#f59e0b", label: "#d97706" },
  sermons:    { bg: "rgba(236,72,153,0.08)",  border: "#ec4899", label: "#db2777" },
  finance:    { bg: "rgba(20,184,166,0.08)",  border: "#14b8a6", label: "#0d9488" },
};

const n = (v) => v ?? 0;
const Q = (v) => `Q ${(n(v)).toFixed(2)}`;

function StatRow({ label, val, bold }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "1px solid var(--border, #e5e7eb)" }}>
      <span style={{ fontSize: 12, color: "#6b7280" }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: bold ? 700 : 500, color: "#111827" }}>{val}</span>
    </div>
  );
}

function SectionBox({ colorKey, title, Icon, children, style = {} }) {
  const c = SECTION_COLORS[colorKey];
  return (
    <div style={{
      background: c.bg, border: `1px solid ${c.border}33`,
      borderRadius: 8, padding: "12px 14px", ...style,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
        <Icon sx={{ fontSize: 14, color: c.label }} />
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: c.label }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function ReportCard({ r, isExpanded, onToggle }) {
  const totalMem = [r.mem_children, r.mem_teens, r.mem_youth, r.mem_women, r.mem_men, r.mem_seniors].reduce((a, v) => a + n(v), 0);
  const totalAtt = [r.att_children, r.att_teens, r.att_youth, r.att_women, r.att_men, r.att_seniors].reduce((a, v) => a + n(v), 0);
  const totalInc = n(r.fin_offerings) + n(r.fin_sales) + n(r.fin_special);
  const totalExp = n(r.fin_social_expense) + n(r.fin_project_expense);
  const balance  = totalInc - totalExp;
  const completion = n(r.act_scheduled) > 0 ? Math.round(n(r.act_done) / n(r.act_scheduled) * 100) : null;

  return (
    <div style={{
      background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10,
      overflow: "hidden", marginBottom: 10,
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    }}>
      {/* ── Header ── */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 16px", background: "#fafafa", borderBottom: "1px solid #e5e7eb",
        cursor: "pointer",
      }} onClick={onToggle}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: "var(--color-primary)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <ChurchOutlined sx={{ fontSize: 17, color: "#fff" }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{r.ministry_name}</div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>
              {r.report_month} · Elaborado por {r.reporter_name} · {new Date(r.created_at).toLocaleDateString("es-GT")}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* KPIs rápidos */}
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <Kpi label="Miembros" val={totalMem} />
            <Kpi label="Actividades" val={`${n(r.act_done)}/${n(r.act_scheduled)}`} sub={completion !== null ? `${completion}%` : null} />
            <Kpi label="Balance" val={Q(balance)} color={balance >= 0 ? "#059669" : "#dc2626"} />
          </div>
          {r.fin_report_url && (
            <Tooltip title="Tiene reporte físico adjunto">
              <AttachFileOutlined sx={{ fontSize: 14, color: "#9ca3af" }} />
            </Tooltip>
          )}
          {isExpanded ? <ExpandLessOutlined sx={{ color: "#9ca3af" }} /> : <ExpandMoreOutlined sx={{ color: "#9ca3af" }} />}
        </div>
      </div>

      {/* ── Detalle expandible ── */}
      <Collapse in={isExpanded}>
        <div style={{ padding: "16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>

          {/* Membresía */}
          <SectionBox colorKey="membership" title="Membresía Actual" Icon={PeopleOutlined}>
            <StatRow label="Niños (4-12)"          val={n(r.mem_children)} />
            <StatRow label="Adolescentes (13-17)"  val={n(r.mem_teens)} />
            <StatRow label="Jóvenes (18-35)"       val={n(r.mem_youth)} />
            <StatRow label="Mujeres (36-60)"       val={n(r.mem_women)} />
            <StatRow label="Hombres (36-60)"       val={n(r.mem_men)} />
            <StatRow label="Adultos mayores (61+)" val={n(r.mem_seniors)} />
            <StatRow label="Total" val={totalMem} bold />
          </SectionBox>

          {/* Asistencia */}
          <SectionBox colorKey="attendance" title="Promedio de Asistencia" Icon={PeopleOutlined}>
            <StatRow label="Niños"          val={n(r.att_children)} />
            <StatRow label="Adolescentes"   val={n(r.att_teens)} />
            <StatRow label="Jóvenes"        val={n(r.att_youth)} />
            <StatRow label="Mujeres"        val={n(r.att_women)} />
            <StatRow label="Hombres"        val={n(r.att_men)} />
            <StatRow label="Adultos mayores" val={n(r.att_seniors)} />
            <StatRow label="Total promedio" val={totalAtt} bold />
          </SectionBox>

          {/* Actividades */}
          <SectionBox colorKey="activities" title="Actividades" Icon={EventNoteOutlined}>
            <StatRow label="Agendadas"    val={n(r.act_scheduled)} />
            <StatRow label="Realizadas"   val={n(r.act_done)} />
            <StatRow label="Servicios"    val={n(r.act_services)} />
            <StatRow label="Ayunos"       val={n(r.act_fasts)} />
            <StatRow label="Visitas"      val={n(r.act_visits)} />
            <StatRow label="Ventas"       val={n(r.act_sales)} />
            <StatRow label="Reconciliados" val={n(r.act_reconciled)} />
            <StatRow label="Reuniones"    val={n(r.act_meetings)} />
          </SectionBox>

          {/* Sermones */}
          <SectionBox colorKey="sermons" title="Sermones Predicados" Icon={MicOutlined}>
            {[1,2,3,4,5].map(i => {
              const t = r[`sermon_week${i}`];
              return t ? <StatRow key={i} label={`Semana ${i}`} val={t} /> : null;
            })}
            {![r.sermon_week1, r.sermon_week2, r.sermon_week3, r.sermon_week4, r.sermon_week5].some(Boolean) && (
              <span style={{ fontSize: 12, color: "#9ca3af" }}>Sin sermones registrados</span>
            )}
          </SectionBox>

          {/* Financiero */}
          <SectionBox colorKey="finance" title="Área Financiera" Icon={AccountBalanceWalletOutlined} style={{ gridColumn: "2 / 4" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Ingresos</div>
                <StatRow label="Ofrendas"           val={Q(r.fin_offerings)} />
                <StatRow label="Ventas"             val={Q(r.fin_sales)} />
                <StatRow label="Ofrendas especiales" val={Q(r.fin_special)} />
                <StatRow label="Total ingresos"     val={Q(totalInc)} bold />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Egresos</div>
                <StatRow label="Acción social"        val={Q(r.fin_social_expense)} />
                <StatRow label="Proyectos especiales" val={Q(r.fin_project_expense)} />
                <StatRow label="Total egresos"        val={Q(totalExp)} bold />
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px dashed #d1fae5", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Balance neto</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: balance >= 0 ? "#059669" : "#dc2626" }}>{Q(balance)}</span>
                </div>
              </div>
            </div>
            {r.fin_report_url && (
              <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid #e5e7eb" }}>
                <a
                  href={`${API_URL}${r.fin_report_url}`}
                  target="_blank" rel="noreferrer"
                  style={{ fontSize: 12, color: "#2563eb", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}
                >
                  <AttachFileOutlined sx={{ fontSize: 13 }} /> Ver reporte físico adjunto
                </a>
              </div>
            )}
          </SectionBox>
        </div>
      </Collapse>
    </div>
  );
}

function Kpi({ label, val, sub, color }) {
  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 800, color: color || "#111827", lineHeight: 1.2 }}>{val}</div>
      {sub && <div style={{ fontSize: 10, color: "#059669", fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}

export default function MinistriesReport() {
  const { settings } = useOutletContext();
  const [reports, setReports]         = useState([]);
  const [ministries, setMinistries]   = useState([]);
  const [loading, setLoading]         = useState(false);
  const [loaded, setLoaded]           = useState(false);
  const [filterMonth, setFilterMonth] = useState("");
  const [filterMin, setFilterMin]     = useState("");
  const [expanded, setExpanded]       = useState({});
  const printRef = useRef();

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterMonth) params.month = filterMonth;
      if (filterMin)   params.ministry_name = filterMin;
      const [rRes, mRes] = await Promise.all([
        getAllMonthlyReports(params),
        getMinistries(),
      ]);
      setReports(rRes.data);
      setMinistries(mRes.data);
      setLoaded(true);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const handleExpandAll = () => {
    const all = {};
    reports.forEach(r => all[r.id] = true);
    setExpanded(all);
  };

  const handleCollapseAll = () => setExpanded({});

  const handlePrint = () => {
    // Expand all before printing
    handleExpandAll();
    setTimeout(() => window.print(), 200);
  };

  const handleExcel = () => {
    const rows = [
      ["CONSOLIDADO DE MINISTERIOS", filterMonth || "Todos", filterMin || "Todos"],
      [],
      ["MINISTERIO", "MES", "CREADO POR", "NIÑOS", "ADOLESCENTES", "JÓVENES", "MUJERES", "HOMBRES", "ANCIANOS", "TOTAL MIEMBROS", "INGRESOS", "EGRESOS", "BALANCE"]
    ];
    reports.forEach(r => {
      const tMem = [r.mem_children, r.mem_teens, r.mem_youth, r.mem_women, r.mem_men, r.mem_seniors].reduce((a, v) => a + n(v), 0);
      const tInc = n(r.fin_offerings) + n(r.fin_sales) + n(r.fin_special);
      const tExp = n(r.fin_social_expense) + n(r.fin_project_expense);
      rows.push([
        r.ministry_name, r.report_month, r.reporter_name,
        n(r.mem_children), n(r.mem_teens), n(r.mem_youth), n(r.mem_women), n(r.mem_men), n(r.mem_seniors), tMem,
        tInc, tExp, tInc - tExp
      ]);
    });
    exportToExcel(`Consolidado_Ministerios`, rows);
  };

  // ── Aggregated totals ───────────────────────────────────────────────────
  const totals = reports.reduce((acc, r) => {
    acc.members    += [r.mem_children, r.mem_teens, r.mem_youth, r.mem_women, r.mem_men, r.mem_seniors].reduce((a, v) => a + n(v), 0);
    acc.activities += n(r.act_done);
    acc.services   += n(r.act_services);
    acc.income     += n(r.fin_offerings) + n(r.fin_sales) + n(r.fin_special);
    acc.expense    += n(r.fin_social_expense) + n(r.fin_project_expense);
    return acc;
  }, { members: 0, activities: 0, services: 0, income: 0, expense: 0 });

  return (
    <Box>
      {/* ── Control bar ── */}
      <Box sx={{
        display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap",
        p: 2, mb: 3, bgcolor: "white", borderRadius: 1, border: "1px solid #e5e7eb",
      }}>
        <ChurchOutlined color="primary" sx={{ fontSize: 28 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" fontWeight={800} lineHeight={1.2}>Reportes de Ministerios</Typography>
          <Typography variant="caption" color="text.secondary">Consolidado mensual de todos los ministerios</Typography>
        </Box>

        <TextField
          select size="small" label="Mes" value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)} sx={{ minWidth: 140 }}
        >
          <MenuItem value="">Todos los meses</MenuItem>
          {MONTHS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
        </TextField>

        <TextField
          select size="small" label="Ministerio" value={filterMin}
          onChange={e => setFilterMin(e.target.value)} sx={{ minWidth: 180 }}
        >
          <MenuItem value="">Todos</MenuItem>
          {ministries.map(m => <MenuItem key={m.id} value={m.name}>{m.name}</MenuItem>)}
        </TextField>

        <Button
          variant="contained" size="small"
          startIcon={loading ? <CircularProgress size={13} color="inherit" /> : <FilterListOutlined sx={{ fontSize: 14 }} />}
          onClick={load} disabled={loading}
        >
          {loading ? "Cargando..." : "Aplicar filtros"}
        </Button>

        <Tooltip title="Actualizar">
          <IconButton size="small" onClick={load} disabled={loading}><RefreshOutlined sx={{ fontSize: 17 }} /></IconButton>
        </Tooltip>
        <Tooltip title="Exportar Excel">
          <IconButton size="small" onClick={handleExcel} disabled={reports.length === 0}><TableChartOutlined sx={{ fontSize: 17, color: "#059669" }} /></IconButton>
        </Tooltip>
        <Tooltip title="Exportar PDF Oficial">
          <IconButton size="small" onClick={handlePrint} disabled={reports.length === 0}><PrintOutlined sx={{ fontSize: 17 }} /></IconButton>
        </Tooltip>
      </Box>

      {/* ── KPI summary bar ── */}
      {loaded && reports.length > 0 && (
        <Box sx={{
          display: "flex", gap: 0, mb: 3, bgcolor: "white",
          border: "1px solid #e5e7eb", borderRadius: 1, overflow: "hidden",
        }}>
          {[
            { label: "Reportes",     val: reports.length,        color: "#6366f1" },
            { label: "Total Miembros",  val: totals.members,     color: "#10b981" },
            { label: "Actividades",  val: totals.activities,     color: "#f59e0b" },
            { label: "Servicios",    val: totals.services,       color: "#3b82f6" },
            { label: "Total Ingresos",  val: `Q ${totals.income.toFixed(2)}`,  color: "#059669" },
            { label: "Total Egresos",   val: `Q ${totals.expense.toFixed(2)}`, color: "#dc2626" },
            { label: "Balance Neto",    val: `Q ${(totals.income - totals.expense).toFixed(2)}`,
              color: totals.income >= totals.expense ? "#059669" : "#dc2626" },
          ].map((k, i) => (
            <div key={i} style={{
              flex: 1, padding: "12px 16px", borderRight: "1px solid #e5e7eb",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{k.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: k.color }}>{k.val}</div>
            </div>
          ))}
        </Box>
      )}

      {/* ── Report list ── */}
      {!loaded && !loading && (
        <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
          <ChurchOutlined sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
          <Typography>Haz clic en <strong>"Aplicar filtros"</strong> para cargar los reportes.</Typography>
        </Box>
      )}

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={32} />
        </Box>
      )}

      {loaded && !loading && (
        <>
          {reports.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
              <ChurchOutlined sx={{ fontSize: 48, mb: 1, opacity: 0.2 }} />
              <Typography fontWeight={600}>Sin reportes para los filtros seleccionados</Typography>
              <Typography variant="caption">Prueba con otro mes o ministerio.</Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {reports.length} reporte{reports.length !== 1 ? "s" : ""} encontrado{reports.length !== 1 ? "s" : ""}
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button size="small" variant="outlined" onClick={handleExpandAll}>Expandir todo</Button>
                  <Button size="small" variant="outlined" onClick={handleCollapseAll}>Colapsar todo</Button>
                </Box>
              </Box>
              <div ref={printRef}>
                {reports.map(r => (
                  <ReportCard
                    key={r.id}
                    r={r}
                    isExpanded={!!expanded[r.id]}
                    onToggle={() => toggle(r.id)}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </Box>
  );
}
