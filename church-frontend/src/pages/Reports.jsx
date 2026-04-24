import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import API from "../api/api";
import { 
  Box, Typography, Button, Grid, Card, CardContent, Tabs, Tab, 
  Select, MenuItem, FormControl, InputLabel, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Paper, Chip, LinearProgress,
  Autocomplete, TextField
} from "@mui/material";
import { 
  Assessment, Print, PeopleAlt, AccountBalanceWallet, 
  Assignment, CalendarMonth, LocalOffer, EventAvailable, WarningAmber
} from "@mui/icons-material";
import { getSettings } from "../api/settings";

// ─── Utilidades ────────────────────────────────────────────
const fmt = (n) => `Q ${parseFloat(n || 0).toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const nowYear = new Date().getFullYear();
const nowMonth = new Date().getMonth() + 1;
const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

// ─── Mini Gráfico de Barras Verticales ─────────────────────
const VerticalBars = ({ data, isCurrency = true }) => {
  if (!data || !data.length) return <Typography color="text.secondary" textAlign="center" py={3}>Sin datos</Typography>;
  const max = Math.max(...data.map(d => d.value), 1);
  const colors = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#06b6d4","#84cc16"];
  
  return (
    <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "space-around", height: 180, pb: 3, pt: 1, position: "relative" }}>
      <Box sx={{ position: "absolute", top: 10, left: 0, right: 0, bottom: 24, display: "flex", flexDirection: "column", justifyContent: "space-between", pointerEvents: "none" }}>
        {[...Array(4)].map((_, i) => <Box key={i} sx={{ borderTop: i === 3 ? "1px solid" : "1px dashed", borderColor: i === 3 ? "divider" : "grey.300", width: "100%" }} />)}
      </Box>
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        const displayValue = isCurrency 
          ? `Q${parseFloat(d.value).toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : d.value.toLocaleString("es-GT");
        
        return (
          <Box key={i} sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5, zIndex: 1, flex: 1 }}>
            <Typography variant="caption" fontWeight="700" color="text.secondary" sx={{ fontSize: 10 }}>{displayValue}</Typography>
            <Box sx={{ width: "70%", maxWidth: 40, height: `${pct}%`, background: d.color || colors[i % colors.length], borderRadius: "4px 4px 0 0", transition: "height 0.5s ease", minHeight: pct > 0 ? 4 : 0 }} />
            <Typography variant="caption" color="text.secondary" align="center" sx={{ fontSize: 10, lineHeight: 1.1 }}>{d.label}</Typography>
          </Box>
        );
      })}
    </Box>
  );
};

