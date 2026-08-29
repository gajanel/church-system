/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { getIncomes, createIncome } from "../../api/finance";
import { getMembers } from "../../api/members";
import {
  Button, TextField, Select, MenuItem, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip
} from "@mui/material";
import { ChevronLeft, ChevronRight, Delete, Add, Remove } from "@mui/icons-material";
import { TableSkeleton } from "../../components/ui/SkeletonLoader";
import ConfirmDialog from "../../components/ConfirmDialog";

/* ── Default income types (protected, cannot be deleted) ── */
const DEFAULT_TYPES = ["Donación", "Venta", "Rifa", "Colaboración", "Otros ingresos"];
const LS_KEY        = "income_types";

const loadTypes = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY));
    if (Array.isArray(saved) && saved.length > 0) return saved;
  } catch {}
  return [...DEFAULT_TYPES];
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

export default function Incomes() {
  const { refreshSummary } = useOutletContext();

  const [members, setMembers]   = useState([]);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [incomes, setIncomes]   = useState([]);
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(1);

  /* ── Custom types state ── */
  const [incomeTypes, setIncomeTypes] = useState(loadTypes);

  const [form, setForm] = useState({
    income_type: loadTypes()[0] || DEFAULT_TYPES[0],
    amount:"", date:getToday(), member_id:"", donor_name:"", observations:""
  });

  /* ── Custom Types state ── */
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: "", content: "", onConfirm: () => {} });
  const [addPromptOpen, setAddPromptOpen] = useState(false);
  const [newTypeTemp, setNewTypeTemp] = useState("");

  /* ── Persist types ── */
  useEffect(() => { saveTypes(incomeTypes); }, [incomeTypes]);

  const loadMembersList = async () => {
    try { const res = await getMembers(1, 200); setMembers(res.data?.items || []); } catch (err) { console.error(err); }
  };

  const loadIncomes = async () => {
    setLoading(true);
    try {
      const res = await getIncomes(page, 10);
      setIncomes(res.data?.items || []);
      setTotal(res.data?.pages || 1);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { loadMembersList(); }, []);
  useEffect(() => { loadIncomes(); }, [page]);

  const onSubmit = async e => {
    e.preventDefault(); setError("");
    try {
      await createIncome({
        ...form,
        amount:parseFloat(form.amount),
        member_id:form.member_id ? parseInt(form.member_id) : null,
        donor_name:form.donor_name || null,
        observations:form.observations || null
      });
      setForm({ income_type:incomeTypes[0]||DEFAULT_TYPES[0], amount:"", date:getToday(), member_id:"", donor_name:"", observations:"" });
      loadIncomes();
      if (refreshSummary) refreshSummary();
    } catch { setError("Error al registrar ingreso"); }
  };

  /* ── Manage types handlers ── */
  const handleQuickAdd = () => {
    setNewTypeTemp("");
    setAddPromptOpen(true);
  };

  const confirmAddType = () => {
    const trimmed = newTypeTemp.trim();
    if (!trimmed) { setAddPromptOpen(false); return; }
    if (incomeTypes.map(t => t.toLowerCase()).includes(trimmed.toLowerCase())) {
      setError("Este tipo ya existe."); setAddPromptOpen(false); return;
    }
    setIncomeTypes(prev => [...prev, trimmed]);
    setForm(f => ({ ...f, income_type: trimmed }));
    setAddPromptOpen(false);
  };

  const handleQuickRemove = () => {
    if (DEFAULT_TYPES.includes(form.income_type)) {
      setError("No puedes eliminar los tipos predeterminados."); return;
    }
    if (incomeTypes.length <= 1) {
      setError("Debe quedar al menos un tipo."); return;
    }
    setConfirmConfig({
      title: "¿Eliminar tipo?",
      content: `¿Seguro que deseas eliminar el tipo "${form.income_type}"?`,
      onConfirm: () => {
        const remaining = incomeTypes.filter(t => t !== form.income_type);
        setIncomeTypes(remaining);
        setForm(f => ({ ...f, income_type: remaining[0] }));
        setConfirmOpen(false);
      }
    });
    setConfirmOpen(true);
  };

  const memberSelect = (
    <FormControl fullWidth size="small">
      <InputLabel>Miembro (opcional)</InputLabel>
      <Select value={form.member_id} label="Miembro (opcional)" onChange={e => setForm({...form, member_id:e.target.value, donor_name:""})}>
        <MenuItem value=""><em>— Ninguno —</em></MenuItem>
        {members.map(m => <MenuItem key={m.id} value={m.id}>{m.first_name} {m.last_name}</MenuItem>)}
      </Select>
    </FormControl>
  );

  return (
    <>
      {error && <div style={{ color:"var(--color-error)", marginBottom:16 }}>{error}</div>}

      {/* ── Registration form ── */}
      <div style={{ marginBottom:24, boxShadow:"none", border:"1px solid #e5e7eb", borderRadius:"4px", background:"#fff" }}>
        <div style={{ padding:"12px 16px", borderBottom:"1px solid #e5e7eb", fontWeight:600, fontSize:"0.875rem", color:"#374151", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span>Registrar Ingreso Adicional</span>
        </div>
        <div style={{ padding:"16px" }}>
          <form onSubmit={onSubmit}>
            <div style={G2}>
              <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo de Ingreso *</InputLabel>
                  <Select value={form.income_type} label="Tipo de Ingreso *" onChange={e => setForm({...form, income_type:e.target.value})}>
                    {incomeTypes.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </Select>
                </FormControl>
                <IconButton size="small" onClick={handleQuickAdd} color="primary" title="Agregar tipo" sx={{ bgcolor: "#f1f5f9" }}><Add fontSize="small" /></IconButton>
                <IconButton size="small" onClick={handleQuickRemove} color="error" title="Quitar tipo seleccionado" sx={{ bgcolor: "#f1f5f9" }}><Remove fontSize="small" /></IconButton>
              </div>
              <TextField required type="number" size="small" label="Monto *" inputProps={{ step:"0.01", min:"0" }} value={form.amount} onChange={e => setForm({...form, amount:e.target.value})} />
              <TextField required type="date" size="small" label="Fecha *" InputLabelProps={{ shrink:true }} value={form.date} onChange={e => setForm({...form, date:e.target.value})} />
              <TextField fullWidth size="small" label="Observaciones" value={form.observations} onChange={e => setForm({...form, observations:e.target.value})} />
            </div>
            <div style={G2}>
              {memberSelect}
              {!form.member_id && <TextField size="small" label="Entregado Por" value={form.donor_name} onChange={e => setForm({...form, donor_name:e.target.value})} />}
            </div>
            <div style={{ display:"flex", justifyContent:"flex-end" }}>
              <Button type="submit" variant="contained" disableElevation sx={{ bgcolor:"#0F172A", textTransform:"none", fontWeight:600, '&:hover':{bgcolor:"#1E293B"} }}>
                Registrar Ingreso
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Incomes table ── */}
      <p style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Historial de Ingresos Extras</p>
      {loading ? (
        <TableSkeleton rows={10} cols={5} />
      ) : (
        <TableWrap>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight:600, color:"#374151", bgcolor:"#f9fafb" } }}>
              <TableCell>Fecha</TableCell><TableCell>Canal o Tipo</TableCell><TableCell>Aportado Por</TableCell><TableCell>Observaciones</TableCell><TableCell align="right">Monto</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {incomes.length === 0
              ? <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3, color:"#6b7280" }}>Sin registros</TableCell></TableRow>
              : incomes.map(i => (
                <TableRow key={i.id} sx={{ '&:hover': { bgcolor:"#f9fafb" } }}>
                  <TableCell>{i.date}</TableCell>
                  <TableCell>{i.income_type}</TableCell>
                  <TableCell>{i.donor_name||i.member_name||"—"}</TableCell>
                  <TableCell sx={{ color:"#6b7280" }}>{i.observations||"—"}</TableCell>
                  <TableCell align="right" sx={{ fontWeight:600, color:"#2E7D32", fontFamily:"ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>+{fmt(i.amount)}</TableCell>
                </TableRow>
              ))
            }
          </TableBody>
        </TableWrap>
      )}
      <Pager page={page} total={total} onPage={setPage} />

      <Dialog open={addPromptOpen} onClose={() => setAddPromptOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem" }}>Nuevo Tipo de Ingreso</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre del tipo"
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
