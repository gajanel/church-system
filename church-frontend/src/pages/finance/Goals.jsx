import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { getFixedExpenses, createFixedExpense, updateFixedExpense, deleteFixedExpense } from "../../api/finance";
import {
  Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions
} from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";
import { Card, CardHeader, CardBody } from "../../components/ui/Card";
import ConfirmDialog from "../../components/ConfirmDialog";

const fmt = n => `Q ${parseFloat(n || 0).toFixed(2)}`;
const fmtDT = dt => { if (!dt) return "—"; const d = new Date(dt); return d.toLocaleDateString("es-GT")+" "+d.toLocaleTimeString("es-GT",{hour:"2-digit",minute:"2-digit"}); };

const TableWrap = ({ children }) => (
  <TableContainer component={Paper} elevation={0} sx={{ border:"1px solid #e5e7eb", borderRadius:"4px", boxShadow:"none" }}>
    <Table size="small" sx={{ '& .MuiTableCell-root': { padding: '6px 12px', fontSize: '0.8125rem' } }}>{children}</Table>
  </TableContainer>
);

export default function Goals() {
  const { refreshSummary, summary } = useOutletContext();
  
  const [error, setError]         = useState("");
  const [fixedExp, setFixedExp]   = useState([]);
  const [form, setForm]           = useState({ name:"", amount:"" });

  // ── Confirm Dialog ──
  const [confirmOpen, setConfirmOpen]     = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: "", content: "", onConfirm: () => {} });

  // ── Edit Dialog ──
  const [editOpen, setEditOpen]   = useState(false);
  const [editTarget, setEditTarget] = useState(null); // { id, name, amount }
  const [editForm, setEditForm]   = useState({ name:"", amount:"" });
  const [editError, setEditError] = useState("");

  const loadFixed = async () => {
    try { 
      const res = await getFixedExpenses(); 
      setFixedExp(res.data || []); 
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadFixed(); }, []);

  // ── Crear ──
  const onSubmit = async e => {
    e.preventDefault(); setError("");
    try { 
      await createFixedExpense({ name:form.name, amount:parseFloat(form.amount) }); 
      setForm({ name:"", amount:"" }); 
      loadFixed();
      if (refreshSummary) refreshSummary(); 
    }
    catch { setError("Error al registrar meta fija"); }
  };

  // ── Eliminar ──
  const handleDelete = (id) => {
    setConfirmConfig({
      title: "¿Eliminar meta fija?",
      content: "¿Estás seguro de que deseas eliminar esta meta financiera fija?",
      onConfirm: async () => {
        try { 
          await deleteFixedExpense(id); 
          loadFixed();
          if (refreshSummary) refreshSummary();
        }
        catch { setError("Error al eliminar meta fija"); }
        finally { setConfirmOpen(false); }
      }
    });
    setConfirmOpen(true);
  };

  // ── Abrir diálogo de edición ──
  const handleEditOpen = (item) => {
    setEditTarget(item);
    setEditForm({ name: item.name, amount: String(item.amount) });
    setEditError("");
    setEditOpen(true);
  };

  // ── Guardar edición ──
  const handleEditSave = async () => {
    if (!editForm.name || !editForm.amount) { setEditError("Todos los campos son requeridos."); return; }
    setEditError("");
    try {
      await updateFixedExpense(editTarget.id, { name: editForm.name, amount: parseFloat(editForm.amount) });
      setEditOpen(false);
      loadFixed();
      if (refreshSummary) refreshSummary();
    } catch {
      setEditError("Error al actualizar la meta.");
    }
  };

  return (
    <>
      {error && <div style={{ color:"var(--color-error)", marginBottom:16 }}>{error}</div>}
      
      {/* ── Meta vigente ── */}
      <Card style={{ marginBottom:24, background:"#FEF3C7", borderColor:"#FDE68A", borderRadius:"4px", boxShadow:"none" }}>
        <div style={{ padding:"16px", display:"flex", justifyContent:"space-between", alignItems:"center", gap:16, flexWrap:"wrap" }}>
          <div>
            <p style={{ fontWeight:700, fontSize:"0.875rem", margin:"0 0 4px", color:"#92400E" }}>Carga de Obligaciones Fijas</p>
            <p style={{ fontSize:"0.75rem", color:"#B45309", margin:0 }}>Configura cuotas fijas que sumarán la Meta del Tablero principal.</p>
          </div>
          <div style={{ background:"#fff", padding:"12px 24px", borderRadius:"4px", textAlign:"center", border:"1px solid #FDE68A" }}>
            <div style={{ fontSize:"0.65rem", fontWeight:700, color:"#92400E", textTransform:"uppercase" }}>META VIGENTE</div>
            <div style={{ fontSize:"1.25rem", fontWeight:700, color:"#D97706", fontFamily:"ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>{fmt(summary?.monthly_goal || 0)}</div>
          </div>
        </div>
      </Card>
      
      {/* ── Formulario de añadir ── */}
      <Card style={{ marginBottom:24, boxShadow:"none", border:"1px solid #e5e7eb", borderRadius:"4px" }}>
        <div style={{ padding:"12px 16px", borderBottom:"1px solid #e5e7eb", fontWeight:600, fontSize:"0.875rem", color:"#374151" }}>
          Añadir Obligación Fija
        </div>
        <div style={{ padding:"16px" }}>
          <form onSubmit={onSubmit}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:16, alignItems:"flex-start" }}>
              <TextField size="small" required label="Concepto Fijo *" placeholder="Ej. Alquiler mensual" value={form.name} onChange={e => setForm({...form, name:e.target.value})} />
              <TextField size="small" required type="number" label="Monto Mensual *" inputProps={{ step:"0.01", min:"0" }} value={form.amount} onChange={e => setForm({...form, amount:e.target.value})} />
              <Button type="submit" variant="contained" disableElevation sx={{ height:40, bgcolor:"#0F172A", textTransform:"none", fontWeight:600, '&:hover':{bgcolor:"#1E293B"} }}>Añadir Meta</Button>
            </div>
          </form>
        </div>
      </Card>

      {/* ── Tabla de metas ── */}
      <p style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Gastos Fijos Actuales</p>
      <TableWrap>
        <TableHead>
          <TableRow sx={{ '& th': { fontWeight:600, color:"#374151", bgcolor:"#f9fafb" } }}>
            <TableCell>Obligación</TableCell>
            <TableCell>Creador</TableCell>
            <TableCell>Fecha</TableCell>
            <TableCell align="right">Monto</TableCell>
            <TableCell align="center">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {fixedExp.length === 0
            ? <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3, color:"#6b7280" }}>Sin metas configuradas</TableCell></TableRow>
            : fixedExp.map(f => (
              <TableRow key={f.id} sx={{ '&:hover': { bgcolor:"#f9fafb" } }}>
                <TableCell sx={{ fontWeight:600, color:"#111827" }}>{f.name}</TableCell>
                <TableCell>{f.created_by_name}</TableCell>
                <TableCell>{fmtDT(f.created_at)}</TableCell>
                <TableCell align="right" sx={{ fontWeight:600, color:"#111827", fontFamily:"ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>{fmt(f.amount)}</TableCell>
                <TableCell align="center">
                  <IconButton color="primary" size="small" onClick={() => handleEditOpen(f)} title="Editar">
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton color="error" size="small" onClick={() => handleDelete(f.id)} title="Eliminar">
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))
          }
        </TableBody>
      </TableWrap>

      {/* ── Diálogo de Edición ── */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem" }}>Editar Obligación Fija</DialogTitle>
        <DialogContent sx={{ display:"flex", flexDirection:"column", gap:2, pt:"16px !important" }}>
          {editError && <div style={{ color:"var(--color-error)", fontSize:"0.8rem" }}>{editError}</div>}
          <TextField
            size="small"
            label="Concepto"
            value={editForm.name}
            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
            fullWidth
          />
          <TextField
            size="small"
            label="Monto Mensual"
            type="number"
            inputProps={{ step:"0.01", min:"0" }}
            value={editForm.amount}
            onChange={e => setEditForm({ ...editForm, amount: e.target.value })}
            fullWidth
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setEditOpen(false)} variant="outlined" size="small" sx={{ textTransform:"none" }}>Cancelar</Button>
          <Button onClick={handleEditSave} variant="contained" size="small" disableElevation sx={{ bgcolor:"#0F172A", textTransform:"none", '&:hover':{bgcolor:"#1E293B"} }}>Guardar Cambios</Button>
        </DialogActions>
      </Dialog>

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
