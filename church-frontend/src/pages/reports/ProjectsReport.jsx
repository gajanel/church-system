import { useState } from "react";
import { Box, Typography, Button, Grid, Card, CardContent, Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Paper, Chip, LinearProgress } from "@mui/material";
import { Assignment, Print } from "@mui/icons-material";
import { useOutletContext } from "react-router-dom";
import API from "../../api/api";
import { fmt, printProjectsPDF, ReportSkeleton } from "./utils";

export default function ProjectsReport() {
  const { settings } = useOutletContext();
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
      <Box sx={{ 
        display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', 
        p: 2, mb: 4, bgcolor: "white", borderRadius: 1, 
        border: "1px solid #e5e7eb" 
      }}>
        <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mr: 2 }}>Auditoría de Obras:</Typography>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Button variant="contained" disableElevation startIcon={<Assignment />} onClick={load} sx={{ bgcolor: "#0F172A", "&:hover": { bgcolor: "#1E293B" }, textTransform: "none" }}>
          Revisar Auditoría de Proyectos
        </Button>
        {data && (
          <Button variant="outlined" startIcon={<Print />} onClick={() => printProjectsPDF(data, settings)} sx={{ textTransform: "none", color: "#0F172A", borderColor: "#e5e7eb" }}>
            Compilar Hoja de Impresión
          </Button>
        )}
      </Box>

      {loading ? (
        <ReportSkeleton />
      ) : !data ? (
        <Box sx={{ p: 6, bgcolor: "white", borderRadius: 1, border: "1px solid #e5e7eb", minHeight: 400, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <Assignment sx={{ fontSize: 60, color: "#cbd5e1", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" fontWeight={600}>Auditoría de Proyectos</Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={400} mt={1}>Haz clic en "Revisar Auditoría" para extraer el estado financiero de los proyectos activos.</Typography>
        </Box>
      ) : (
        <Box id="report-projects">
          <Typography variant="h5" fontWeight="800" mb={3} color="#0F172A">🏗️ Auditoría de Ejecución en Proyectos Físicos/Misiones</Typography>

          <Grid container spacing={3} mb={4}>
            {[
              { label: "Obras Vigentes / Totales", value: data.summary.total_projects, color: "#3b82f6" },
              { label: "Presupuesto General Autorizado", value: fmt(data.summary.total_budget), color: "#8b5cf6" },
              { label: "Capital Colectado", value: fmt(data.summary.total_contributions), color: "#16a34a" },
              { label: "Capital Físico Remanente", value: fmt(data.summary.total_available), color: data.summary.total_available >= 0 ? "#16a34a" : "#dc2626" },
            ].map(m => (
              <Grid item xs={12} sm={6} md={3} key={m.label}>
                <Card sx={{ borderLeft: `6px solid ${m.color}`, height: '100%', boxShadow: "none", borderTop: "1px solid #e5e7eb", borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb" }}>
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
                  const sColor = status === "Activo" ? "#16a34a" : status === "Pausado" ? "#f59e0b" : status === "Completado" ? "#3b82f6" : "#dc2626";
                  return (
                    <Card key={status} sx={{ px: 3, py: 1.5, minWidth: 140, borderBottom: `3px solid ${sColor}`, boxShadow: "none", borderTop: "1px solid #e5e7eb", borderRight: "1px solid #e5e7eb", borderLeft: "1px solid #e5e7eb" }}>
                      <Typography variant="caption" fontWeight="700" color="text.secondary">{status}</Typography>
                      <Typography variant="h4" fontWeight="800" color="text.primary">{count}</Typography>
                    </Card>
                  )
                })}
              </Box>
            </Box>
          )}

          <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e5e7eb" }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
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
                        <TableCell align="right" sx={{ color: "#16a34a", fontWeight: "600" }}>{fmt(p.contributions)}</TableCell>
                        <TableCell align="right" sx={{ color: "#dc2626", fontWeight: "600" }}>{fmt(p.spent)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: "700", color: p.available >= 0 ? "text.primary" : "#dc2626" }}>{fmt(p.available)}</TableCell>
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
