/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import { useState } from "react";
import { Box, Typography, Button, Grid, Card, CardContent, Select, MenuItem, FormControl, InputLabel, Table, TableBody, TableCell, TableHead, TableRow, Chip } from "@mui/material";
import { Assessment, Print, TableChart } from "@mui/icons-material";
import { useOutletContext } from "react-router-dom";
import API from "../../api/api";
import { fmt, nowYear, nowMonth, MONTHS_ES, ReportSkeleton, exportToExcel } from "./utils";

export default function FinancialBankMonthly() {
  const { settings } = useOutletContext();
  const [month, setMonth] = useState(nowMonth);
  const [year, setYear] = useState(nowYear);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/reports/financial/bank-monthly?month=${month}&year=${year}&_t=${Date.now()}`);
      setData(res.data);
    } catch { setData(null); }
    setLoading(false);
  };

  return (
    <Box>
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
            <Button variant="outlined" startIcon={<TableChart />} onClick={() => {
              const rows = [
                ["REPORTE MENSUAL DE BANCOS"],
                ["IGLESIA DE DIOS EVANGELIO COMPLETO"],
                ["LEÓN DE JUDÁ, LINDA VISTA"],
                [],
                ["Período:", `${MONTHS_ES[data.period.month - 1]} ${data.period.year}`],
                [],
                ["RESUMEN"],
                ["Total Depósitos", data.summary.total_deposits],
                ["Total Inyecciones desde Caja", data.summary.total_injections],
                ["Total Ingresos a Banco", data.summary.total_incomes],
                ["Total Retiros", data.summary.total_withdrawals],
                ["Flujo Neto", data.summary.net_flow],
                [],
                ["DETALLE DE MOVIMIENTOS"],
                ["Fecha", "Tipo", "Cuenta", "Referencia", "Observaciones", "Monto", "Signo"],
                ...data.transactions.map(t => [
                  t.date,
                  t.type,
                  t.account,
                  t.reference || "",
                  t.observations || "",
                  t.amount,
                  t.sign
                ])
              ];
              exportToExcel(`Reporte_Bancos_${MONTHS_ES[data.period.month - 1]}_${data.period.year}`, rows);
            }} sx={{ textTransform: "none", color: "#059669", borderColor: "#059669" }}>
              Exportar Excel
            </Button>
          </Box>
        )}
      </Box>

      {loading ? (
        <ReportSkeleton />
      ) : !data ? (
        <Box sx={{ p: 6, bgcolor: "white", borderRadius: 1, border: "1px solid #e5e7eb", minHeight: 400, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <Assessment sx={{ fontSize: 60, color: "#cbd5e1", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" fontWeight={600}>Vista Previa del Documento</Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={400} mt={1}>Selecciona los parámetros y haz clic en "Generar Reporte" para procesar y previsualizar los movimientos bancarios.</Typography>
        </Box>
      ) : (
        <Box id="report-bank-monthly">
          <Typography variant="h5" fontWeight="800" mb={3} color="#0F172A">
            🏦 Reporte Mensual de Bancos — {MONTHS_ES[data.period.month - 1]} {data.period.year}
          </Typography>

          <Grid container spacing={3} mb={4}>
            {[
              { label: "Total Depósitos Directos", value: fmt(data.summary.total_deposits), color: "#16a34a" },
              { label: "Inyecciones (Desde Caja)", value: fmt(data.summary.total_injections), color: "#2563eb" },
              { label: "Total Retiros", value: fmt(data.summary.total_withdrawals), color: "#dc2626" },
              { label: "Flujo Neto Mensual", value: fmt(data.summary.net_flow), color: data.summary.net_flow >= 0 ? "#16a34a" : "#dc2626" },
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

          {data.transactions && data.transactions.length > 0 ? (
            <Card sx={{ mb: 4, overflow: 'hidden', boxShadow: "none", border: "1px solid #e5e7eb" }}>
              <Typography variant="subtitle1" fontWeight="700" sx={{ p: 2, bgcolor: '#f8fafc', borderBottom: "1px solid #e5e7eb" }}>
                Historial de Movimientos
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Cuenta</TableCell>
                    <TableCell>Referencia</TableCell>
                    <TableCell>Observaciones</TableCell>
                    <TableCell align="right">Monto</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.transactions.map((t, i) => (
                    <TableRow key={i} hover sx={{ bgcolor: t.sign === "+" ? "transparent" : "#fef2f2" }}>
                      <TableCell>{t.date}</TableCell>
                      <TableCell>
                        <Chip 
                          label={t.type} 
                          size="small" 
                          color={t.sign === "+" ? "success" : "error"} 
                          variant="outlined" 
                        />
                      </TableCell>
                      <TableCell sx={{ color: "text.secondary" }}>{t.account}</TableCell>
                      <TableCell sx={{ color: "text.secondary" }}>{t.reference || "—"}</TableCell>
                      <TableCell sx={{ color: "text.secondary" }}>{t.observations || "—"}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: "700", color: t.sign === "+" ? "#16a34a" : "#dc2626" }}>
                        {t.sign} {fmt(t.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <Typography color="text.secondary" textAlign="center" mt={4}>
              No hay movimientos bancarios registrados en este período.
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
