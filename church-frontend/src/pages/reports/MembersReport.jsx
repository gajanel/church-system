/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import { useState } from "react";
import { Box, Typography, Button, Grid, Card, Select, MenuItem, FormControl, Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Paper, Chip } from "@mui/material";
import { PeopleAlt, Print, EventAvailable, LocalOffer, TableChart } from "@mui/icons-material";
import { useOutletContext } from "react-router-dom";
import API from "../../api/api";
import { printMembersPDF, exportToExcel, ReportSkeleton } from "./utils";

export default function MembersReport() {
  const { settings } = useOutletContext();
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
      <Box sx={{ 
        display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', 
        p: 2, mb: 4, bgcolor: "white", borderRadius: 1, 
        border: "1px solid #e5e7eb" 
      }}>
        <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mr: 2 }}>Consulta de miembros:</Typography>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Button variant="contained" disableElevation startIcon={<PeopleAlt />} onClick={load} sx={{ bgcolor: "#0F172A", "&:hover": { bgcolor: "#1E293B" }, textTransform: "none" }}>
          Inspeccionar Demografía
        </Button>
        {data && (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="outlined" startIcon={<Print />} onClick={() => printMembersPDF(data, settings)} sx={{ textTransform: "none", color: "#0F172A", borderColor: "#e5e7eb" }}>
              Exportar PDF
            </Button>
            <Button variant="outlined" startIcon={<TableChart />} onClick={() => {
              const rows = [
                ["DIRECTORIO DE FELIGRESES"],
                ["Total Miembros", data.summary.total],
                ["Activos", data.summary.active],
                ["Inactivos", data.summary.inactive],
                [],
                ["DIRECTORIO COMPLETO"],
                ["No.", "Nombre Completo", "Teléfono", "Email", "Nacimiento", "Bautismo", "Estado"],
                ...data.members.map((m, i) => [i + 1, m.name, m.phone || "—", m.email || "—", m.birth_date || "—", m.baptism_date || "—", m.status === "active" ? "Activo" : "Inactivo"])
              ];
              exportToExcel("Directorio_Miembros", rows);
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
          <PeopleAlt sx={{ fontSize: 60, color: "#cbd5e1", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" fontWeight={600}>Libro Demográfico</Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={400} mt={1}>Haz clic en "Inspeccionar Demografía" para visualizar los datos actuales de la congregación.</Typography>
        </Box>
      ) : (
        <Box id="report-members">
          <Typography variant="h5" fontWeight="800" mb={3} color="#0F172A">Informe demográfico de miembros</Typography>

          <Grid container spacing={3} mb={4} justifyContent="center">
            {[
              { label: "Población Total Registrada", value: data.summary.total, color: "#3b82f6" },
              { label: "Miembros Activos", value: data.summary.active, color: "#16a34a" },
              { label: "Miembros Pasivos/Inactivos", value: data.summary.inactive, color: "#94a3b8" },
            ].map(m => (
              <Grid item xs={12} sm={4} key={m.label}>
                <Card sx={{ 
                  borderBottom: `4px solid ${m.color}`, 
                  height: '100%', 
                  textAlign: 'center', 
                  py: 3, 
                  px: 2, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'center',
                  minHeight: 140,
                  boxShadow: "none", border: "1px solid #e5e7eb"
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
                <Card sx={{ height: '100%', boxShadow: "none", border: "1px solid #e5e7eb" }}>
                  <Typography variant="subtitle1" fontWeight="700" sx={{ p: 2, bgcolor: '#f0fdf4', color: '#16a34a', borderBottom: "1px solid #e5e7eb", display: 'flex', alignItems: 'center', gap: 1 }}>
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
                <Card sx={{ height: '100%', boxShadow: "none", border: "1px solid #e5e7eb" }}>
                  <Typography variant="subtitle1" fontWeight="700" sx={{ p: 2, bgcolor: '#eff6ff', color: '#1d4ed8', borderBottom: "1px solid #e5e7eb", display: 'flex', alignItems: 'center', gap: 1 }}>
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

          <Card sx={{ boxShadow: "none", border: "1px solid #e5e7eb" }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" p={2} borderBottom={1} borderColor="divider" bgcolor="#f8fafc">
              <Typography variant="h6" fontWeight="700">Directorio Oficial Eclesiástico</Typography>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <Select value={filter} onChange={e => setFilter(e.target.value)} sx={{ bgcolor: "white" }}>
                  <MenuItem value="all">Visibilidad Común</MenuItem>
                  <MenuItem value="active">Solo Activos (Militantes)</MenuItem>
                  <MenuItem value="inactive">Solo Resagados (Inactivos)</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <TableContainer>
              <Table size="medium">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
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
                          <Chip label={m.status === "active" ? "Legítimo Activo" : "Reservado"} size="small" sx={{ bgcolor: m.status === "active" ? "#dcfce7" : "#f1f5f9", color: m.status === "active" ? "#16a34a" : "#475569", fontWeight: 700 }} />
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