// ─── Utilidades PDF compartidas ────────────────────────────
const PDF_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 20px 28px; }
  .pdf-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid #1e3a8a; }
  .pdf-header-center { text-align: center; flex: 1; }
  .pdf-header-center h1 { font-size: 14px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .pdf-header-center .org { font-size: 12px; font-weight: 700; color: #111; line-height: 1.5; }
  .pdf-header-center .period { font-size: 11px; color: #555; margin-top: 4px; font-weight: 400; }
  .pdf-logo { width: 68px; text-align: right; }
  .pdf-logo img { width: 60px; height: auto; object-fit: contain; }
  .section-title { font-size: 11px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.8px; margin: 14px 0 6px; border-left: 3px solid #1e3a8a; padding-left: 8px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
  thead tr { background: #1e3a8a; color: #fff; }
  thead th { padding: 6px 8px; font-size: 11px; font-weight: 700; text-align: left; }
  thead th.right { text-align: right; }
  thead th.center { text-align: center; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  tbody td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
  tbody td.right { text-align: right; }
  tbody td.center { text-align: center; }
  tbody td.bold { font-weight: 700; }
  tbody td.green { color: #16a34a; font-weight: 700; }
  tbody td.red { color: #dc2626; font-weight: 700; }
  tbody td.blue { color: #1d4ed8; font-weight: 700; }
  .totals-row td { font-weight: 800; background: #eff6ff; border-top: 2px solid #1e3a8a; }
  .summary-box { display: flex; justify-content: flex-end; margin-top: 10px; }
  .summary-table { border-collapse: collapse; min-width: 240px; }
  .summary-table td { padding: 4px 10px; border: 1px solid #ddd; font-size: 11px; }
  .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 14px; }
  .metric-card { border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; text-align: center; }
  .metric-card .label { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .metric-card .value { font-size: 18px; font-weight: 800; color: #1e293b; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 10px; font-weight: 700; }
  .badge-green { background: #dcfce7; color: #16a34a; }
  .badge-blue { background: #dbeafe; color: #1d4ed8; }
  .badge-yellow { background: #fef9c3; color: #ca8a04; }
  .badge-red { background: #fee2e2; color: #dc2626; }
  .badge-gray { background: #f1f5f9; color: #475569; }
  .pdf-footer { margin-top: 18px; font-size: 9.5px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 6px; text-align: right; }
  @media print { body { padding: 8px 14px; } @page { margin: 1cm; size: A4 portrait; } }
`;

const pdfHeader = (title, config, period = "") => {
  const name = config?.church_name || "IGLESIA";
  const addr = config?.church_address || "";
  const logoUrl = config?.church_logo_url || "";
  const logoHtml = logoUrl ? `<img src="${logoUrl}" onerror="this.style.display='none'" alt="Logo" />` : "";
  return `
    <div class="pdf-header">
      <div style="width:68px"></div>
      <div class="pdf-header-center">
        <h1>${title}</h1>
        <div class="org">${name}${addr ? `<br/>${addr}` : ""}</div>
        ${period ? `<div class="period">${period}</div>` : ""}
      </div>
      <div class="pdf-logo">${logoHtml}</div>
    </div>`;
};

const pdfOpen = (title, config, period = "") => {
  const win = window.open("", "_blank");
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title><style>${PDF_STYLES}</style></head><body>${pdfHeader(title, config, period)}`);
  return win;
};

const pdfClose = (win, config) => {
  const name = config?.church_name || "Sistema de Gestión Ministerial";
  win.document.write(`<div class="pdf-footer">Documento generado el ${new Date().toLocaleDateString("es-GT")} a las ${new Date().toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })} &nbsp;|&nbsp; ${name}</div></body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 400);
};

// ─── PDF: Reporte Financiero Mensual ──────────────────────
const printFinancialMonthlyPDF = (data, month, year, config) => {
  const fmtQ = n => `Q ${parseFloat(n || 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`;
  const period = `Período: ${MONTHS_ES[month - 1].toUpperCase()} ${year}`;
  const win = pdfOpen("Informe Financiero Mensual", config, period);

  // Métricas resumen
  const bal = data.summary.balance;
  const balColor = bal >= 0 ? "#16a34a" : "#dc2626";
  win.document.write(`
    <div class="metrics-grid">
      <div class="metric-card"><div class="label">Total Ofrendas</div><div class="value" style="color:#1d4ed8">${fmtQ(data.summary.total_offerings)}</div></div>
      <div class="metric-card"><div class="label">Otros Ingresos</div><div class="value" style="color:#16a34a">${fmtQ(data.summary.total_incomes)}</div></div>
      <div class="metric-card"><div class="label">Total Gastos</div><div class="value" style="color:#dc2626">${fmtQ(data.summary.total_expenses)}</div></div>
      <div class="metric-card"><div class="label">Balance Neto</div><div class="value" style="color:${balColor}">${fmtQ(bal)}</div></div>
    </div>`);

  // Tabla de ofrendas
  if (data.transactions.offerings.length > 0) {
    win.document.write(`<div class="section-title">Ofrendas del Período</div>
      <table><thead><tr><th>Fecha</th><th>Tipo</th><th>Donante</th><th class="right">Monto</th></tr></thead><tbody>`);
    data.transactions.offerings.forEach(o => {
      win.document.write(`<tr><td>${o.date}</td><td>${o.type === "servicio" ? "Ofrenda de Servicio" : "Ofrenda Especial"}</td><td>${o.donor || "—"}</td><td class="right green">${fmtQ(o.amount)}</td></tr>`);
    });
    win.document.write(`</tbody></table>`);
  }

  // Tabla de ingresos
  if (data.transactions.incomes.length > 0) {
    win.document.write(`<div class="section-title">Ingresos Adicionales</div>
      <table><thead><tr><th>Fecha</th><th>Tipo</th><th>Origen</th><th class="right">Monto</th></tr></thead><tbody>`);
    data.transactions.incomes.forEach(i => {
      win.document.write(`<tr><td>${i.date}</td><td>${i.type}</td><td>${i.donor || "—"}</td><td class="right green">${fmtQ(i.amount)}</td></tr>`);
    });
    win.document.write(`</tbody></table>`);
  }

  // Tabla de gastos
  if (data.transactions.expenses.length > 0) {
    win.document.write(`<div class="section-title">Egresos / Gastos</div>
      <table><thead><tr><th>Fecha</th><th>Rubro</th><th>Observaciones</th><th class="right">Monto</th></tr></thead><tbody>`);
    data.transactions.expenses.forEach(e => {
      win.document.write(`<tr><td>${e.date}</td><td>${e.type}</td><td>${e.observations || "—"}</td><td class="right red">${fmtQ(e.amount)}</td></tr>`);
    });
    win.document.write(`</tbody></table>`);
  }

  pdfClose(win, config);
};

// ─── PDF: Reporte Financiero Anual ────────────────────────
const printFinancialAnnualPDF = (data, year, config) => {
  const fmtQ = n => `Q ${parseFloat(n || 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`;
  const win = pdfOpen("Informe Financiero Anual", config, `Año: ${year}`);

  // Totales anuales
  const t = data.year_totals;
  const balColor = t.balance >= 0 ? "#16a34a" : "#dc2626";
  win.document.write(`
    <div class="metrics-grid">
      <div class="metric-card"><div class="label">Total Ofrendas</div><div class="value" style="color:#1d4ed8">${fmtQ(t.total_offerings)}</div></div>
      <div class="metric-card"><div class="label">Otros Ingresos</div><div class="value" style="color:#16a34a">${fmtQ(t.total_incomes)}</div></div>
      <div class="metric-card"><div class="label">Total Gastos</div><div class="value" style="color:#dc2626">${fmtQ(t.total_expenses)}</div></div>
      <div class="metric-card"><div class="label">Balance Anual</div><div class="value" style="color:${balColor}">${fmtQ(t.balance)}</div></div>
    </div>`);

  win.document.write(`<div class="section-title">Desglose Mensual ${year}</div>
    <table>
      <thead><tr>
        <th>Mes</th>
        <th class="right">Ofrendas</th>
        <th class="right">Ingresos</th>
        <th class="right">Gastos</th>
        <th class="right">Balance</th>
      </tr></thead>
      <tbody>`);

  data.monthly_breakdown.forEach(row => {
    const balance = row.balance;
    const balClass = balance >= 0 ? "green" : "red";
    win.document.write(`<tr>
      <td class="bold">${MONTHS_ES[row.month - 1]}</td>
      <td class="right">${row.total_offerings > 0 ? fmtQ(row.total_offerings) : "—"}</td>
      <td class="right">${row.total_incomes > 0 ? fmtQ(row.total_incomes) : "—"}</td>
      <td class="right">${row.total_expenses > 0 ? fmtQ(row.total_expenses) : "—"}</td>
      <td class="right ${balClass}">${fmtQ(balance)}</td>
    </tr>`);
  });

  win.document.write(`<tr class="totals-row">
    <td class="bold">TOTALES</td>
    <td class="right blue">${fmtQ(t.total_offerings)}</td>
    <td class="right green">${fmtQ(t.total_incomes)}</td>
    <td class="right red">${fmtQ(t.total_expenses)}</td>
    <td class="right" style="color:${balColor}">${fmtQ(t.balance)}</td>
  </tr></tbody></table>`);

  pdfClose(win, config);
};

// ─── PDF: Reporte de Miembros ──────────────────────────────
const printMembersPDF = (data, config) => {
  const today = new Date().toLocaleDateString("es-GT", { day: "numeric", month: "long", year: "numeric" });
  const win = pdfOpen("Directorio de Feligreses", config, `Generado el ${today}`);

  // Resumen
  win.document.write(`
    <div class="metrics-grid" style="grid-template-columns: repeat(3,1fr)">
      <div class="metric-card"><div class="label">Total Miembros</div><div class="value">${data.summary.total}</div></div>
      <div class="metric-card"><div class="label">Activos</div><div class="value" style="color:#16a34a">${data.summary.active}</div></div>
      <div class="metric-card"><div class="label">Inactivos</div><div class="value" style="color:#94a3b8">${data.summary.inactive}</div></div>
    </div>`);

  // Cumpleaños del mes
  if (data.birthdays_this_month.length > 0) {
    win.document.write(`<div class="section-title">🎂 Cumpleaños Este Mes</div>
      <table><thead><tr><th>Nombre</th><th>Fecha de Nacimiento</th><th>Teléfono</th></tr></thead><tbody>`);
    data.birthdays_this_month.forEach(m => {
      win.document.write(`<tr><td class="bold">${m.name}</td><td>${m.birth_date || "—"}</td><td>${m.phone || "—"}</td></tr>`);
    });
    win.document.write(`</tbody></table>`);
  }

  // Aniversarios de bautismo
  if (data.baptism_anniversaries_this_month.length > 0) {
    win.document.write(`<div class="section-title">✝ Aniversarios de Bautismo Este Mes</div>
      <table><thead><tr><th>Nombre</th><th>Fecha de Bautismo</th><th>Teléfono</th></tr></thead><tbody>`);
    data.baptism_anniversaries_this_month.forEach(m => {
      win.document.write(`<tr><td class="bold">${m.name}</td><td>${m.baptism_date || "—"}</td><td>${m.phone || "—"}</td></tr>`);
    });
    win.document.write(`</tbody></table>`);
  }

  // Lista completa de miembros
  win.document.write(`<div class="section-title">Directorio Completo (${data.summary.total} miembros)</div>
    <table><thead><tr>
      <th>#</th><th>Nombre Completo</th><th>Teléfono</th><th>Email</th>
      <th class="center">Estado</th><th>F. Nacimiento</th><th>F. Bautismo</th>
    </tr></thead><tbody>`);

  data.members.forEach((m, i) => {
    const statusBadge = m.status === "active"
      ? `<span class="badge badge-green">Activo</span>`
      : `<span class="badge badge-gray">Inactivo</span>`;
    win.document.write(`<tr>
      <td class="center">${i + 1}</td>
      <td class="bold">${m.name}</td>
      <td>${m.phone || "—"}</td>
      <td>${m.email || "—"}</td>
      <td class="center">${statusBadge}</td>
      <td>${m.birth_date || "—"}</td>
      <td>${m.baptism_date || "—"}</td>
    </tr>`);
  });

  win.document.write(`</tbody></table>`);
  pdfClose(win, config);
};

// ─── PDF: Reporte de Proyectos ─────────────────────────────
const printProjectsPDF = (data, config) => {
  const fmtQ = n => `Q ${parseFloat(n || 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`;
  const today = new Date().toLocaleDateString("es-GT", { day: "numeric", month: "long", year: "numeric" });
  const win = pdfOpen("Inspección de Obras Misioneras", config, `Corte al ${today}`);

  // Resumen General
  const s = data.summary;
  win.document.write(`
    <div class="metrics-grid">
      <div class="metric-card"><div class="label">Total Proyectos</div><div class="value">${s.total_projects}</div></div>
      <div class="metric-card"><div class="label">Presupuesto Total</div><div class="value" style="color:#1d4ed8;font-size:14px">${fmtQ(s.total_budget)}</div></div>
      <div class="metric-card"><div class="label">Aportado</div><div class="value" style="color:#16a34a;font-size:14px">${fmtQ(s.total_contributions)}</div></div>
      <div class="metric-card"><div class="label">Disponible</div><div class="value" style="color:#d97706;font-size:14px">${fmtQ(s.total_available)}</div></div>
    </div>`);

  // Estado por tipo
  if (s.by_status && Object.keys(s.by_status).length > 0) {
    const statusBadgeMap = { "Activo": "badge-green", "Completado": "badge-blue", "Pausado": "badge-yellow", "Cancelado": "badge-red" };
    const statusStr = Object.entries(s.by_status).map(([k, v]) => `<span class="badge ${statusBadgeMap[k] || "badge-gray"}">${k}: ${v}</span>`).join("  ");
    win.document.write(`<div style="margin-bottom:12px;font-size:11px;">${statusStr}</div>`);
  }

  // Lista de proyectos
  win.document.write(`<div class="section-title">Detalle por Proyecto</div>
    <table><thead><tr>
      <th>#</th><th>Nombre del Proyecto</th><th class="center">Estado</th>
      <th class="right">Presupuesto</th><th class="right">Aportado</th>
      <th class="right">Gastos</th><th class="right">Disponible</th><th class="center">Avance</th>
    </tr></thead><tbody>`);

  const statusBadgeMap = { "Activo": "badge-green", "Completado": "badge-blue", "Pausado": "badge-yellow", "Cancelado": "badge-red" };
  data.projects.forEach((p, i) => {
    const availColor = (p.available || 0) >= 0 ? "green" : "red";
    win.document.write(`<tr>
      <td class="center">${i + 1}</td>
      <td class="bold">${p.name}</td>
      <td class="center"><span class="badge ${statusBadgeMap[p.status] || "badge-gray"}">${p.status}</span></td>
      <td class="right">${p.budget ? fmtQ(p.budget) : "—"}</td>
      <td class="right green">${fmtQ(p.contributions)}</td>
      <td class="right red">${fmtQ(p.expenses)}</td>
      <td class="right ${availColor}">${fmtQ(p.available)}</td>
      <td class="center bold">${p.progress}%</td>
    </tr>`);
  });

  win.document.write(`</tbody></table>`);
  pdfClose(win, config);
};

// ─── PDF: Aportaciones por Miembro ────────────────────────
const printMemberContributionsPDF = (data, memberName, config) => {
  const fmtQ = n => `Q ${parseFloat(n || 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`;
  const win = pdfOpen("Historial de Aportaciones por Miembro", config, `Feligrés: ${memberName}`);

  // Resumen
  win.document.write(`
    <div class="metrics-grid" style="grid-template-columns: repeat(2,1fr)">
      <div class="metric-card"><div class="label">Total de Transacciones</div><div class="value">${data.summary.count}</div></div>
      <div class="metric-card"><div class="label">Monto Total Aportado</div><div class="value" style="color:#16a34a;font-size:16px">${fmtQ(data.summary.total_contributions)}</div></div>
    </div>`);

  // Tabla de transacciones
  win.document.write(`<div class="section-title">Historial de Transacciones (${data.summary.count} registros)</div>
    <table><thead><tr>
      <th>Fecha</th><th>Categoría</th><th>Tipo / Descripción</th><th>Observaciones</th><th class="right">Monto</th>
    </tr></thead><tbody>`);

  const catBadgeMap = { "Ofrenda General": "badge-blue", "Ofrenda Individual": "badge-green", "Otros Ingresos": "badge-yellow" };
  data.transactions.forEach(t => {
    win.document.write(`<tr>
      <td>${t.date}</td>
      <td><span class="badge ${catBadgeMap[t.category] || "badge-gray"}">${t.category}</span></td>
      <td class="bold">${t.type}</td>
      <td>${t.observations || "—"}</td>
      <td class="right green">${fmtQ(t.amount)}</td>
    </tr>`);
  });

  win.document.write(`<tr class="totals-row">
    <td colspan="4" class="right bold">TOTAL APORTADO</td>
    <td class="right" style="color:#16a34a">${fmtQ(data.summary.total_contributions)}</td>
  </tr></tbody></table>`);

  pdfClose(win, config);
};

// ─── PDF: Reporte de Asistencia ───────────────────────────
const printAttendancePDF = (data, month, year, config) => {
  const period = `Período: ${MONTHS_ES[month - 1].toUpperCase()} ${year}`;
  const win = pdfOpen("Balance Mensual de Asistencia", config, period);

  const s = data.summary;
  win.document.write(`
    <div class="metrics-grid">
      <div class="metric-card"><div class="label">Servicios Realizados</div><div class="value">${s.total_records}</div></div>
      <div class="metric-card"><div class="label">Asistencia Total</div><div class="value" style="color:#1d4ed8">${s.grand_total}</div></div>
      <div class="metric-card"><div class="label">Promedio por Culto</div><div class="value" style="color:#16a34a">${s.avg_attendance}</div></div>
      <div class="metric-card"><div class="label">Nuevos Convertidos</div><div class="value" style="color:#dc2626">${s.total_converts}</div></div>
    </div>`);

  // Totales por categoría
  const ct = data.category_totals;
  win.document.write(`<div class="section-title">Totales por Categoría</div>
    <table><thead><tr>
      <th>Caballeros</th><th>Damas</th><th>Jóvenes</th><th>Niños</th><th>Visitas</th>
    </tr></thead><tbody><tr>
      <td class="center bold blue">${ct.men}</td>
      <td class="center bold">${ct.women}</td>
      <td class="center bold">${ct.youth}</td>
      <td class="center bold">${ct.children}</td>
      <td class="center bold">${ct.visitors}</td>
    </tr></tbody></table>`);

  // Historial detallado
  win.document.write(`<div class="section-title">Historial Detallado del Mes</div>
    <table><thead><tr>
      <th>Fecha</th><th>Tipo de Culto</th>
      <th class="center">Cab.</th><th class="center">Dam.</th>
      <th class="center">Jóv.</th><th class="center">Niñ.</th>
      <th class="center">Vis.</th><th class="center">Conv.</th>
      <th class="center">Total</th>
    </tr></thead><tbody>`);

  data.records.forEach(r => {
    win.document.write(`<tr>
      <td>${r.date}</td>
      <td>${r.service_type}</td>
      <td class="center">${r.men}</td>
      <td class="center">${r.women}</td>
      <td class="center">${r.youth}</td>
      <td class="center">${r.children}</td>
      <td class="center">${r.visitors}</td>
      <td class="center red">${r.converts}</td>
      <td class="center bold">${r.total}</td>
    </tr>`);
  });

  win.document.write(`<tr class="totals-row">
    <td colspan="2" class="bold">TOTALES DEL MES</td>
    <td class="center">${ct.men}</td>
    <td class="center">${ct.women}</td>
    <td class="center">${ct.youth}</td>
    <td class="center">${ct.children}</td>
    <td class="center">${ct.visitors}</td>
    <td class="center red">${s.total_converts}</td>
    <td class="center bold blue">${s.grand_total}</td>
  </tr></tbody></table>`);

  pdfClose(win, config);
};


const printFinancialPDF = (data, month, year, config) => {
  const CHURCH_NAME = config?.church_name || "IGLESIA";
  const CHURCH_LOCATION = config?.church_address || "";
  const CHURCH_LOGO_URL = config?.church_logo_url || "";
  const CHURCH_LOGO_HTML = CHURCH_LOGO_URL ? `<img src="${CHURCH_LOGO_URL}" onerror="this.style.display='none'" style="width:72px;height:auto;object-fit:contain;" alt="Logo" />` : "";

  const fmtDateLong = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("es-GT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  };
  const fmtQ = (n) => {
    if (!n && n !== 0) return "";
    const num = parseFloat(n);
    if (num === 0) return "";
    return `Q  ${num.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const allRows = [];
  (data.transactions.incomes || []).forEach(t => allRows.push({ date: t.date, desc: t.type, donor: t.donor || "", ofrendas: 0, entrada: t.amount, salida: 0 }));
  (data.transactions.offerings || []).forEach(t => {
    if (t.type === "servicio") allRows.push({ date: t.date, desc: "Ofrenda", donor: t.donor || "", ofrendas: t.amount, entrada: 0, salida: 0 });
    else allRows.push({ date: t.date, desc: "Ofrenda especial", donor: t.donor || "", ofrendas: t.amount, entrada: 0, salida: 0 });
  });
  (data.transactions.expenses || []).forEach(t => allRows.push({ date: t.date, desc: t.type, donor: t.observations || "", ofrendas: 0, entrada: 0, salida: t.amount }));
  
  allRows.sort((a, b) => new Date(a.date) - new Date(b.date));

  const incomesByType = {};
  (data.transactions.incomes || []).forEach(t => { incomesByType[t.type] = (incomesByType[t.type] || 0) + t.amount; });
  const totalOfrendasServicio = (data.transactions.offerings || []).filter(o => o.type === "servicio").reduce((a, o) => a + o.amount, 0);
  const totalOfrendasEspecial = (data.transactions.offerings || []).filter(o => o.type !== "servicio").reduce((a, o) => a + o.amount, 0);
  const totalDiezmo = Math.round((totalOfrendasServicio + totalOfrendasEspecial) * 0.10 * 100) / 100;
  
  const expensesByType = {};
  (data.transactions.expenses || []).forEach(t => { expensesByType[t.type] = (expensesByType[t.type] || 0) + t.amount; });

  const totalEntradas = Object.values(incomesByType).reduce((a, v) => a + v, 0) + totalOfrendasServicio + totalOfrendasEspecial;
  const totalSalidas = totalDiezmo + Object.values(expensesByType).reduce((a, v) => a + v, 0);
  const enCaja = Math.round((totalEntradas - totalSalidas) * 100) / 100;

  const summaryRows = [];
  Object.entries(incomesByType).forEach(([type, amount]) => summaryRows.push({ label: `${type}(+)`, value: amount, bold: false, color: "#000" }));
  if (totalOfrendasServicio > 0) summaryRows.push({ label: "Ofrendas (+)", value: totalOfrendasServicio, bold: false, color: "#000" });
  if (totalOfrendasEspecial > 0) summaryRows.push({ label: "Ofrenda Especial(+)", value: totalOfrendasEspecial, bold: false, color: "#000" });
  summaryRows.push({ label: "Diezmo de Ofrendas(-)", value: totalDiezmo, bold: false, color: "#000", note: `(10% de Q ${(totalOfrendasServicio + totalOfrendasEspecial).toLocaleString("es-GT", { minimumFractionDigits: 2 })})` });
  Object.entries(expensesByType).forEach(([type, amount]) => summaryRows.push({ label: `${type}(-)`, value: amount, bold: false, color: "#000" }));
  summaryRows.push({ label: "En caja:", value: enCaja, bold: true, color: "#c0392b" });

  const rowsHTML = allRows.map((r, i) => `<tr><td style="text-align:center;border:1px solid #bbb;padding:4px 6px;">${i + 1}</td><td style="text-align:center;border:1px solid #bbb;padding:4px 8px;">${fmtDateLong(r.date)}</td><td style="border:1px solid #bbb;padding:4px 8px;">${r.desc}</td><td style="text-align:right;border:1px solid #bbb;padding:4px 8px;">${fmtQ(r.ofrendas)}</td><td style="text-align:right;border:1px solid #bbb;padding:4px 8px;">${fmtQ(r.entrada)}</td><td style="text-align:right;border:1px solid #bbb;padding:4px 8px;">${fmtQ(r.salida)}</td></tr>`).join("");
  const summaryHTML = summaryRows.map(s => `<tr><td style="text-align:right;padding:4px 10px;border:1px solid #bbb;font-weight:${s.bold ? '700' : '500'};color:${s.color};white-space:nowrap;">${s.label}${s.note ? `<br/><span style="font-size:9px;font-weight:400;color:#888;">${s.note}</span>` : ""}</td><td style="text-align:right;padding:4px 10px;border:1px solid #bbb;color:${s.color};font-weight:${s.bold ? '700' : '500'};">${s.value !== 0 ? fmtQ(s.value) || "Q  -" : "Q  -"}</td></tr>`).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Registros Ofrendas y Gastos - ${MONTHS_ES[month - 1]} ${year}</title>
    <style>* { box-sizing: border-box; margin: 0; padding: 0; } body { font-family: Arial, sans-serif; font-size: 12px; color: #000; padding: 24px 32px; } .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; } .header-text { text-align: center; flex: 1; } .header-text h1 { font-size: 15px; font-weight: bold; text-decoration: underline; letter-spacing: 0.5px; margin-bottom: 6px; } .header-text p { font-size: 12px; font-weight: bold; line-height: 1.7; } .header-text .period { margin-top: 6px; font-weight: normal; font-size: 11px; color: #444; } .logo { width: 80px; text-align: right; } table.main { width: 100%; border-collapse: collapse; margin-top: 6px; } table.main th { border: 1px solid #aaa; padding: 5px 8px; background: #fff; font-weight: bold; font-size: 12px; text-align: center; } table.main td { font-size: 11.5px; } table.main tr:nth-child(even) td { background: #f9f9f9; } .summary-wrap { display: flex; justify-content: flex-end; margin-top: 18px; } table.summary { border-collapse: collapse; font-size: 12px; min-width: 260px; } table.summary td { padding: 5px 10px; border: 1px solid #bbb; } .footer { margin-top: 20px; font-size: 10px; color: #999; text-align: right; } @media print { body { padding: 10px 18px; } @page { margin: 1.2cm; size: A4 landscape; } }</style></head><body>
    <div class="header"><div style="width:80px"></div><div class="header-text"><h1>REGISTROS DE OFRENDAS Y GASTOS</h1><p>${CHURCH_NAME}<br/>${CHURCH_LOCATION}</p><p class="period">Período: ${MONTHS_ES[month - 1].toUpperCase()} ${year}</p></div><div class="logo">${CHURCH_LOGO_HTML}</div></div>
    <table class="main"><thead><tr><th style="width:38px">Reg.</th><th style="width:185px">Fecha</th><th>Descripcion</th><th style="width:115px">Ofrendas</th><th style="width:115px">Entrada</th><th style="width:115px">Salida</th></tr></thead><tbody>${rowsHTML}</tbody></table>
    <div class="summary-wrap"><table class="summary"><tbody>${summaryHTML}</tbody></table></div>
    <p class="footer">Diezmo calculado automáticamente como el 10% de las Ofrendas del período (Servicio y Especiales). &nbsp;|&nbsp; Generado el ${new Date().toLocaleDateString("es-GT")} — Sistema de Gestión Iglesia</p></body></html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 400);
};


// ═══════════════════════════════════════════════════════════
// ── PANEL 1: Reporte Financiero Mensual ───────────────────
// ═══════════════════════════════════════════════════════════
function PanelFinancialMonthly({ settings }) {
  const location = useLocation();
  const [month, setMonth] = useState(nowMonth);
  const [year, setYear] = useState(nowYear);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/reports/financial/monthly?month=${month}&year=${year}&_t=${Date.now()}`);
      setData(res.data);
    } catch { setData(null); }
    setLoading(false);
  };

  return (
    <Box>
      <Card sx={{ p: 2, mb: 4, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Mes</InputLabel>
          <Select value={month} label="Mes" onChange={e => setMonth(+e.target.value)}>
            {MONTHS_ES.map((m, i) => <MenuItem key={i} value={i + 1}>{m}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Año</InputLabel>
          <Select value={year} label="Año" onChange={e => setYear(+e.target.value)}>
            {[nowYear, nowYear - 1, nowYear - 2].map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </FormControl>
        <Button variant="contained" startIcon={<Assessment />} onClick={load}>Generar Reporte</Button>
        {data && <Button variant="outlined" startIcon={<Print />} onClick={() => printFinancialPDF(data, month, year, settings)}>Exportar PDF Oficial</Button>}
      </Card>

      {loading && <Typography align="center" py={5} color="text.secondary">Cargando métricas de finanzas...</Typography>}

      {data && (
        <Box id="report-fin-monthly">
          <Typography variant="h5" fontWeight="800" mb={3}>
            📊 Ejecución Financiera — {MONTHS_ES[data.period.month - 1]} {data.period.year}
          </Typography>

          <Grid container spacing={3} mb={4}>
            {[
              { label: "Total Ofrendas", value: fmt(data.summary.total_offerings), color: "info.main" },
              { label: "Ingresos Adicionales", value: fmt(data.summary.total_incomes), color: "success.main" },
              { label: "Total Gastos", value: fmt(data.summary.total_expenses), color: "error.main" },
              { label: "Balance Neto", value: fmt(data.summary.balance), color: data.summary.balance >= 0 ? "success.main" : "error.main" },
            ].map(m => (
              <Grid item xs={12} sm={6} md={3} key={m.label}>
                <Card sx={{ borderTop: 4, borderColor: m.color, height: '100%' }}>
                  <CardContent>
                    <Typography variant="overline" color="text.secondary" fontWeight="700">{m.label}</Typography>
                    <Typography variant="h5" fontWeight="800" sx={{ mt: 1, color: "text.primary" }}>{m.value}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {data.summary.monthly_goal > 0 && (
            <Card sx={{ p: 3, mb: 4, bgcolor: 'warning.light', color: 'warning.contrastText', display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="overline" fontWeight="700">Meta de Gastos Fijos</Typography>
                <Typography variant="h4" fontWeight="800">{fmt(data.summary.monthly_goal)}</Typography>
              </Box>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="subtitle2">Fondos levantados contra meta</Typography>
                  <Typography variant="subtitle2" fontWeight="800">{data.summary.goal_completion_pct}%</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(100, data.summary.goal_completion_pct)} 
                  color={data.summary.goal_completion_pct >= 100 ? "success" : data.summary.goal_completion_pct >= 50 ? "warning" : "error"}
                  sx={{ height: 12, borderRadius: 6 }}
                />
              </Box>
            </Card>
          )}

          <Grid container spacing={4} mb={4}>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', p: 2 }}>
                <Typography variant="h6" fontWeight="700" mb={2}>Ofrendas por Tipo</Typography>
                {data.offerings_by_type.length === 0 ? <Typography color="text.secondary">Sin registros</Typography> : (
                  <VerticalBars data={data.offerings_by_type.map(o => ({ label: o.type === "servicio" ? "Servicio" : "Especial", value: o.amount }))} />
                )}
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', p: 2 }}>
                <Typography variant="h6" fontWeight="700" mb={3}>Gastos por Rubro</Typography>
                {data.expenses_by_type.length === 0 ? <Typography color="text.secondary">Sin registros</Typography> : (
                  <Box>
                    {data.expenses_by_type.map((ex, i) => {
                      const pct = Math.min(100, Math.round((ex.amount / (data.summary.total_expenses || 1)) * 100));
                      return (
                        <Box key={i} mb={2}>
                          <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography variant="body2" fontWeight="600" color="text.secondary">{ex.type}</Typography>
                            <Typography variant="body2" fontWeight="700" color="error.main">{fmt(ex.amount)}</Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={pct} color="error" sx={{ height: 8, borderRadius: 4 }} />
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Card>
            </Grid>
          </Grid>

          {data.transactions.offerings.length > 0 && (
            <Card sx={{ mb: 4, overflow: 'hidden' }}>
              <Typography variant="subtitle1" fontWeight="700" sx={{ p: 2, bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
                Detalle de Ofrendas Captadas
              </Typography>
              <Table size="small">
                <TableHead><TableRow><TableCell>Fecha</TableCell><TableCell>Tipo</TableCell><TableCell>Donante</TableCell><TableCell align="right">Monto</TableCell></TableRow></TableHead>
                <TableBody>
                  {data.transactions.offerings.map((o, i) => (
                    <TableRow key={i} hover>
                      <TableCell>{o.date}</TableCell>
                      <TableCell><Chip label={o.type === "servicio" ? "Servicio" : "Especial"} size="small" color="info" variant="outlined" /></TableCell>
                      <TableCell sx={{ color: "text.secondary" }}>{o.donor || "—"}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: "700", color: "success.main" }}>{fmt(o.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {data.transactions.expenses.length > 0 && (
            <Card sx={{ overflow: 'hidden' }}>
              <Typography variant="subtitle1" fontWeight="700" sx={{ p: 2, bgcolor: 'error.50', color: 'error.main', borderBottom: 1, borderColor: 'divider' }}>
                Detalle de Egresos
              </Typography>
              <Table size="small">
                <TableHead><TableRow><TableCell>Fecha</TableCell><TableCell>Rubro</TableCell><TableCell>Observaciones</TableCell><TableCell align="right">Monto</TableCell></TableRow></TableHead>
                <TableBody>
                  {data.transactions.expenses.map((e, i) => (
                    <TableRow key={i} hover>
                      <TableCell>{e.date}</TableCell>
                      <TableCell>{e.type}</TableCell>
                      <TableCell sx={{ color: "text.secondary" }}>{e.observations || "—"}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: "700", color: "error.main" }}>{fmt(e.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </Box>
      )}
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════
// ── PANEL 2: Reporte Financiero Anual ─────────────────────
// ═══════════════════════════════════════════════════════════
function PanelFinancialAnnual({ settings }) {
  const location = useLocation();
  const [year, setYear] = useState(nowYear);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/reports/financial/annual?year=${year}&_t=${Date.now()}`);
      setData(res.data);
    } catch { setData(null); }
    setLoading(false);
  };

  return (
    <Box>
      <Card sx={{ p: 2, mb: 4, display: 'flex', gap: 2, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Periodo Fiscal</InputLabel>
          <Select value={year} label="Periodo Fiscal" onChange={e => setYear(+e.target.value)}>
            {[nowYear, nowYear - 1, nowYear - 2, nowYear - 3].map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </FormControl>
        <Button variant="contained" startIcon={<Assessment />} onClick={load}>Extraer Reporte Anual</Button>
        {data && <Button variant="outlined" startIcon={<Print />} onClick={() => printFinancialAnnualPDF(data, year, settings)}>Imprimir Analítica</Button>}
      </Card>

      {loading && <Typography align="center" py={5} color="text.secondary">Consolidando todo el año fiscal...</Typography>}

      {data && (
        <Box id="report-fin-annual">
          <Typography variant="h5" fontWeight="800" mb={3}>📈 Resumen Consolidado Anual — {data.year}</Typography>

          <Grid container spacing={3} mb={4}>
            {[
              { label: "Acumulado Ofrendas", value: fmt(data.year_totals.total_offerings), color: "info.main" },
              { label: "Acumulado Otros Ing.", value: fmt(data.year_totals.total_incomes), color: "secondary.main" },
              { label: "Total Egresado", value: fmt(data.year_totals.total_expenses), color: "error.main" },
              { label: "Balance Anual", value: fmt(data.year_totals.balance), color: data.year_totals.balance >= 0 ? "success.main" : "error.main" },
            ].map(m => (
              <Grid item xs={12} sm={6} md={3} key={m.label}>
                <Card sx={{ borderLeft: 6, borderColor: m.color, height: '100%', boxShadow: 2 }}>
                  <CardContent>
                    <Typography variant="overline" color="text.secondary" fontWeight="700">{m.label}</Typography>
                    <Typography variant="h5" fontWeight="800" sx={{ mt: 1 }}>{m.value}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Card sx={{ p: 3, mb: 4, overflowX: 'auto' }}>
            <Typography variant="h6" fontWeight="700" mb={2}>Fluctuación Mensual: Ingresos vs. Gastos</Typography>
            <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "space-around", height: 260, pb: 4, pt: 2, position: "relative", minWidth: 600 }}>
              <Box sx={{ position: "absolute", top: 10, left: 0, right: 0, bottom: 32, pointerEvents: "none", zIndex: 0 }}>
                {[...Array(4)].map((_, i) => <Box key={i} sx={{ borderTop: i === 3 ? "1px solid" : "1px dashed", borderColor: i === 3 ? "divider" : "grey.200", width: "100%", position: "absolute", bottom: `${i * 33.3}%` }} />)}
              </Box>
              {(() => {
                const maxVal = Math.max(...data.monthly_breakdown.flatMap(r => [r.total_offerings + r.total_incomes, r.total_expenses]), 1);
                return data.monthly_breakdown.map((r, i) => {
                  const incH = ((r.total_offerings + r.total_incomes) / maxVal) * 180;
                  const expH = (r.total_expenses / maxVal) * 180;
                  return (
                    <Box key={i} sx={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 1, flex: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "flex-end", gap: 0.5, height: 180 }}>
                        <Box title={`Ingresos: Q${r.total_offerings + r.total_incomes}`} sx={{ width: 14, height: incH, background: "#3b82f6", borderRadius: "3px 3px 0 0", minHeight: incH > 0 ? 4 : 0 }} />
                        <Box title={`Gastos: Q${r.total_expenses}`} sx={{ width: 14, height: expH, background: "#ef4444", borderRadius: "3px 3px 0 0", minHeight: expH > 0 ? 4 : 0 }} />
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, fontWeight: 700 }}>{MONTHS_ES[i].substring(0, 3)}</Typography>
                    </Box>
                  );
                });
              })()}
            </Box>
            <Box display="flex" justifyContent="center" gap={4} mt={2}>
              <Typography variant="caption" display="flex" alignItems="center" gap={1} fontWeight="600">
                <Box width={12} height={12} bgcolor="#3b82f6" borderRadius={0.5} /> Total Ingresos (Ofrendas + Extras)
              </Typography>
              <Typography variant="caption" display="flex" alignItems="center" gap={1} fontWeight="600">
                <Box width={12} height={12} bgcolor="#ef4444" borderRadius={0.5} /> Total Gastos
              </Typography>
            </Box>
          </Card>

          <TableContainer component={Paper} elevation={1}>
            <Table>
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell>Mes</TableCell>
                  <TableCell align="right">Módulo Ofrendas</TableCell>
                  <TableCell align="right">Otros Ingresos</TableCell>
                  <TableCell align="right">Módulo Gastos</TableCell>
                  <TableCell align="right">Balance Físico Neto</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.monthly_breakdown.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontWeight: "600" }}>{MONTHS_ES[i]}</TableCell>
                    <TableCell align="right" sx={{ color: "info.main" }}>{fmt(r.total_offerings)}</TableCell>
                    <TableCell align="right" sx={{ color: "secondary.main" }}>{fmt(r.total_incomes)}</TableCell>
                    <TableCell align="right" sx={{ color: "error.main" }}>{fmt(r.total_expenses)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: "700", color: r.balance >= 0 ? "success.main" : "error.main" }}>{fmt(r.balance)}</TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: 'info.50' }}>
                  <TableCell sx={{ fontWeight: "800" }}>TOTAL CONSOLIDADO</TableCell>
                  <TableCell align="right" sx={{ fontWeight: "800", color: "info.main" }}>{fmt(data.year_totals.total_offerings)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: "800", color: "secondary.main" }}>{fmt(data.year_totals.total_incomes)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: "800", color: "error.main" }}>{fmt(data.year_totals.total_expenses)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: "800", color: data.year_totals.balance >= 0 ? "success.main" : "error.main" }}>{fmt(data.year_totals.balance)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════
// ── PANEL 3: Reporte de Miembros ────────────────────────
// ═══════════════════════════════════════════════════════════
function PanelMembers({ settings }) {
  const location = useLocation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/reports/members?_t=${Date.now()}`);
      setData(res.data);
    } catch { setData(null); }
    setLoading(false);
  };

  const filtered = data?.members?.filter(m => filter === "all" ? true : m.status === filter) || [];

  return (
    <Box>
      <Card sx={{ p: 2, mb: 4, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Button variant="contained" startIcon={<PeopleAlt />} onClick={load}>Inspeccionar Demografía</Button>
        {data && <Button variant="outlined" startIcon={<Print />} onClick={() => printMembersPDF(data, settings)}>Imprimir Listado</Button>}
      </Card>

      {loading && <Typography align="center" py={5} color="text.secondary">Extrayendo datos de la membresía...</Typography>}

      {data && (
        <Box id="report-members">
          <Typography variant="h5" fontWeight="800" mb={3}>👥 Informe Demográfico de Miembros</Typography>

          <Grid container spacing={3} mb={4} justifyContent="center">
            {[
              { label: "Población Total Registrada", value: data.summary.total, color: "primary.main" },
              { label: "Miembros Activos", value: data.summary.active, color: "success.main" },
              { label: "Miembros Pasivos/Inactivos", value: data.summary.inactive, color: "error.main" },
            ].map(m => (
              <Grid item xs={12} sm={4} key={m.label}>
                <Card sx={{ 
                  borderBottom: 4, 
                  borderColor: m.color, 
                  height: '100%', 
                  textAlign: 'center', 
                  py: 3, 
                  px: 2, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'center',
                  minHeight: 140,
                  boxShadow: 'var(--shadow-md)'
                }}>
                  <Typography variant="h3" fontWeight="900" color="text.primary" sx={{ mb: 1 }}>{m.value}</Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ textTransform: "uppercase", letterSpacing: '0.05em', lineHeight: 1.3 }}>{m.label}</Typography>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={4} mb={4}>
            {data.birthdays_this_month.length > 0 && (
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <Typography variant="subtitle1" fontWeight="700" sx={{ p: 2, bgcolor: 'secondary.50', color: 'secondary.main', borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EventAvailable /> Cumpleaños del Mes Actual
                  </Typography>
                  <Table size="small">
                    <TableHead><TableRow><TableCell>Nombre Alabanza</TableCell><TableCell>Fecha Naci.</TableCell><TableCell>Celular</TableCell></TableRow></TableHead>
                    <TableBody>
                      {data.birthdays_this_month.map((m, i) => (
                        <TableRow key={i} hover>
                          <TableCell sx={{ fontWeight: "600" }}>{m.name}</TableCell><TableCell>{m.birth_date}</TableCell><TableCell>{m.phone || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </Grid>
            )}
            
            {data.baptism_anniversaries_this_month.length > 0 && (
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <Typography variant="subtitle1" fontWeight="700" sx={{ p: 2, bgcolor: 'info.50', color: 'info.main', borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalOffer /> Aniversarios de Bautismo
                  </Typography>
                  <Table size="small">
                    <TableHead><TableRow><TableCell>Miembro Confirmado</TableCell><TableCell>Fecha de Bautizo</TableCell><TableCell>Celular</TableCell></TableRow></TableHead>
                    <TableBody>
                      {data.baptism_anniversaries_this_month.map((m, i) => (
                        <TableRow key={i} hover>
                          <TableCell sx={{ fontWeight: "600" }}>{m.name}</TableCell><TableCell>{m.baptism_date}</TableCell><TableCell>{m.phone || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </Grid>
            )}
          </Grid>

          <Card>
            <Box display="flex" justifyContent="space-between" alignItems="center" p={2} borderBottom={1} borderColor="divider">
              <Typography variant="h6" fontWeight="700">Directorio Oficial Eclesiástico</Typography>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <Select value={filter} onChange={e => setFilter(e.target.value)}>
                  <MenuItem value="all">Visibilidad Común</MenuItem>
                  <MenuItem value="active">Solo Activos (Militantes)</MenuItem>
                  <MenuItem value="inactive">Solo Resagados (Inactivos)</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <TableContainer>
              <Table size="medium">
                <TableHead sx={{ bgcolor: 'grey.50' }}>
                  <TableRow>
                     <TableCell>#</TableCell>
                     <TableCell>Padrón de Miembros</TableCell>
                     <TableCell>Contacto Celular</TableCell>
                     <TableCell>Correo Físico/Virtual</TableCell>
                     <TableCell>Nacimiento Físico</TableCell>
                     <TableCell>Bautismo Espiritual</TableCell>
                     <TableCell align="center">Estado del Rol</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 ? <TableRow><TableCell colSpan={7} align="center">La base de datos se encuentra vacía o el filtro omite a toda la congregación.</TableCell></TableRow> : 
                    filtered.map((m, i) => (
                      <TableRow key={m.id} hover>
                        <TableCell sx={{ color: "text.secondary" }}>{i + 1}</TableCell>
                        <TableCell sx={{ fontWeight: "700", color: "text.primary" }}>{m.name}</TableCell>
                        <TableCell>{m.phone || "—"}</TableCell>
                        <TableCell>{m.email || "—"}</TableCell>
                        <TableCell>{m.birth_date || "—"}</TableCell>
                        <TableCell>{m.baptism_date || "—"}</TableCell>
                        <TableCell align="center">
                          <Chip label={m.status === "active" ? "Legítimo Activo" : "Reservado"} size="small" color={m.status === "active" ? "success" : "default"} variant={m.status === "active" ? "filled" : "outlined"} />
                        </TableCell>
                      </TableRow>
                    ))
                  }
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>
      )}
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════
// ── PANEL 4: Reporte de Proyectos ─────────────────────────
// ═══════════════════════════════════════════════════════════
function PanelProjects({ settings }) {
  const location = useLocation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/reports/projects?_t=${Date.now()}`);
      setData(res.data);
    } catch { setData(null); }
    setLoading(false);
  };

  return (
    <Box>
      <Card sx={{ p: 2, mb: 4, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Button variant="contained" startIcon={<Assignment />} onClick={load}>Revisar Auditoría de Proyectos</Button>
        {data && <Button variant="outlined" startIcon={<Print />} onClick={() => printProjectsPDF(data, settings)}>Compilar Hoja de Impresión</Button>}
      </Card>

      {loading && <Typography align="center" py={5} color="text.secondary">Mapeando infraestructura y colectas de proyectos...</Typography>}

      {data && (
        <Box id="report-projects">
          <Typography variant="h5" fontWeight="800" mb={3}>🏗️ Auditoría de Ejecución en Proyectos Físicos/Misiones</Typography>

          <Grid container spacing={3} mb={4}>
            {[
              { label: "Obras Vigentes / Totales", value: data.summary.total_projects, color: "primary.main" },
              { label: "Presupuesto General Autorizado", value: fmt(data.summary.total_budget), color: "secondary.main" },
              { label: "Capital Colectado", value: fmt(data.summary.total_contributions), color: "success.main" },
              { label: "Capital Físico Remanente", value: fmt(data.summary.total_available), color: data.summary.total_available >= 0 ? "success.main" : "error.main" },
            ].map(m => (
              <Grid item xs={12} sm={6} md={3} key={m.label}>
                <Card sx={{ borderLeft: 6, borderColor: m.color, height: '100%', boxShadow: 1 }}>
                  <CardContent>
                    <Typography variant="overline" color="text.secondary" fontWeight="700" lineHeight={1.2} display="block" mb={1}>{m.label}</Typography>
                    <Typography variant="h5" fontWeight="800" color="text.primary">{m.value}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {Object.keys(data.summary.by_status).length > 0 && (
            <Box mb={4}>
              <Typography variant="subtitle2" fontWeight="700" color="text.secondary" mb={2} textTransform="uppercase">Distribución Cartográfica del Trabajo</Typography>
              <Box display="flex" gap={2} flexWrap="wrap">
                {Object.entries(data.summary.by_status).map(([status, count]) => {
                  const sColor = status === "Activo" ? "success.main" : status === "Pausado" ? "warning.main" : status === "Completado" ? "info.main" : "error.main";
                  return (
                    <Card key={status} sx={{ px: 3, py: 1.5, minWidth: 140, borderBottom: 3, borderColor: sColor }}>
                      <Typography variant="caption" fontWeight="700" color="text.secondary">{status}</Typography>
                      <Typography variant="h4" fontWeight="800" color="text.primary">{count}</Typography>
                    </Card>
                  )
                })}
              </Box>
            </Box>
          )}

          <TableContainer component={Paper} elevation={1}>
            <Table>
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell>Nombre de la Obra o Proyecto</TableCell>
                  <TableCell align="center">Estado del Avance</TableCell>
                  <TableCell align="right">Meta Qz</TableCell>
                  <TableCell align="right">Recolectado Qz</TableCell>
                  <TableCell align="right">Invertido Qz</TableCell>
                  <TableCell align="right">Caja Abierta Qz</TableCell>
                  <TableCell align="center">Conclusión %</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.projects.length === 0 ? <TableRow><TableCell colSpan={7} align="center">Sin constancia de proyectos aún.</TableCell></TableRow> : 
                  data.projects.map((p) => {
                    const cColor = p.status === "Activo" ? "success" : p.status === "Pausado" ? "warning" : p.status === "Completado" ? "info" : "error";
                    return (
                      <TableRow key={p.id} hover>
                        <TableCell sx={{ fontWeight: "700" }}>{p.name}</TableCell>
                        <TableCell align="center"><Chip label={p.status} size="small" color={cColor} variant={p.status === 'Completado' ? 'filled' : 'outlined'} /></TableCell>
                        <TableCell align="right">{fmt(p.budget)}</TableCell>
                        <TableCell align="right" sx={{ color: "success.main", fontWeight: "600" }}>{fmt(p.contributions)}</TableCell>
                        <TableCell align="right" sx={{ color: "error.main", fontWeight: "600" }}>{fmt(p.spent)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: "700", color: p.available >= 0 ? "text.primary" : "error.main" }}>{fmt(p.available)}</TableCell>
                        <TableCell align="right" sx={{ width: 100 }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box flex={1}><LinearProgress variant="determinate" value={p.progress} color={p.progress >= 100 ? "error" : "primary"} /></Box>
                            <Typography variant="caption" fontWeight="700">{p.progress}%</Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )
                  })
                }
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════
// ── PANEL 5: Reporte de Aportaciones por Miembro ──────────
// ═══════════════════════════════════════════════════════════
function PanelMemberContributions({ settings }) {
  const location = useLocation();
  const [members, setMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    load();
  }, [location.key]);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        // Pedir un límite alto para tener a todos los miembros en el buscador
        const res = await API.get("/members?size=1000");
        const list = Array.isArray(res.data.items) ? res.data.items : [];
        setMembers(list);
      } catch (err) { 
        console.error("Error fetching members for report:", err); 
        setMembers([]);
      }
    };
    fetchMembers();
  }, []);

  const load = async () => {
    if (!selectedMemberId) return;
    setLoading(true);
    try {
      const res = await API.get(`/reports/member/${selectedMemberId}/contributions?_t=${Date.now()}`);
      setData(res.data);
    } catch { setData(null); }
    setLoading(false);
  };

  return (
    <Box>
      <Card sx={{ p: 2, mb: 4, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Autocomplete
          size="small"
          sx={{ minWidth: 280 }}
          options={[...members].sort((a,b) => (a.last_name||"").localeCompare(b.last_name||""))}
          getOptionLabel={(m) => m ? `${m.last_name}, ${m.first_name}` : ""}
          value={members.find(m => m.id === selectedMemberId) || null}
          onChange={(e, val) => setSelectedMemberId(val ? val.id : "")}
          inputValue={inputValue}
          onInputChange={(e, val) => setInputValue(val)}
          renderInput={(params) => <TextField {...params} label="Buscar por nombre..." placeholder="Escribe el nombre..." />}
        />
        <Button 
          variant="contained" 
          startIcon={<Assessment />} 
          onClick={load} 
          disabled={!selectedMemberId}
        >
          Generar Historial
        </Button>
        {data && <Button variant="outlined" startIcon={<Print />} onClick={() => printMemberContributionsPDF(data, data.member_name, settings)}>Imprimir</Button>}
      </Card>

      {loading && <Typography align="center" py={5} color="text.secondary">Consultando archivos financieros...</Typography>}

      {data && (
        <Box id="report-member-contrib">
          <Typography variant="h5" fontWeight="800" mb={1}>📜 Historial Individual de Aportaciones</Typography>
          <Typography variant="h6" color="primary" fontWeight="700" mb={3}>{data.member_name}</Typography>

          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={6}>
              <Card sx={{ borderLeft: 6, borderColor: 'success.main', p: 2 }}>
                <Typography variant="overline" fontWeight="700" color="text.secondary">Total Aportado</Typography>
                <Typography variant="h4" fontWeight="800">{fmt(data.summary.total_contributions)}</Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card sx={{ borderLeft: 6, borderColor: 'info.main', p: 2 }}>
                <Typography variant="overline" fontWeight="700" color="text.secondary">Cantidad de Registros</Typography>
                <Typography variant="h4" fontWeight="800">{data.summary.count}</Typography>
              </Card>
            </Grid>
          </Grid>

          <TableContainer component={Paper} elevation={1}>
            <Table size="medium">
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Categoría</TableCell>
                  <TableCell>Tipo / Concepto</TableCell>
                  <TableCell>Observaciones</TableCell>
                  <TableCell align="right">Monto</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.transactions.length === 0 ? <TableRow><TableCell colSpan={5} align="center">No se encontraron registros para este miembro.</TableCell></TableRow> : 
                  data.transactions.map((t, i) => (
                    <TableRow key={i} hover>
                      <TableCell>{t.date}</TableCell>
                      <TableCell>
                        <Chip 
                          label={t.category} 
                          size="small" 
                          variant="outlined" 
                          color={t.category === "Ofrenda Individual" ? "primary" : t.category === "Otros Ingresos" ? "secondary" : "default"} 
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: "600" }}>{t.type}</TableCell>
                      <TableCell sx={{ color: "text.secondary", fontSize: "0.85rem" }}>{t.observations || "—"}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: "700", color: "success.main" }}>{fmt(t.amount)}</TableCell>
                    </TableRow>
                  ))
                }
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════
// ── PANEL 6: Reporte de Asistencia ──────────────────────────
// ═══════════════════════════════════════════════════════════
function PanelAttendance({ settings }) {
  const location = useLocation();
  const [month, setMonth] = useState(nowMonth);
  const [year, setYear] = useState(nowYear);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/reports/attendance?month=${month}&year=${year}&_t=${Date.now()}`);
      setData(res.data);
    } catch { setData(null); }
    setLoading(false);
  };

  return (
    <Box>
      <Card sx={{ p: 2, mb: 4, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Mes</InputLabel>
          <Select value={month} label="Mes" onChange={e => setMonth(+e.target.value)}>
            {MONTHS_ES.map((m, i) => <MenuItem key={i} value={i + 1}>{m}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Año</InputLabel>
          <Select value={year} label="Año" onChange={e => setYear(+e.target.value)}>
            {[nowYear, nowYear - 1, nowYear - 2].map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </FormControl>
        <Button variant="contained" startIcon={<Assessment />} onClick={load}>Ver Reporte</Button>
        {data && <Button variant="outlined" startIcon={<Print />} onClick={() => printAttendancePDF(data, month, year, settings)}>Imprimir</Button>}
      </Card>

      {loading && <Typography align="center" py={5} color="text.secondary">Compilando datos de asistencia...</Typography>}

      {data && (
        <Box id="report-attendance">
          <Typography variant="h5" fontWeight="800" mb={3}>📈 Balance Mensual de Asistencia — {MONTHS_ES[data.period.month - 1]} {data.period.year}</Typography>

          <Grid container spacing={3} mb={4}>
            {[
              { label: "Servicios en el Mes", value: data.summary.total_records, color: "info.main" },
              { label: "Asistencia Total Acumulada", value: data.summary.grand_total, color: "primary.main" },
              { label: "Promedio General", value: data.summary.avg_attendance, color: "secondary.main" },
              { label: "Total Nuevos Convertidos", value: data.summary.total_converts, color: "error.main" },
            ].map(m => (
              <Grid item xs={12} sm={6} md={3} key={m.label}>
                <Card sx={{ borderTop: 4, borderColor: m.color, height: '100%', textAlign: 'center' }}>
                  <CardContent>
                    <Typography variant="overline" color="text.secondary" fontWeight="700">{m.label}</Typography>
                    <Typography variant="h4" fontWeight="800" sx={{ mt: 1 }}>{m.value}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={4} mb={4}>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', p: 2 }}>
                <Typography variant="subtitle2" fontWeight="700" color="text.secondary" mb={2} textTransform="uppercase">Distribución por Categorías (Acumulada)</Typography>
                <VerticalBars isCurrency={false} data={[
                  { label: "Caballeros", value: data.category_totals.men, color: "#2563eb" },
                  { label: "Damas", value: data.category_totals.women, color: "#ec4899" },
                  { label: "Jóvenes", value: data.category_totals.youth, color: "#8b5cf6" },
                  { label: "Niños", value: data.category_totals.children, color: "#10b981" },
                  { label: "Visitas", value: data.category_totals.visitors, color: "#f59e0b" },
                ]} />
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', p: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                 <Typography variant="h6" fontWeight="700" color="primary.main">Mantenimiento de la Obra</Typography>
                 <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ maxWidth: 300, mt: 1 }}>
                   El promedio de asistencia general de <strong>{data.summary.avg_attendance}</strong> personas por culto refleja la fidelidad de la congregación durante el mes de {MONTHS_ES[month-1]}.
                 </Typography>
                 <Box sx={{ mt: 3, p: 2, bgcolor: 'error.50', borderRadius: 2, border: '1px solid', borderColor: 'error.light', width: '100%', maxWidth: 300 }}>
                    <Typography variant="h4" fontWeight="800" color="error.main" textAlign="center">
                      {data.summary.total_converts}
                    </Typography>
                    <Typography variant="caption" fontWeight="700" display="block" textAlign="center" color="error.main">NUEVAS ALMAS (CONVERTIDOS)</Typography>
                 </Box>
              </Card>
            </Grid>
          </Grid>

          <Card sx={{ overflow: 'hidden' }}>
            <Typography variant="subtitle1" fontWeight="700" sx={{ p: 2, bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
              Historial Detallado del Mes
            </Typography>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'grey.100' }}>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Actividad</TableCell>
                  <TableCell align="center">Cab.</TableCell>
                  <TableCell align="center">Dam.</TableCell>
                  <TableCell align="center">Jóv.</TableCell>
                  <TableCell align="center">Niñ.</TableCell>
                  <TableCell align="center">Vis.</TableCell>
                  <TableCell align="center" sx={{ color: 'error.main', fontWeight: 'bold' }}>Conv.</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.records.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell>{r.date}</TableCell>
                    <TableCell><Chip label={r.service_type} size="small" variant="outlined" /></TableCell>
                    <TableCell align="center">{r.men}</TableCell>
                    <TableCell align="center">{r.women}</TableCell>
                    <TableCell align="center">{r.youth}</TableCell>
                    <TableCell align="center">{r.children}</TableCell>
                    <TableCell align="center">{r.visitors}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', color: 'error.main' }}>{r.converts}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>{r.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </Box>
      )}
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════
// ── PÁGINA PRINCIPAL ──────────────────────────────────────
// ═══════════════════════════════════════════════════════════
export default function Reports() {
  const location = useLocation();
  const [tab, setTab] = useState(0);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    getSettings().then(res => setSettings(res.data)).catch(() => {});
  }, []);

  return (
    <Box sx={{ maxWidth: 1400, margin: '0 auto', p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="800" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Assessment color="primary" /> Generador de Documentos y Examen de Gestión
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Panel ejecutivo maestro. Evalúe auditorías trimestrales, analíticas semestrales e inspeccione la tesorería corporativa de la Iglesia.
        </Typography>
      </Box>

      <Paper sx={{ mb: 4 }}>
        <Tabs 
          value={tab} 
          onChange={(e, val) => setTab(val)} 
          variant="scrollable" 
          scrollButtons="auto"
          indicatorColor="primary" 
          textColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<AccountBalanceWallet />} iconPosition="start" label="Balance Mensual Oficial" />
          <Tab icon={<CalendarMonth />} iconPosition="start" label="Corte Anual Definitivo" />
          <Tab icon={<PeopleAlt />} iconPosition="start" label="Libro Demográfico Iglesia" />
          <Tab icon={<Assignment />} iconPosition="start" label="Inspección de Obras Misioneras" />
          <Tab icon={<PeopleAlt />} iconPosition="start" label="Aportaciones por Miembro" />
          <Tab icon={<Assessment />} iconPosition="start" label="Balance de Asistencia" />
        </Tabs>
      </Paper>

      <Box sx={{ mt: 2 }}>
        {tab === 0 && <PanelFinancialMonthly settings={settings} />}
        {tab === 1 && <PanelFinancialAnnual settings={settings} />}
        {tab === 2 && <PanelMembers settings={settings} />}
        {tab === 3 && <PanelProjects settings={settings} />}
        {tab === 4 && <PanelMemberContributions settings={settings} />}
        {tab === 5 && <PanelAttendance settings={settings} />}
      </Box>
    </Box>
  );
}