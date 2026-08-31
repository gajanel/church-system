/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import { useState, useEffect } from "react";
import { Box, Typography, Button, Grid, Card, Autocomplete, TextField, Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Paper, Chip } from "@mui/material";
import { Assessment, Print, TableChart } from "@mui/icons-material";
import { useOutletContext, useLocation } from "react-router-dom";
import API from "../../api/api";
import { fmt, printMemberContributionsPDF, exportToExcel, ReportSkeleton } from "./utils";

export default function MemberContributions() {
  const { settings } = useOutletContext();
  const location = useLocation();
  const [members, setMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const fetchMembers = async () => {
      try {
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
      <Box sx={{ 
        display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', 
        p: 2, mb: 4, bgcolor: "white", borderRadius: 1, 
        border: "1px solid #e5e7eb" 
      }}>
        <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mr: 2 }}>Seleccione Miembro:</Typography>
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
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Button 
          variant="contained" 
          disableElevation
          startIcon={<Assessment />} 
          onClick={load} 
          disabled={!selectedMemberId}
          sx={{ bgcolor: "#0F172A", "&:hover": { bgcolor: "#1E293B" }, textTransform: "none" }}
        >
          Generar Historial
        </Button>
        {data && (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="outlined" startIcon={<Print />} onClick={() => printMemberContributionsPDF(data, data.member_name, settings)} sx={{ textTransform: "none", color: "#0F172A", borderColor: "#e5e7eb" }}>
              Exportar PDF
            </Button>
            <Button variant="outlined" startIcon={<TableChart />} onClick={() => {
              const rows = [
                ["HISTORIAL INDIVIDUAL DE APORTACIONES", data.member_name],
                [],
                ["Total Aportado", data.summary.total_contributions],
                ["Cantidad de Registros", data.summary.count],
                [],
                ["DETALLE DE TRANSACCIONES"],
                ["Fecha", "Categoría", "Tipo / Concepto", "Observaciones", "Monto"],
                ...data.transactions.map(t => [t.date, t.category, t.type, t.observations || "—", t.amount])
              ];
              exportToExcel(`Aportaciones_${data.member_name.replace(/\s+/g, '_')}`, rows);
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
          <Typography variant="h6" color="text.secondary" fontWeight={600}>Aportaciones por Miembro</Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={400} mt={1}>Seleccione un feligrés y genere el reporte para visualizar su historial de aportaciones y diezmos.</Typography>
        </Box>
      ) : (
        <Box id="report-member-contrib">
          <Typography variant="h5" fontWeight="800" mb={1} color="#0F172A">📜 Historial Individual de Aportaciones</Typography>
          <Typography variant="h6" color="#3b82f6" fontWeight={700} mb={3}>{data.member_name}</Typography>

          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={6}>
              <Card sx={{ borderLeft: '6px solid #16a34a', p: 2, boxShadow: "none", borderTop: "1px solid #e5e7eb", borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb" }}>
                <Typography variant="overline" fontWeight="700" color="text.secondary">Total Aportado</Typography>
                <Typography variant="h4" fontWeight="800">{fmt(data.summary.total_contributions)}</Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card sx={{ borderLeft: '6px solid #3b82f6', p: 2, boxShadow: "none", borderTop: "1px solid #e5e7eb", borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb" }}>
                <Typography variant="overline" fontWeight="700" color="text.secondary">Cantidad de Registros</Typography>
                <Typography variant="h4" fontWeight="800">{data.summary.count}</Typography>
              </Card>
            </Grid>
          </Grid>

          <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e5e7eb" }}>
            <Table size="medium">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
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
                      <TableCell align="right" sx={{ fontWeight: "700", color: "#16a34a" }}>{fmt(t.amount)}</TableCell>
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
