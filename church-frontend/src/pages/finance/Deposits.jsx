import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { getDeposits, createDeposit, deleteDeposit } from "../../api/finance";
import {
  Button, TextField, Select, MenuItem, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton
} from "@mui/material";
import { Receipt, Delete, ChevronLeft, ChevronRight } from "@mui/icons-material";
import { Card, CardHeader, CardBody } from "../../components/ui/Card";
import { TableSkeleton } from "../../components/ui/SkeletonLoader";
import ConfirmDialog from "../../components/ConfirmDialog";

const BANKS = ["Banrural","Industrial","G&T","BAC","Otros"];
const getToday = () => new Date().toISOString().split("T")[0];
const fmt = n => `Q ${parseFloat(n || 0).toFixed(2)}`;

const G2 = { display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 };

const TableWrap = ({ children }) => (
  <TableContainer component={Paper} elevation={0} sx={{ border:"1px solid #e5e7eb", borderRadius:"4px", boxShadow:"none" }}>
    <Table size="small" sx={{ '& .MuiTableCell-root': { padding: '6px 12px', fontSize: '0.8125rem' } }}>{children}</Table>
  </TableContainer>
);

const Pager = ({ page, total, onPage }) => (
  total > 1 ? (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:12, marginTop:16, marginBottom:8 }}>
      <IconButton size="small" disabled={page === 1} onClick={() => onPage(page - 1)}><ChevronLeft fontSize="small"/></IconButton>
      <span style={{ fontSize:12, fontWeight:600 }}>Página {page} de {total}</span>
      <IconButton size="small" disabled={page === total} onClick={() => onPage(page + 1)}><ChevronRight fontSize="small"/></IconButton>
    </div>
  ) : null
);

