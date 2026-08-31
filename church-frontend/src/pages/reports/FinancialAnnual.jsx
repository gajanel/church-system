/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import { useState, useEffect } from "react";
import { Box, Typography, Button, Grid, Card, CardContent, Select, MenuItem, FormControl, InputLabel, Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Paper } from "@mui/material";
import { Assessment, Print, TableChart } from "@mui/icons-material";
import { useOutletContext } from "react-router-dom";
import API from "../../api/api";
import { fmt, nowYear, MONTHS_ES, printFinancialAnnualPDF, exportToExcel, ReportSkeleton } from "./utils";

export default function FinancialAnnual() {
  const { settings } = useOutletContext();
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
      {/* Compact Parameters Panel */}
      <Box sx={{ 
        display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', 
        p: 2, mb: 4, bgcolor: "white", borderRadius: 1, 
        border: "1px solid #e5e7eb" 
      }}>
        <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mr: 2 }}>Parámetros de Auditoría:</Typography>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Periodo Fiscal</InputLabel>
          <Select value={year} label="Periodo Fiscal" onChange={e => setYear(+e.target.value)}>
            {[nowYear, nowYear - 1, nowYear - 2, nowYear - 3].map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </FormControl>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Button variant="contained" disableElevation startIcon={<Assessment />} onClick={load} sx={{ bgcolor: "#0F172A", "&:hover": { bgcolor: "#1E293B" }, textTransform: "none" }}>
          Extraer Reporte Anual
        </Button>
        {data && (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="outlined" startIcon={<Print />} onClick={() => printFinancialAnnualPDF(data, year, settings)} sx={{ textTransform: "none", color: "#0F172A", borderColor: "#e5e7eb" }}>
              Exportar PDF
            </Button>
            <Button variant="outlined" startIcon={<TableChart />} onClick={() => {
              const rows = [
                ["INFORME FINANCIERO ANUAL", `Año ${data.year}`],
                [],
                ["RESUMEN CONSOLIDADO"],
                ["Total Ofrendas", data.year_totals.total_offerings],
                ["Otros Ingresos", data.year_totals.total_incomes],
                ["Total Gastos", data.year_totals.total_expenses],
                ["Balance Anual", data.year_totals.balance],
                [],
                ["DESGLOSE MENSUAL"],
                ["Mes", "Ofrendas", "Ingresos", "Gastos", "Balance"],
                ...data.monthly_breakdown.map(r => [MONTHS_ES[r.month - 1], r.total_offerings, r.total_incomes, r.total_expenses, r.balance]),
                ["TOTALES", data.year_totals.total_offerings, data.year_totals.total_incomes, data.year_totals.total_expenses, data.year_totals.balance]
              ];
              exportToExcel(`Reporte_Financiero_Anual_${data.year}`, rows);
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
          <Typography variant="h6" color="text.secondary" fontWeight={600}>Corte Anual Definitivo</Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={400} mt={1}>Seleccione el período fiscal y genere el reporte para previsualizar el consolidado de todo el año.</Typography>
        </Box>
      ) : (
        <Box id="report-fin-annual">
          <Typography variant="h5" fontWeight="800" mb={3} color="#0F172A">📈 Resumen Consolidado Anual — {data.year}</Typography>

          <Grid container spacing={3} mb={4}>
            {[
              { label: "Acumulado Ofrendas", value: fmt(data.year_totals.total_offerings), color: "#1d4ed8" },
              { label: "Acumulado Otros Ing.", value: fmt(data.year_totals.total_incomes), color: "#8b5cf6" },
              { label: "Total Egresado", value: fmt(data.year_totals.total_expenses), color: "#dc2626" },
              { label: "Balance Anual", value: fmt(data.year_totals.balance), color: data.year_totals.balance >= 0 ? "#16a34a" : "#dc2626" },
            ].map(m => (
              <Grid item xs={12} sm={6} md={3} key={m.label}>
                <Card sx={{ borderLeft: `6px solid ${m.color}`, height: '100%', boxShadow: "none", borderTop: "1px solid #e5e7eb", borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb" }}>
                  <CardContent>
                    <Typography variant="overline" color="text.secondary" fontWeight="700">{m.label}</Typography>
                    <Typography variant="h5" fontWeight="800" sx={{ mt: 1 }}>{m.value}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Card sx={{ p: 3, mb: 4, overflowX: 'auto', boxShadow: "none", border: "1px solid #e5e7eb" }}>
            <Typography variant="h6" fontWeight="700" mb={2} color="#0F172A">Fluctuación Mensual: Ingresos vs. Gastos</Typography>
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

          <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e5e7eb" }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
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
                    <TableCell align="right" sx={{ color: "#3b82f6" }}>{fmt(r.total_offerings)}</TableCell>
                    <TableCell align="right" sx={{ color: "#8b5cf6" }}>{fmt(r.total_incomes)}</TableCell>
                    <TableCell align="right" sx={{ color: "#ef4444" }}>{fmt(r.total_expenses)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: "700", color: r.balance >= 0 ? "#16a34a" : "#ef4444" }}>{fmt(r.balance)}</TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: '#eff6ff' }}>
                  <TableCell sx={{ fontWeight: "800", color: "#1e3a8a" }}>TOTAL CONSOLIDADO</TableCell>
                  <TableCell align="right" sx={{ fontWeight: "800", color: "#1e3a8a" }}>{fmt(data.year_totals.total_offerings)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: "800", color: "#1e3a8a" }}>{fmt(data.year_totals.total_incomes)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: "800", color: "#1e3a8a" }}>{fmt(data.year_totals.total_expenses)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: "800", color: data.year_totals.balance >= 0 ? "#16a34a" : "#ef4444" }}>{fmt(data.year_totals.balance)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
}
