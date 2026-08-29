/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { getOfferings, createOffering } from "../../api/finance";
import { getMembers } from "../../api/members";
import {
  Button, TextField, Select, MenuItem, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip
} from "@mui/material";
import { ChevronLeft, ChevronRight, Delete, Add } from "@mui/icons-material";
import { TableSkeleton } from "../../components/ui/SkeletonLoader";

/* ── Default offering types (always kept as base) ── */
const DEFAULT_TYPES = ["servicio", "especial"];
const LS_KEY = "offering_types";

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

/* ── Label helper ── */
const typeLabel = (t) => t.charAt(0).toUpperCase() + t.slice(1).replace(/_/g, " ");

export default function Offerings() {
  const { refreshSummary } = useOutletContext();

  const [members, setMembers]     = useState([]);
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [offerings, setOfferings] = useState([]);
  const [page, setPage]           = useState(1);
  const [total, setTotal]         = useState(1);

  /* ── Custom types state ── */
  const [offeringTypes, setOfferingTypes] = useState(loadTypes);
  const [manageOpen, setManageOpen]       = useState(false);
  const [newTypeName, setNewTypeName]     = useState("");
  const [typeError, setTypeError]         = useState("");

  const [form, setForm] = useState({
    offering_type: loadTypes()[0] || "servicio",
    amount:"", date:getToday(), member_id:"", donor_name:"", observations:""
  });

  /* ── Persist types ── */
  useEffect(() => { saveTypes(offeringTypes); }, [offeringTypes]);

  const loadMembersList = async () => {
    try { const res = await getMembers(1, 200); setMembers(res.data?.items || []); } catch (err) { console.error(err); }
  };

  const loadOfferings = async () => {
    setLoading(true);
    try {
      const res = await getOfferings(page, 10);
      setOfferings(res.data?.items || []);
      setTotal(res.data?.pages || 1);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { loadMembersList(); }, []);
  useEffect(() => { loadOfferings(); }, [page]);

  const onSubmit = async e => {
    e.preventDefault(); setError("");
    try {
      await createOffering({
        ...form,
        amount:parseFloat(form.amount),
        member_id:form.member_id ? parseInt(form.member_id) : null,
        donor_name:form.donor_name || null,
        observations:form.observations || null
      });
      setForm({ offering_type:offeringTypes[0]||"servicio", amount:"", date:getToday(), member_id:"", donor_name:"", observations:"" });
      loadOfferings();
      if (refreshSummary) refreshSummary();
    } catch { setError("Error al registrar ofrenda"); }
  };

  /* ── Manage types handlers ── */
  const handleAddType = () => {
    const trimmed = newTypeName.trim().toLowerCase();
    if (!trimmed) { setTypeError("El nombre no puede estar vacío."); return; }
    if (offeringTypes.includes(trimmed)) { setTypeError("Este tipo ya existe."); return; }
    setOfferingTypes(prev => [...prev, trimmed]);
    setNewTypeName("");
    setTypeError("");
  };

  const handleRemoveType = (type) => {
    if (DEFAULT_TYPES.includes(type)) { setTypeError("No puedes eliminar los tipos predeterminados."); return; }
    if (offeringTypes.length <= 1) { setTypeError("Debe quedar al menos un tipo."); return; }
    setOfferingTypes(prev => prev.filter(t => t !== type));
    // Reset form if current type was deleted
    setForm(f => ({ ...f, offering_type: f.offering_type === type ? offeringTypes.filter(t => t !== type)[0] : f.offering_type }));
    setTypeError("");
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
          <span>Registrar Ofrenda</span>
          <Button
            size="small"
            variant="outlined"
            onClick={() => { setManageOpen(true); setTypeError(""); setNewTypeName(""); }}
            sx={{ fontSize:"0.75rem", textTransform:"none", borderColor:"#e5e7eb", color:"#374151", '&:hover':{ borderColor:"#9ca3af" } }}
          >
            Gestionar tipos
          </Button>
        </div>
        <div style={{ padding:"16px" }}>
          <form onSubmit={onSubmit}>
            <div style={G2}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de ofrenda *</InputLabel>
                <Select value={form.offering_type} label="Tipo de ofrenda *" onChange={e => setForm({...form, offering_type:e.target.value})}>
                  {offeringTypes.map(t => (
                    <MenuItem key={t} value={t}>{typeLabel(t)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField required type="number" size="small" label="Monto (GTQ) *" inputProps={{ step:"0.01", min:"0" }} value={form.amount} onChange={e => setForm({...form, amount:e.target.value})} />
              <TextField required type="date" size="small" label="Fecha *" InputLabelProps={{ shrink:true }} value={form.date} onChange={e => setForm({...form, date:e.target.value})} />
              <TextField fullWidth size="small" label="Observaciones (opcional)" value={form.observations} onChange={e => setForm({...form, observations:e.target.value})} />
            </div>

            {/* Show member/donor only for non-service types */}
            {form.offering_type !== "servicio" && (
              <div style={G2}>
                {memberSelect}
                {!form.member_id && <TextField size="small" label="Nombre del donante" value={form.donor_name} onChange={e => setForm({...form, donor_name:e.target.value})} />}
              </div>
            )}

            <div style={{ display:"flex", justifyContent:"flex-end" }}>
              <Button type="submit" variant="contained" disableElevation sx={{ bgcolor:"#0F172A", textTransform:"none", fontWeight:600, '&:hover':{bgcolor:"#1E293B"} }}>
                Registrar Ofrenda
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Offerings table ── */}
      <p style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Historial de Ofrendas</p>
      {loading ? (
        <TableSkeleton rows={10} cols={6} />
      ) : (
        <TableWrap>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight:600, color:"#374151", bgcolor:"#f9fafb" } }}>
              <TableCell>Fecha</TableCell><TableCell>Tipo</TableCell><TableCell>Aportado Por</TableCell><TableCell>Observaciones</TableCell><TableCell>Registrado Por</TableCell><TableCell align="right">Monto</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {offerings.length === 0
              ? <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3, color:"#6b7280" }}>Sin registros</TableCell></TableRow>
              : offerings.map(o => (
                <TableRow key={o.id} sx={{ '&:hover': { bgcolor:"#f9fafb" } }}>
                  <TableCell>{o.date}</TableCell>
                  <TableCell>{typeLabel(o.offering_type)}</TableCell>
                  <TableCell>{o.donor_name||o.member_name||"—"}</TableCell>
                  <TableCell sx={{ color:"#6b7280" }}>{o.observations||"—"}</TableCell>
                  <TableCell>{o.created_by_name}</TableCell>
                  <TableCell align="right" sx={{ fontWeight:600, color:"#2E7D32", fontFamily:"ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>+{fmt(o.amount)}</TableCell>
                </TableRow>
              ))
            }
          </TableBody>
        </TableWrap>
      )}
      <Pager page={page} total={total} onPage={setPage} />

      {/* ── Manage Types Dialog ── */}
      <Dialog open={manageOpen} onClose={() => setManageOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight:700, fontSize:"1rem", pb:1 }}>Gestionar Tipos de Ofrenda</DialogTitle>
        <DialogContent sx={{ pt:"8px !important" }}>
          {typeError && (
            <div style={{ color:"var(--color-error)", fontSize:"0.8rem", marginBottom:12, padding:"8px 12px", background:"#fff5f5", borderRadius:4, border:"1px solid #fecaca" }}>
              {typeError}
            </div>
          )}

          {/* Existing types */}
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:20 }}>
            {offeringTypes.map(t => (
              <Chip
                key={t}
                label={typeLabel(t)}
                size="small"
                onDelete={DEFAULT_TYPES.includes(t) ? undefined : () => handleRemoveType(t)}
                deleteIcon={<Delete fontSize="small" />}
                sx={{
                  bgcolor: DEFAULT_TYPES.includes(t) ? "#f1f5f9" : "#fff",
                  border: "1px solid #e2e8f0",
                  fontWeight: 600,
                  fontSize: "0.78rem",
                  color: "#374151",
                  '& .MuiChip-deleteIcon': { color:"#ef4444" }
                }}
              />
            ))}
          </div>

          {/* Add new type */}
          <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
            <TextField
              size="small"
              label="Nuevo tipo"
              placeholder="Ej: diezmo, misiones…"
              value={newTypeName}
              onChange={e => { setNewTypeName(e.target.value); setTypeError(""); }}
              onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleAddType())}
              fullWidth
            />
            <Button
              variant="contained"
              disableElevation
              onClick={handleAddType}
              startIcon={<Add />}
              sx={{ bgcolor:"#0F172A", textTransform:"none", fontWeight:600, height:40, whiteSpace:"nowrap", '&:hover':{bgcolor:"#1E293B"} }}
            >
              Agregar
            </Button>
          </div>
          <p style={{ fontSize:"0.72rem", color:"#9ca3af", margin:"10px 0 0" }}>
            Los tipos predeterminados (Servicio, Especial) no pueden eliminarse.
          </p>
        </DialogContent>
        <DialogActions sx={{ px:3, pb:2 }}>
          <Button onClick={() => setManageOpen(false)} variant="outlined" size="small" sx={{ textTransform:"none" }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