export default function Deposits() {
  const { refreshSummary } = useOutletContext();
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [deposits, setDeposits] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(1);
  
  const [form, setForm] = useState({ slip_number:"", bank_name:"Banrural", amount:"", date:getToday(), observations:"" });
  const [file, setFile] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: "", content: "", onConfirm: () => {} });

  const loadDeposits = async () => {
    setLoading(true);
    try { 
      const res = await getDeposits(page, 10); 
      setDeposits(res.data?.items || []); 
      setTotal(res.data?.pages || 1); 
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => {
    loadDeposits();
  }, [page]);

  const onSubmit = async e => {
    e.preventDefault(); setError("");
    try {
      const fd = new FormData();
      fd.append("slip_number", form.slip_number);
      fd.append("bank_name", form.bank_name);
      fd.append("amount", form.amount);
      fd.append("date", form.date);
      if (form.observations) fd.append("observations", form.observations);
      if (file) fd.append("file", file);

      await createDeposit(fd);
      
      setForm({ slip_number:"", bank_name:"Banrural", amount:"", date:getToday(), observations:"" });
      setFile(null);
      loadDeposits();
      if (refreshSummary) refreshSummary();
    } catch { setError("Error al registrar boleta"); }
  };

  const handleDelete = (id) => {
    setConfirmConfig({
      title: "¿Eliminar boleta de depósito?",
      content: "¿Estás seguro de que deseas eliminar este registro de depósito bancario?",
      onConfirm: async () => {
        try { 
          await deleteDeposit(id); 
          loadDeposits();
          if (refreshSummary) refreshSummary();
        }
        catch { setError("Error al eliminar depósito"); }
        finally { setConfirmOpen(false); }
      }
    });
    setConfirmOpen(true);
  };

  return (
    <>
      {error && <div style={{ color:"var(--color-error)", marginBottom:16 }}>{error}</div>}
      
      <Card style={{ marginBottom:24, boxShadow:"none", border:"1px solid #e5e7eb", borderRadius:"4px" }}>
        <div style={{ padding:"12px 16px", borderBottom:"1px solid #e5e7eb", fontWeight:600, fontSize:"0.875rem", color:"#374151" }}>
          Registrar Boleta de Depósito
        </div>
        <div style={{ padding:"16px" }}>
          <form onSubmit={onSubmit}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:16, marginBottom:16 }}>
              <TextField size="small" required label="Número de Boleta *" value={form.slip_number} onChange={e => setForm({...form, slip_number:e.target.value})} />
              <FormControl fullWidth size="small">
                <InputLabel>Banco *</InputLabel>
                <Select value={form.bank_name} label="Banco *" onChange={e => setForm({...form, bank_name:e.target.value})}>
                  {BANKS.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField size="small" required type="number" label="Monto *" inputProps={{ step:"0.01", min:"0" }} value={form.amount} onChange={e => setForm({...form, amount:e.target.value})} />
              <TextField size="small" required type="date" label="Fecha *" InputLabelProps={{ shrink:true }} value={form.date} onChange={e => setForm({...form, date:e.target.value})} />
            </div>
            
            <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:16, marginBottom:16, alignItems:"start" }}>
              <TextField size="small" fullWidth label="Observaciones" value={form.observations} onChange={e => setForm({...form, observations:e.target.value})} />
              <Button variant="outlined" component="label" color={file ? "success" : "inherit"} sx={{ textTransform:"none", height:40 }}>
                {file ? "Cambiar Imagen" : "Subir Imagen Boleta"}
                <input type="file" hidden accept="image/*" onChange={e => setFile(e.target.files[0] || null)} />
              </Button>
            </div>
            {file && <div style={{ fontSize:11, color:"#2E7D32", fontWeight:600, marginBottom:16 }}>✓ Archivo listo: {file.name}</div>}
            <div style={{ display:"flex", justifyContent:"flex-end" }}>
              <Button type="submit" variant="contained" disableElevation sx={{ bgcolor:"#0F172A", textTransform:"none", fontWeight:600, '&:hover':{bgcolor:"#1E293B"} }} startIcon={<Receipt />}>
                Guardar Boleta
              </Button>
            </div>
          </form>
        </div>
      </Card>

      <p style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Control de Depósitos Realizados</p>
      {loading ? (
        <TableSkeleton rows={10} cols={7} />
      ) : (
        <TableWrap>
          <TableHead>
          <TableRow sx={{ '& th': { fontWeight:600, color:"#374151", bgcolor:"#f9fafb" } }}>
            <TableCell>Fecha</TableCell><TableCell>No. Boleta</TableCell><TableCell>Banco</TableCell><TableCell>Observaciones</TableCell><TableCell align="center">Comprobante</TableCell><TableCell align="right">Monto</TableCell><TableCell align="center">Acción</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {deposits.length === 0 ? <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3, color:"#6b7280" }}>Sin depósitos registrados</TableCell></TableRow>
          : deposits.map(d => (
            <TableRow key={d.id} sx={{ '&:hover': { bgcolor:"#f9fafb" } }}>
              <TableCell>{d.date}</TableCell>
              <TableCell sx={{ fontWeight:600, color:"#111827" }}>{d.slip_number}</TableCell>
              <TableCell>{d.bank_name}</TableCell>
              <TableCell sx={{ color:"#6b7280" }}>{d.observations||"—"}</TableCell>
              <TableCell align="center">
                {d.image_url ? (
                  <Button size="small" startIcon={<Receipt />} onClick={() => window.open(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}${d.image_url}`, "_blank")} sx={{ textTransform:"none" }}>
                    Ver
                  </Button>
                ) : (
                  <span style={{ fontSize:10, color:"#9ca3af" }}>Sin imagen</span>
                )}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight:600, color:"#111827", fontFamily:"ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>{fmt(d.amount)}</TableCell>
              <TableCell align="center">
                <IconButton color="error" size="small" onClick={() => handleDelete(d.id)}>
                  <Delete fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        </TableWrap>
      )}
      <Pager page={page} total={total} onPage={setPage} />

      <ConfirmDialog
        open={confirmOpen}
        title={confirmConfig.title}
        content={confirmConfig.content}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
