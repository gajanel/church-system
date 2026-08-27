import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getMembers } from "../api/members";
import { getMinistries } from "../api/ministries";
import { getOfferings, getIncomes, getExpenses, getMonthlySummary } from "../api/finance";
import { getPublicSettings } from "../api/settings";
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Box, Typography
} from "@mui/material";
import { TrendingUp, TrendingDown, People, AccountBalance, AccountBalanceWallet } from "@mui/icons-material";

import { Card, CardHeader, CardBody } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { PageHeader } from "../components/ui/PageHeader";
import { DashboardSkeleton } from "../components/ui/SkeletonLoader";
import styles from "./Dashboard.module.css";

const THIS_MONTH = new Date().getMonth() + 1;
const THIS_YEAR  = new Date().getFullYear();
const MONTH_NAME = new Date().toLocaleDateString("es-GT", { month: "long", year: "numeric" });

/* ── Utilidad ── */
const fmt = (n) => `Q ${parseFloat(n || 0).toFixed(2)}`;

/* ══════════════════════════════════════════════════════════════
   Gráfico de barras — Snipe-IT Style
   ══════════════════════════════════════════════════════════════ */
function BarChart({ data }) {
  if (!data?.length) return <div className={styles.emptyState}>Sin datos disponibles</div>;
  const maxVal = Math.max(...data.map(d => d.value), 10);
  return (
    <div className={styles.barChart} style={{ padding: '20px 10px' }}>
      <div className={styles.barGrid}>
        {[...Array(4)].map((_, i) => <div key={i} className={styles.barGridLine} />)}
      </div>
      {data.map((d, i) => {
        const pct = (d.value / maxVal) * 100;
        return (
          <div key={i} className={styles.barGroup} style={{ zIndex: 1 }}>
            <span className={styles.barValue} style={{ fontWeight: 700, color: d.color }}>Q{(d.value / 1000).toFixed(1)}k</span>
            <div className={styles.bar} style={{ 
              height: `${Math.max(pct, 2)}%`, 
              background: `linear-gradient(to top, ${d.color}, ${d.color}cc)`,
              borderRadius: '4px 4px 0 0',
              boxShadow: `0 4px 12px ${d.color}33`,
              transition: 'height 1s cubic-bezier(0.4, 0, 0.2, 1)'
            }} />
            <span className={styles.barLabel} style={{ fontWeight: 600 }}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Gauge SVG — Snipe-IT Style
   ══════════════════════════════════════════════════════════════ */
function GaugeChart({ value, max = 10000, label = "Avance" }) {
  const hasGoal = max > 0;
  const pct = hasGoal ? Math.min(100, Math.max(0, ((value || 0) / max) * 100)) : 0;

  let color = "var(--text-muted)";
  if (hasGoal && pct < 40)       color = "var(--color-error)";
  else if (hasGoal && pct < 75)  color = "var(--color-warning)";
  else if (hasGoal && pct >= 75) color = "var(--color-success)";

  const statusText = !hasGoal
    ? "Sin meta"
    : pct < 40 ? "Bajo" : pct < 75 ? "Medio" : "Excelente";

  const R = 75, sw = 14, C = 2 * Math.PI * R;
  // When there's no goal, don't draw any arc — just show the background track
  const offset = hasGoal ? C - (pct / 100) * C : C;

  return (
    <div className={styles.chartWrap}>
      <svg width="220" height="220" viewBox="0 0 200 200">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity="0.8" />
          </linearGradient>
        </defs>
        {/* Background track */}
        <circle cx="100" cy="100" r={R} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth={sw} />
        {/* Progress arc — hidden when no goal */}
        {hasGoal && (
          <circle
            cx="100" cy="100" r={R} fill="none" stroke="url(#gaugeGradient)" strokeWidth={sw}
            strokeDasharray={C} strokeDashoffset={offset} strokeLinecap="round"
            transform="rotate(-90 100 100)"
            style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)" }}
          />
        )}
        <text x="100" y="93" textAnchor="middle" fontSize="34" fontWeight="900" fill="var(--text-primary)" fontFamily="Outfit, sans-serif">
          {hasGoal ? `${Math.round(pct)}%` : "—"}
        </text>
        <text x="100" y="113" textAnchor="middle" fontSize="11" fontWeight="700" fill={color}>
          {statusText}
        </text>
        <text x="100" y="132" textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--text-muted)">
          {label}
        </text>
      </svg>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Pie / Donut SVG — Snipe-IT Style
   ══════════════════════════════════════════════════════════════ */
function DonutChart({ value, max }) {
  const hasGoal = max > 0;
  const pct     = hasGoal ? Math.min(100, Math.max(0, ((value || 0) / max) * 100)) : 0;
  const deficit  = hasGoal ? Math.max(0, 100 - pct) : 0;

  // Neutral grey when no goal is set; green/red split when there is a goal
  const bgGradient = !hasGoal
    ? `conic-gradient(rgba(0,0,0,0.07) 0% 100%)`
    : pct === 0
      ? `conic-gradient(rgba(0,0,0,0.07) 0% 100%)`  // no income yet — don't paint red
      : `conic-gradient(var(--color-success) 0% ${pct}%, rgba(0,0,0,0.07) ${pct}% 100%)`;

  return (
    <div className={styles.chartWrap} style={{ flexDirection: "column", gap: 20 }}>
      <div style={{
        width: 150, height: 150, borderRadius: "50%",
        background: bgGradient,
        position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
      }}>
        <div style={{
          width: 100, height: 100, background: "var(--surface-card)", borderRadius: "50%",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          border: '1px solid var(--border)'
        }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: "var(--text-primary)", lineHeight: 1 }}>
            {hasGoal ? `${Math.round(pct)}%` : "—"}
          </span>
          <span style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 700, textTransform: 'uppercase' }}>
            {hasGoal ? "Logrado" : "Sin meta"}
          </span>
        </div>
      </div>

      {hasGoal ? (
        <div style={{ display: "flex", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 10, height: 10, background: "var(--color-success)", borderRadius: "2px" }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: 'uppercase' }}>Logrado</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-primary)" }}>{Math.round(pct)}%</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 10, height: 10, background: "rgba(0,0,0,0.15)", borderRadius: "2px" }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: 'uppercase' }}>Restante</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-primary)" }}>{Math.round(deficit)}%</span>
            </div>
          </div>
        </div>
      ) : (
        <span style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>
          Configure una meta mensual para ver el análisis
        </span>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Dashboard principal
   ══════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const location = useLocation();
  const [summary, setSummary]             = useState(null);
  const [members, setMembers]             = useState([]);
  const [ministries, setMinistries]       = useState([]);
  const [recentOfferings, setOfferings]   = useState([]);
  const [recentExpenses, setExpenses]     = useState([]);
  const [sysSettings, setSysSettings]    = useState(null);

  useEffect(() => {
    getPublicSettings().then(r => setSysSettings(r.data)).catch(() => {});
    Promise.all([
      getMonthlySummary(THIS_MONTH, THIS_YEAR),
      getMembers(1, 1000),
      getMinistries(),
      getOfferings(1, 10),
      getIncomes(1, 10),
      getExpenses(1, 10),
    ]).then(([s, m, min, o, _i, e]) => {
      setSummary(s?.data || {});
      setMembers(m?.data?.items || []);
      setMinistries(min?.data || []);
      setOfferings(o?.data?.items?.slice(0, 3) || []);
      setExpenses(e?.data?.items?.slice(0, 2) || []);
    }).catch(err => {
      console.error("Dashboard loading error:", err);
    });
  }, [location.key]);

  if (!summary) return <DashboardSkeleton />;

  const activeMembers     = members.filter(m => m.status === "active").length;
  const INCOME_GOAL       = summary.monthly_goal || 0;
  const totalIncome       = summary.total_offerings || 0;

  const METRICS = [
    {
      label: "Caja de Ofrendas",
      value: fmt(summary.cash_balance),
      sub: "Aún no ingresado a bancos",
      subClass: styles.textMuted,
      icon: <AccountBalanceWallet sx={{ fontSize: 18 }} />,
      iconClass: styles.iconPrimary,
    },
    {
      label: "Balance del Mes",
      value: fmt(summary.balance),
      sub: summary.balance >= 0 ? "↑ Superávit" : "↓ Déficit",
      subClass: summary.balance >= 0 ? styles.textSuccess : styles.textError,
      icon: <TrendingUp sx={{ fontSize: 18 }} />,
      iconClass: summary.balance >= 0 ? styles.iconSuccess : styles.iconError,
    },
    {
      label: "Total Ofrendas",
      value: fmt(summary.total_offerings),
      sub: "Este mes",
      subClass: styles.textSuccess,
      icon: <AccountBalance sx={{ fontSize: 18 }} />,
      iconClass: styles.iconSuccess,
    },
    {
      label: "Total Gastos",
      value: fmt(summary.total_expenses),
      sub: "Este mes",
      subClass: styles.textError,
      icon: <TrendingDown sx={{ fontSize: 18 }} />,
      iconClass: styles.iconError,
    },
    {
      label: "Miembros Activos",
      value: activeMembers,
      sub: `de ${members.length} en total`,
      subClass: styles.textMuted,
      icon: <People sx={{ fontSize: 18 }} />,
      iconClass: styles.iconNeutral,
    },
  ];

  const CHART_DATA = [
    { label: "Ofrendas",   value: summary.total_offerings || 0, color: "#2563eb" },
    { label: "Ingresos",   value: summary.total_incomes || 0,   color: "#10b981" },
    { label: "Gastos",     value: summary.total_expenses || 0,  color: "#ef4444" },
  ];

  const capMonth = MONTH_NAME.charAt(0).toUpperCase() + MONTH_NAME.slice(1);

  return (
    <div className={styles.page}>
      <PageHeader
        title="Inicio"
        subtitle={`Supervisión financiera y administrativa — ${capMonth}`}
      />

      {/* ── Banner de Versículo Bíblico ── */}
      {sysSettings?.bible_verse && (
        <Box sx={{ 
          mb: 3,
          mt: 0.5,
          p: "12px 16px",
          borderRadius: 1,
          background: "#fff",
          border: "1px solid var(--border)",
          borderLeft: "4px solid var(--color-primary)",
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}>
          <Typography variant="body2" sx={{ 
            fontStyle: 'italic', 
            color: '#50575e',
            fontSize: '0.85rem',
            lineHeight: 1.5,
          }}>
            {sysSettings.bible_verse}
          </Typography>
        </Box>
      )}

      {/* ── Métricas ── */}
      <div className={styles.metricsTabs}>
        {METRICS.map((m, i) => (
          <div key={i} className={styles.metricTab}>
            <span className={styles.metricLabel}>{m.label}</span>
            <div className={styles.metricValue}>{m.value}</div>
            <div className={`${styles.metricSub} ${m.subClass}`}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Gráficos ── */}
      <div className={styles.chartsGrid}>
        <Card>
          <CardHeader
            title="Distribución Mensual"
            action={<Badge variant="primary">Actual</Badge>}
          />
          <CardBody>
            <BarChart data={CHART_DATA} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Meta de Ingresos"
            action={<Badge variant="warning">Q{INCOME_GOAL}</Badge>}
          />
          <CardBody>
            <GaugeChart value={totalIncome} max={INCOME_GOAL} label="Avance de Ofrendas" />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Análisis de Déficit" />
          <CardBody>
            <DonutChart value={totalIncome} max={INCOME_GOAL} />
          </CardBody>
        </Card>
      </div>

      {/* ── Tablas + Info ── */}
      <div className={styles.bottomGrid}>
        {/* Transacciones recientes */}
        <Card>
          <CardHeader title="Transacciones Recientes" />
          <CardBody noPad>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Concepto</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell align="right">Monto</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentOfferings.map(o => (
                    <TableRow key={`o-${o.id}`}>
                      <TableCell>{o.date}</TableCell>
                      <TableCell>Ofrenda {o.offering_type === "servicio" ? "de Servicio" : "Especial"}</TableCell>
                      <TableCell><Badge variant="primary" size="sm">Ofrenda</Badge></TableCell>
                      <TableCell align="right" style={{ fontWeight: 600, color: "var(--color-success)" }}>+{fmt(o.amount)}</TableCell>
                    </TableRow>
                  ))}
                  {recentExpenses.map(e => (
                    <TableRow key={`e-${e.id}`}>
                      <TableCell>{e.date}</TableCell>
                      <TableCell>{e.expense_type}</TableCell>
                      <TableCell><Badge variant="error" size="sm">Gasto</Badge></TableCell>
                      <TableCell align="right" style={{ fontWeight: 600, color: "var(--color-error)" }}>-{fmt(e.amount)}</TableCell>
                    </TableRow>
                  ))}
                  {recentOfferings.length === 0 && recentExpenses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center" style={{ color: "var(--text-muted)", padding: "32px 16px" }}>
                        Sin transacciones recientes
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardBody>
        </Card>

        {/* Estado administrativo */}
        <Card>
          <CardHeader title="Estado Administrativo" />
          <CardBody>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Total Ministerios</span>
              <span className={styles.statValue}>{ministries.length}</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Miembros Activos</span>
              <span className={styles.statValue}>{activeMembers}</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Miembros Inactivos</span>
              <span className={styles.statValue}>{members.length - activeMembers}</span>
            </div>

            <div className={styles.sectionLabel}>Ministerios</div>

            {ministries.length === 0 ? (
              <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
                Sin ministerios registrados.
              </p>
            ) : (
              ministries.slice(0, 4).map(m => (
                <div key={m.id} className={styles.ministryRow}>
                  <span className={styles.ministryName}>
                    <AccountBalance sx={{ fontSize: 13, color: "var(--color-primary)" }} />
                    {m.name}
                  </span>
                  <Badge variant="ghost" size="sm">{m.roles?.length || 0} roles</Badge>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}