import { useState } from "react";
import { Box, Typography, Button, Grid, Card, CardContent, Select, MenuItem, FormControl, InputLabel, Table, TableBody, TableCell, TableHead, TableRow, Chip } from "@mui/material";
import { Assessment, Print } from "@mui/icons-material";
import { useOutletContext } from "react-router-dom";
import API from "../../api/api";
import { nowYear, nowMonth, MONTHS_ES, VerticalBars, printAttendancePDF, ReportSkeleton } from "./utils";

export default function AttendanceReport() {
  const { settings } = useOutletContext();
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
          <InputLabel>Año</InputLabel>
          <Select value={year} label="Año" onChange={e => setYear(+e.target.value)}>
            {[nowYear, nowYear - 1, nowYear - 2].map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </FormControl>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Button variant="contained" disableElevation startIcon={<Assessment />} onClick={load} sx={{ bgcolor: "#0F172A", "&:hover": { bgcolor: "#1E293B" }, textTransform: "none" }}>
          Ver Reporte
        </Button>
        {data && (
          <Button variant="outlined" startIcon={<Print />} onClick={() => printAttendancePDF(data, month, year, settings)} sx={{ textTransform: "none", color: "#0F172A", borderColor: "#e5e7eb" }}>
            Imprimir
          </Button>
        )}
      </Box>

      {loading ? (
        <ReportSkeleton />
      ) : !data ? (
        <Box sx={{ p: 6, bgcolor: "white", borderRadius: 1, border: "1px solid #e5e7eb", minHeight: 400, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <Assessment sx={{ fontSize: 60, color: "#cbd5e1", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" fontWeight={600}>Balance de Asistencia</Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={400} mt={1}>Selecciona el mes y haz clic en "Ver Reporte" para procesar las métricas de asistencia e integración de nuevos creyentes.</Typography>
        </Box>
      ) : (
        <Box id="report-attendance">
          <Typography variant="h5" fontWeight="800" mb={3} color="#0F172A">📈 Balance Mensual de Asistencia — {MONTHS_ES[data.period.month - 1]} {data.period.year}</Typography>

          <Grid container spacing={3} mb={4}>
            {[
              { label: "Servicios en el Mes", value: data.summary.total_records, color: "#3b82f6" },
              { label: "Asistencia Total Acumulada", value: data.summary.grand_total, color: "#8b5cf6" },
              { label: "Promedio General", value: data.summary.avg_attendance, color: "#16a34a" },
              { label: "Total Nuevos Convertidos", value: data.summary.total_converts, color: "#dc2626" },
            ].map(m => (
              <Grid item xs={12} sm={6} md={3} key={m.label}>
                <Card sx={{ borderTop: `4px solid ${m.color}`, height: '100%', textAlign: 'center', boxShadow: "none", borderLeft: "1px solid #e5e7eb", borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb" }}>
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
              <Card sx={{ height: '100%', p: 2, boxShadow: "none", border: "1px solid #e5e7eb" }}>
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
              <Card sx={{ height: '100%', p: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxShadow: "none", border: "1px solid #e5e7eb" }}>
                 <Typography variant="h6" fontWeight="700" color="#1e3a8a">Mantenimiento de la Obra</Typography>
                 <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ maxWidth: 300, mt: 1 }}>
                   El promedio de asistencia general de <strong>{data.summary.avg_attendance}</strong> personas por culto refleja la fidelidad de la congregación durante el mes de {MONTHS_ES[month-1]}.
                 </Typography>
                 <Box sx={{ mt: 3, p: 2, bgcolor: '#fef2f2', borderRadius: 2, border: '1px solid', borderColor: '#fca5a5', width: '100%', maxWidth: 300 }}>
                    <Typography variant="h4" fontWeight="800" color="#dc2626" textAlign="center">
                      {data.summary.total_converts}
                    </Typography>
                    <Typography variant="caption" fontWeight="700" display="block" textAlign="center" color="#dc2626">NUEVAS ALMAS (CONVERTIDOS)</Typography>
                 </Box>
              </Card>
            </Grid>
          </Grid>

          <Card sx={{ overflow: 'hidden', boxShadow: "none", border: "1px solid #e5e7eb" }}>
            <Typography variant="subtitle1" fontWeight="700" sx={{ p: 2, bgcolor: '#f8fafc', borderBottom: "1px solid #e5e7eb" }}>
              Historial Detallado del Mes
            </Typography>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Actividad</TableCell>
                  <TableCell align="center">Cab.</TableCell>
                  <TableCell align="center">Dam.</TableCell>
                  <TableCell align="center">Jóv.</TableCell>
                  <TableCell align="center">Niñ.</TableCell>
                  <TableCell align="center">Vis.</TableCell>
                  <TableCell align="center" sx={{ color: '#dc2626', fontWeight: 'bold' }}>Conv.</TableCell>
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
                    <TableCell align="center" sx={{ fontWeight: 'bold', color: '#dc2626' }}>{r.converts}</TableCell>
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
