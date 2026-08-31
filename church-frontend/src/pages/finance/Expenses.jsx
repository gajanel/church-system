/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { getExpenses, createExpense } from "../../api/finance";
import {
  Button, TextField, Select, MenuItem, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip
} from "@mui/material";
import { Receipt, ChevronLeft, ChevronRight, Delete, Add, Remove } from "@mui/icons-material";
import { TableSkeleton } from "../../components/ui/SkeletonLoader";
import ConfirmDialog from "../../components/ConfirmDialog";

/* ── Default expense types (protected, cannot be deleted) ── */
const DEFAULT_TYPES = ["Alquiler terreno", "Ofrenda misionera", "Ahorro pastoral", "Ofrenda especial", "Otros gastos"];
const DIEZMO_TYPE  = "Diezmo de Ofrendas"; // Special auto-calculated type
const LS_KEY       = "expense_types";

const loadTypes = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY));
    if (Array.isArray(saved) && saved.length > 0) return saved;
  } catch {}
  return [...DEFAULT_TYPES, DIEZMO_TYPE];
};

const saveTypes = (types) => localStorage.setItem(LS_KEY, JSON.stringify(types));

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

export default function Expenses() {
  const { refreshSummary } = useOutletContext();

  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(1);
  const [file, setFile]         = useState(null);

  /* ── Custom types state ── */
  const [expenseTypes, setExpenseTypes] = useState(loadTypes);

  const [form, setForm] = useState({
    expense_type: loadTypes()[0] || DEFAULT_TYPES[0],
    amount:"", date:getToday(), observations:""
  });

  /* ── Custom Types state ── */
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: "", content: "", onConfirm: () => {} });
  const [addPromptOpen, setAddPromptOpen] = useState(false);
  const [newTypeTemp, setNewTypeTemp] = useState("");

  /* ── Persist types ── */
  useEffect(() => { saveTypes(expenseTypes); }, [expenseTypes]);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const res = await getExpenses(page, 10);
      setExpenses(res.data?.items || []);
      setTotal(res.data?.pages || 1);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { loadExpenses(); }, [page]);

  const onSubmit = async e => {
    e.preventDefault(); setError("");
    try {
      const fd = new FormData();
      fd.append("expense_type", form.expense_type);
      fd.append("amount", form.expense_type === DIEZMO_TYPE ? 0 : parseFloat(form.amount));
      fd.append("date", form.date);
      if (form.observations) fd.append("observations", form.observations);
      if (file) fd.append("file", file);

      await createExpense(fd);

      setForm({ expense_type:expenseTypes[0] || DEFAULT_TYPES[0], amount:"", date:getToday(), observations:"" });
      setFile(null);
      loadExpenses();
      if (refreshSummary) refreshSummary();
    } catch { setError("Error al registrar gasto"); }
  };

  const isDiezmo = form.expense_type === DIEZMO_TYPE;

  /* ── Manage types handlers ── */
  const PROTECTED = [...DEFAULT_TYPES, DIEZMO_TYPE];

  const handleQuickAdd = () => {
    setNewTypeTemp("");
    setAddPromptOpen(true);
  };

  const confirmAddType = () => {
    const trimmed = newTypeTemp.trim();
    if (!trimmed) { setAddPromptOpen(false); return; }
    if (expenseTypes.map(t => t.toLowerCase()).includes(trimmed.toLowerCase())) {
      setError("Este rubro ya existe."); setAddPromptOpen(false); return;
    }
    setExpenseTypes(prev => [...prev, trimmed]);
    setForm(f => ({ ...f, expense_type: trimmed }));
    setAddPromptOpen(false);
  };

  const handleQuickRemove = () => {
    if (PROTECTED.includes(form.expense_type)) {
      setError("No puedes eliminar los rubros predeterminados."); return;
    }
    if (expenseTypes.length <= 1) {
      setError("Debe quedar al menos un rubro."); return;
    }
    setConfirmConfig({
      title: "¿Eliminar rubro?",
      content: `¿Seguro que deseas eliminar el rubro "${form.expense_type}"?`,
      onConfirm: () => {
        const remaining = expenseTypes.filter(t => t !== form.expense_type);
        setExpenseTypes(remaining);
        setForm(f => ({ ...f, expense_type: remaining[0] }));
        setConfirmOpen(false);
      }
    });
    setConfirmOpen(true);
  };

  return (
    <>
      {error && <div style={{ color:"var(--color-error)", marginBottom:16 }}>{error}</div>}

      {/* ── Registration form ── */}
      <div style={{ marginBottom:24, boxShadow:"none", border:"1px solid #e5e7eb", borderRadius:"4px", background:"#fff" }}>
        <div style={{ padding:"12px 16px", borderBottom:"1px solid #e5e7eb", fontWeight:600, fontSize:"0.875rem", color:"#374151", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span>Registrar Salida de Efectivo</span>
        </div>
        <div style={{ padding:"16px" }}>
          <form onSubmit={onSubmit}>
            <div style={G2}>
              <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Rubro de Gasto *</InputLabel>
                  <Select value={form.expense_type} label="Rubro de Gasto *" onChange={e => setForm({...form, expense_type:e.target.value})}>
                    {expenseTypes.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </Select>
                </FormControl>
                <IconButton size="small" onClick={handleQuickAdd} color="primary" title="Agregar rubro" sx={{ bgcolor: "#f1f5f9" }}><Add fontSize="small" /></IconButton>
                <IconButton size="small" onClick={handleQuickRemove} color="error" title="Quitar rubro seleccionado" sx={{ bgcolor: "#f1f5f9" }}><Remove fontSize="small" /></IconButton>
              </div>
              <TextField
                required={!isDiezmo}
                type="number"
                size="small"
                label={isDiezmo ? "Se autocalcula (10%)" : "Monto *"}
                inputProps={{ step:"0.01", min:"0" }}
                value={form.amount}
                onChange={e => setForm({...form, amount:e.target.value})}
                disabled={isDiezmo}
              />
              <TextField required type="date" size="small" label="Fecha *" InputLabelProps={{ shrink:true }} value={form.date} onChange={e => setForm({...form, date:e.target.value})} />
              <TextField fullWidth size="small" label="Observaciones y detalles de la factura" value={form.observations} onChange={e => setForm({...form, observations:e.target.value})} />
            </div>

            {/* File attachment */}
            <div style={{ display:"grid", gridTemplateColumns:"auto", justifyContent:"start", marginBottom:16 }}>
              <Button
                variant="outlined"
                component="label"
                color={file ? "success" : "inherit"}
                startIcon={<Receipt />}
                sx={{ textTransform:"none" }}
              >
                {file ? "Cambiar Comprobante" : "Adjuntar Comprobante"}
                <input type="file" hidden accept="image/*,.pdf" onChange={e => setFile(e.target.files[0] || null)} />
              </Button>
            </div>
            {file && (
              <div style={{ fontSize:11, color:"#2E7D32", fontWeight:600, marginBottom:16, display:"flex", alignItems:"center", gap:6 }}>
                ✓ Comprobante listo: {file.name}
                <button type="button" onClick={() => setFile(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"#C62828", fontSize:12, fontWeight:700 }}>✕</button>
              </div>
            )}

            <div style={{ display:"flex", justifyContent:"flex-end" }}>
              <Button type="submit" variant="contained" disableElevation sx={{ bgcolor:"#0F172A", textTransform:"none", fontWeight:600, '&:hover':{bgcolor:"#1E293B"} }}>
                Registrar Gasto
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Expenses table ── */}
      <p style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Historial de Egresos</p>
      {loading ? (
        <TableSkeleton rows={10} cols={6} />
      ) : (
        <TableWrap>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight:600, color:"#374151", bgcolor:"#f9fafb" } }}>
              <TableCell>Fecha</TableCell><TableCell>Concepto</TableCell><TableCell>Observaciones</TableCell><TableCell>Autorizado Por</TableCell><TableCell align="center">Comprobante</TableCell><TableCell align="right">Desembolso</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {expenses.length === 0
              ? <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3, color:"#6b7280" }}>Sin registros</TableCell></TableRow>
              : expenses.map(ex => (
                <TableRow key={ex.id} sx={{ '&:hover': { bgcolor:"#f9fafb" } }}>
                  <TableCell>{ex.date}</TableCell>
                  <TableCell>{ex.expense_type}</TableCell>
                  <TableCell sx={{ color:"#6b7280" }}>{ex.observations||"—"}</TableCell>
                  <TableCell>{ex.created_by_name}</TableCell>
                  <TableCell align="center">
                    {ex.document_url ? (
                      <Button
                        size="small"
                        startIcon={<Receipt />}
                        onClick={() => window.open(`${import.meta.env.VITE_API_BASE_URL || "http://" + window.location.hostname + ":8000"}${ex.document_url}`, "_blank")}
                        sx={{ textTransform:"none" }}
                      >
                        Ver
                      </Button>
                    ) : (
                      <span style={{ fontSize:10, color:"#9ca3af" }}>Sin doc.</span>
                    )}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight:600, color:"#C62828", fontFamily:"ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>-{fmt(ex.amount)}</TableCell>
                </TableRow>
              ))
            }
          </TableBody>
        </TableWrap>
      )}
      <Pager page={page} total={total} onPage={setPage} />

      <Dialog open={addPromptOpen} onClose={() => setAddPromptOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem" }}>Nuevo Rubro de Gasto</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre del rubro"
            fullWidth
            size="small"
            value={newTypeTemp}
            onChange={e => setNewTypeTemp(e.target.value)}
            onKeyDown={e => e.key === "Enter" && confirmAddType()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddPromptOpen(false)} sx={{ textTransform:"none" }}>Cancelar</Button>
          <Button onClick={confirmAddType} variant="contained" disableElevation sx={{ bgcolor:"#0F172A", textTransform:"none" }}>Agregar</Button>
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
