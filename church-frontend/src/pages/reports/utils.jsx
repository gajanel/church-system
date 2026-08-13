import { Box, Typography } from "@mui/material";

export const fmt = (n) => `Q ${parseFloat(n || 0).toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const nowYear = new Date().getFullYear();
export const nowMonth = new Date().getMonth() + 1;
export const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export const VerticalBars = ({ data, isCurrency = true }) => {
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

export const ReportSkeleton = () => (
  <Box sx={{ p: 4, bgcolor: "white", borderRadius: 1, border: "1px solid #e5e7eb", minHeight: 500, display: "flex", flexDirection: "column", gap: 3 }}>
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #1e3a8a", pb: 2 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Box sx={{ width: 250, height: 24, bgcolor: "#f1f5f9", borderRadius: 1 }} />
        <Box sx={{ width: 180, height: 16, bgcolor: "#f1f5f9", borderRadius: 1 }} />
        <Box sx={{ width: 120, height: 12, bgcolor: "#f1f5f9", borderRadius: 1 }} />
      </Box>
      <Box sx={{ width: 80, height: 80, bgcolor: "#f1f5f9", borderRadius: 1 }} />
    </Box>
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2 }}>
      {[1, 2, 3, 4].map(i => (
        <Box key={i} sx={{ height: 80, bgcolor: "#f1f5f9", borderRadius: 1 }} />
      ))}
    </Box>
    <Box sx={{ height: 24, width: 150, bgcolor: "#f1f5f9", borderRadius: 1, mt: 2 }} />
    <Box sx={{ height: 200, bgcolor: "#f1f5f9", borderRadius: 1 }} />
  </Box>
);

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

export const pdfHeader = (title, config, period = "") => {
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

export const pdfOpen = (title, config, period = "") => {
  const win = window.open("", "_blank");
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title><style>${PDF_STYLES}</style></head><body>${pdfHeader(title, config, period)}`);
  return win;
};

