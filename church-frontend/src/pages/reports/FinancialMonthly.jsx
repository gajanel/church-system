/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import { useState, useEffect } from "react";
import { Box, Typography, Button, Grid, Card, CardContent, Select, MenuItem, FormControl, InputLabel, Table, TableBody, TableCell, TableHead, TableRow, Chip, LinearProgress } from "@mui/material";
import { Assessment, Print, TableChart } from "@mui/icons-material";
import { useOutletContext } from "react-router-dom";
import API from "../../api/api";
import { fmt, nowYear, nowMonth, MONTHS_ES, VerticalBars, printFinancialMonthlyPDF, exportToExcel, ReportSkeleton } from "./utils";

export default function FinancialMonthly() {
  const { settings } = useOutletContext();
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
      {/* Compact Parameters Panel */}
      <Box sx={{ 
        display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', 
        p: 2, mb: 4, bgcolor: "white", borderRadius: 1, 
        border: "1px solid #e5e7eb" 
      }}>
        <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mr: 2 }}>Parámetros de Auditoría:</Typography>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Mes</InputLabel>
          <Select value={month} label="Mes" onChange={e => setMonth(+e.target.value)}>
            {MONTHS_ES.map((m, i) => <MenuItem key={i} value={i + 1}>{m}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Año Fiscal</InputLabel>
          <Select value={year} label="Año Fiscal" onChange={e => setYear(+e.target.value)}>
            {[nowYear, nowYear - 1, nowYear - 2].map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </FormControl>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Button variant="contained" disableElevation startIcon={<Assessment />} onClick={load} sx={{ bgcolor: "#0F172A", "&:hover": { bgcolor: "#1E293B" }, textTransform: "none" }}>
          Generar Reporte
        </Button>
        {data && (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="outlined" startIcon={<Print />} onClick={() => printFinancialMonthlyPDF(data, month, year, settings)} sx={{ textTransform: "none", color: "#0F172A", borderColor: "#e5e7eb" }}>
              Exportar PDF
            </Button>
            <Button variant="outlined" startIcon={<TableChart />} onClick={() => {
              let allTx = [];
              data.transactions.offerings.forEach(o => allTx.push({ ...o, type_cat: 'offering', desc: o.type === "servicio" ? "Ofrenda" : `Ofrenda especial${o.donor ? ' - ' + o.donor : ''}` }));
              data.transactions.incomes.forEach(i => allTx.push({ ...i, type_cat: 'income', desc: i.type + (i.donor ? ` - ${i.donor}` : '') }));
              data.transactions.expenses.forEach(e => allTx.push({ ...e, type_cat: 'expense', desc: e.type + (e.observations ? ` - ${e.observations}` : '') }));
              if (data.transactions.injections) {
                data.transactions.injections.forEach(inj => allTx.push({ ...inj, type_cat: 'expense', desc: inj.type + (inj.observations ? ` - ${inj.observations}` : '') }));
              }
            
              allTx.sort((a, b) => new Date(a.date) - new Date(b.date));
            
              let saldoInicial = 0;
              let diezmoManual = 0;
              
              allTx.forEach(t => {
                if ((t.type_cat === 'income' || t.type_cat === 'offering') && t.desc.toLowerCase().includes("saldo inicial")) {
                  saldoInicial += parseFloat(t.amount);
                }
                if (t.type_cat === 'expense' && t.desc.toLowerCase().includes("diezmo")) {
                  diezmoManual += parseFloat(t.amount);
                }
              });
            
              const ofrendasLimpio = parseFloat(data.summary.total_offerings);
              const aportacionesLimpio = parseFloat(data.summary.total_incomes) - saldoInicial;
              
              const diezmoGastos = ofrendasLimpio * 0.10;
              const gastosLimpio = parseFloat(data.summary.pure_expenses) - diezmoManual;
              const totalInyecciones = parseFloat(data.summary.total_injections || 0);
              
              const saldoFinal = ofrendasLimpio + aportacionesLimpio + saldoInicial - diezmoGastos - gastosLimpio - totalInyecciones;

              const rows = [
                ["REGISTROS DE OFRENDAS Y GASTOS"],
                ["IGLESIA DE DIOS EVANGELIO COMPLETO"],
                ["LEÓN DE JUDÁ, LINDA VISTA"],
                [],
                ["Reg.", "Fecha", "Descripcion", "Ofrendas", "Entrada", "Salida"],
                ...allTx.map((t, i) => [
                  i + 1,
                  t.date,
                  t.desc,
                  t.type_cat === 'offering' ? t.amount : "",
                  t.type_cat === 'income' ? t.amount : "",
                  t.type_cat === 'expense' ? t.amount : ""
                ]),
                [],
                ["", "", "", "Saldo Inicial(+)", saldoInicial],
                ["", "", "", "Ofrendas (+)", ofrendasLimpio],
                ["", "", "", "Aportaciones(+)", aportacionesLimpio],
                ["", "", "", "Diezmo(-)", diezmoGastos],
                ["", "", "", "Traslado a Bancos(-)", totalInyecciones],
                ["", "", "", "Gastos(-)", gastosLimpio],
                ["", "", "", "En caja:", saldoFinal]
              ];
              exportToExcel(`Reporte_Financiero_Mensual_${MONTHS_ES[data.period.month - 1]}_${data.period.year}`, rows);
            }} sx={{ textTransform: "none", color: "#059669", borderColor: "#059669" }}>
              Exportar Excel
            </Button>
          </Box>
        )}
      </Box>

      {/* View Area */}
      {loading ? (
        <ReportSkeleton />
      ) : !data ? (
        <Box sx={{ p: 6, bgcolor: "white", borderRadius: 1, border: "1px solid #e5e7eb", minHeight: 400, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <Assessment sx={{ fontSize: 60, color: "#cbd5e1", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" fontWeight={600}>Vista Previa del Documento</Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={400} mt={1}>Selecciona los parámetros y haz clic en "Generar Reporte" para procesar y previsualizar la información de este período.</Typography>
        </Box>
      ) : (
        <Box id="report-fin-monthly">
          <Typography variant="h5" fontWeight="800" mb={3} color="#0F172A">
            📊 Ejecución Financiera — {MONTHS_ES[data.period.month - 1]} {data.period.year}
          </Typography>

          <Grid container spacing={3} mb={4}>
            {[
              { label: "Total Ofrendas", value: fmt(data.summary.total_offerings), color: "#1d4ed8" },
              { label: "Ingresos Adicionales", value: fmt(data.summary.total_incomes), color: "#16a34a" },
              { label: "Total Egresos (Incl. Banco)", value: fmt(data.summary.total_expenses), color: "#dc2626" },
              { label: "Efectivo Disponible", value: fmt(data.summary.balance), color: data.summary.balance >= 0 ? "#16a34a" : "#dc2626" },
            ].map(m => (
              <Grid item xs={12} sm={6} md={3} key={m.label}>
                <Card sx={{ borderTop: `4px solid ${m.color}`, height: '100%', boxShadow: "none", border: "1px solid #e5e7eb" }}>
                  <CardContent>
                    <Typography variant="overline" color="text.secondary" fontWeight="700">{m.label}</Typography>
                    <Typography variant="h5" fontWeight="800" sx={{ mt: 1, color: "text.primary" }}>{m.value}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {data.summary.monthly_goal > 0 && (
            <Card sx={{ p: 3, mb: 4, bgcolor: '#fef3c7', color: '#b45309', display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap', boxShadow: "none", border: "1px solid #fde68a" }}>
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
              <Card sx={{ height: '100%', p: 2, boxShadow: "none", border: "1px solid #e5e7eb" }}>
                <Typography variant="h6" fontWeight="700" mb={2} color="#0F172A">Ofrendas por Tipo</Typography>
                {data.offerings_by_type.length === 0 ? <Typography color="text.secondary">Sin registros</Typography> : (
                  <VerticalBars data={data.offerings_by_type.map(o => ({ label: o.type === "servicio" ? "Servicio" : "Especial", value: o.amount }))} />
                )}
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', p: 2, boxShadow: "none", border: "1px solid #e5e7eb" }}>
                <Typography variant="h6" fontWeight="700" mb={3} color="#0F172A">Gastos por Rubro</Typography>
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
            <Card sx={{ mb: 4, overflow: 'hidden', boxShadow: "none", border: "1px solid #e5e7eb" }}>
              <Typography variant="subtitle1" fontWeight="700" sx={{ p: 2, bgcolor: '#f8fafc', borderBottom: "1px solid #e5e7eb" }}>
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
                      <TableCell align="right" sx={{ fontWeight: "700", color: "#16a34a" }}>{fmt(o.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {data.transactions.incomes && data.transactions.incomes.length > 0 && (
            <Card sx={{ mb: 4, overflow: 'hidden', boxShadow: "none", border: "1px solid #e5e7eb" }}>
              <Typography variant="subtitle1" fontWeight="700" sx={{ p: 2, bgcolor: '#f0fdf4', color: '#16a34a', borderBottom: "1px solid #e5e7eb" }}>
                Detalle de Ingresos Adicionales
              </Typography>
              <Table size="small">
                <TableHead><TableRow><TableCell>Fecha</TableCell><TableCell>Rubro</TableCell><TableCell>Donante</TableCell><TableCell align="right">Monto</TableCell></TableRow></TableHead>
                <TableBody>
                  {data.transactions.incomes.map((inc, i) => (
                    <TableRow key={`inc-${i}`} hover>
                      <TableCell>{inc.date}</TableCell>
                      <TableCell>{inc.type}</TableCell>
                      <TableCell sx={{ color: "text.secondary" }}>{inc.donor || "—"}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: "700", color: "#16a34a" }}>{fmt(inc.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}


          {data.transactions.expenses.length > 0 && (
            <Card sx={{ overflow: 'hidden', boxShadow: "none", border: "1px solid #e5e7eb" }}>
              <Typography variant="subtitle1" fontWeight="700" sx={{ p: 2, bgcolor: '#fef2f2', color: '#dc2626', borderBottom: "1px solid #e5e7eb" }}>
                Detalle de Egresos
              </Typography>
              <Table size="small">
                <TableHead><TableRow><TableCell>Fecha</TableCell><TableCell>Rubro</TableCell><TableCell>Observaciones</TableCell><TableCell align="right">Monto</TableCell></TableRow></TableHead>
                <TableBody>
                  {data.transactions.expenses.map((e, i) => (
                    <TableRow key={`exp-${i}`} hover>
                      <TableCell>{e.date}</TableCell>
                      <TableCell>{e.type}</TableCell>
                      <TableCell sx={{ color: "text.secondary" }}>{e.observations || "—"}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: "700", color: "#dc2626" }}>{fmt(e.amount)}</TableCell>
                    </TableRow>
                  ))}
                  {data.transactions.injections && data.transactions.injections.map((inj, i) => (
                    <TableRow key={`inj-${i}`} hover sx={{ bgcolor: "#eff6ff" }}>
                      <TableCell>{inj.date}</TableCell>
                      <TableCell sx={{ color: "#2563eb", fontWeight: 600 }}>{inj.type}</TableCell>
                      <TableCell sx={{ color: "text.secondary" }}>{inj.observations || "—"}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: "700", color: "#2563eb" }}>{fmt(inj.amount)}</TableCell>
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