export const pdfClose = (win, config) => {
  const name = config?.church_name || "Sistema de Gestión Ministerial";
  win.document.write(`<div class="pdf-footer">Documento generado el ${new Date().toLocaleDateString("es-GT")} a las ${new Date().toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })} &nbsp;|&nbsp; ${name}</div></body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 400);
};

export const printFinancialMonthlyPDF = (data, month, year, config) => {
  const fmtQ = n => `Q ${parseFloat(n || 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`;
  const period = `Período: ${MONTHS_ES[month - 1].toUpperCase()} ${year}`;
  const win = pdfOpen("Informe Financiero Mensual", config, period);

  const bal = data.summary.balance;
  const balColor = bal >= 0 ? "#16a34a" : "#dc2626";
  win.document.write(`
    <div class="metrics-grid">
      <div class="metric-card"><div class="label">Total Ofrendas</div><div class="value" style="color:#1d4ed8">${fmtQ(data.summary.total_offerings)}</div></div>
      <div class="metric-card"><div class="label">Otros Ingresos</div><div class="value" style="color:#16a34a">${fmtQ(data.summary.total_incomes)}</div></div>
      <div class="metric-card"><div class="label">Total Gastos</div><div class="value" style="color:#dc2626">${fmtQ(data.summary.total_expenses)}</div></div>
      <div class="metric-card"><div class="label">Balance Neto</div><div class="value" style="color:${balColor}">${fmtQ(bal)}</div></div>
    </div>`);

  if (data.transactions.offerings.length > 0) {
    win.document.write(`<div class="section-title">Ofrendas del Período</div>
      <table><thead><tr><th>Fecha</th><th>Tipo</th><th>Donante</th><th class="right">Monto</th></tr></thead><tbody>`);
    data.transactions.offerings.forEach(o => {
      win.document.write(`<tr><td>${o.date}</td><td>${o.type === "servicio" ? "Ofrenda de Servicio" : "Ofrenda Especial"}</td><td>${o.donor || "—"}</td><td class="right green">${fmtQ(o.amount)}</td></tr>`);
    });
    win.document.write(`</tbody></table>`);
  }

  if (data.transactions.incomes.length > 0) {
    win.document.write(`<div class="section-title">Ingresos Adicionales</div>
      <table><thead><tr><th>Fecha</th><th>Tipo</th><th>Origen</th><th class="right">Monto</th></tr></thead><tbody>`);
    data.transactions.incomes.forEach(i => {
      win.document.write(`<tr><td>${i.date}</td><td>${i.type}</td><td>${i.donor || "—"}</td><td class="right green">${fmtQ(i.amount)}</td></tr>`);
    });
    win.document.write(`</tbody></table>`);
  }

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

export const printFinancialAnnualPDF = (data, year, config) => {
  const fmtQ = n => `Q ${parseFloat(n || 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`;
  const win = pdfOpen("Informe Financiero Anual", config, `Año: ${year}`);

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

export const printMembersPDF = (data, config) => {
  const today = new Date().toLocaleDateString("es-GT", { day: "numeric", month: "long", year: "numeric" });
  const win = pdfOpen("Directorio de Feligreses", config, `Generado el ${today}`);

  win.document.write(`
    <div class="metrics-grid" style="grid-template-columns: repeat(3,1fr)">
      <div class="metric-card"><div class="label">Total Miembros</div><div class="value">${data.summary.total}</div></div>
      <div class="metric-card"><div class="label">Activos</div><div class="value" style="color:#16a34a">${data.summary.active}</div></div>
      <div class="metric-card"><div class="label">Inactivos</div><div class="value" style="color:#94a3b8">${data.summary.inactive}</div></div>
    </div>`);

  if (data.birthdays_this_month.length > 0) {
    win.document.write(`<div class="section-title">🎂 Cumpleaños Este Mes</div>
      <table><thead><tr><th>Nombre</th><th>Fecha de Nacimiento</th><th>Teléfono</th></tr></thead><tbody>`);
    data.birthdays_this_month.forEach(m => {
      win.document.write(`<tr><td class="bold">${m.name}</td><td>${m.birth_date || "—"}</td><td>${m.phone || "—"}</td></tr>`);
    });
    win.document.write(`</tbody></table>`);
  }

  if (data.baptism_anniversaries_this_month.length > 0) {
    win.document.write(`<div class="section-title">✝ Aniversarios de Bautismo Este Mes</div>
      <table><thead><tr><th>Nombre</th><th>Fecha de Bautismo</th><th>Teléfono</th></tr></thead><tbody>`);
    data.baptism_anniversaries_this_month.forEach(m => {
      win.document.write(`<tr><td class="bold">${m.name}</td><td>${m.baptism_date || "—"}</td><td>${m.phone || "—"}</td></tr>`);
    });
    win.document.write(`</tbody></table>`);
  }

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

export const printProjectsPDF = (data, config) => {
  const fmtQ = n => `Q ${parseFloat(n || 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`;
  const today = new Date().toLocaleDateString("es-GT", { day: "numeric", month: "long", year: "numeric" });
  const win = pdfOpen("Inspección de Obras Misioneras", config, `Corte al ${today}`);

  const s = data.summary;
  win.document.write(`
    <div class="metrics-grid">
      <div class="metric-card"><div class="label">Total Proyectos</div><div class="value">${s.total_projects}</div></div>
      <div class="metric-card"><div class="label">Presupuesto Total</div><div class="value" style="color:#1d4ed8;font-size:14px">${fmtQ(s.total_budget)}</div></div>
      <div class="metric-card"><div class="label">Aportado</div><div class="value" style="color:#16a34a;font-size:14px">${fmtQ(s.total_contributions)}</div></div>
      <div class="metric-card"><div class="label">Disponible</div><div class="value" style="color:#d97706;font-size:14px">${fmtQ(s.total_available)}</div></div>
    </div>`);

  if (s.by_status && Object.keys(s.by_status).length > 0) {
    const statusBadgeMap = { "Activo": "badge-green", "Completado": "badge-blue", "Pausado": "badge-yellow", "Cancelado": "badge-red" };
    const statusStr = Object.entries(s.by_status).map(([k, v]) => `<span class="badge ${statusBadgeMap[k] || "badge-gray"}">${k}: ${v}</span>`).join("  ");
    win.document.write(`<div style="margin-bottom:12px;font-size:11px;">${statusStr}</div>`);
  }

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

export const printMemberContributionsPDF = (data, memberName, config) => {
  const fmtQ = n => `Q ${parseFloat(n || 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`;
  const win = pdfOpen("Historial de Aportaciones por Miembro", config, `Feligrés: ${memberName}`);

  win.document.write(`
    <div class="metrics-grid" style="grid-template-columns: repeat(2,1fr)">
      <div class="metric-card"><div class="label">Total de Transacciones</div><div class="value">${data.summary.count}</div></div>
      <div class="metric-card"><div class="label">Monto Total Aportado</div><div class="value" style="color:#16a34a;font-size:16px">${fmtQ(data.summary.total_contributions)}</div></div>
    </div>`);

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

export const printAttendancePDF = (data, month, year, config) => {
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
