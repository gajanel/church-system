/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { 
  getDeposits, getInjections, deleteDeposit, deleteInjection,
  getBankAccounts, createBankAccount, deleteBankAccount,
  getWithdrawals, createWithdrawal, deleteWithdrawal,
} from "../../api/finance";
import {
  Button, TextField, Select, MenuItem, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton,
  Tabs, Tab, Box, InputAdornment, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions
} from "@mui/material";
import { 
  Receipt, Delete, ChevronLeft, ChevronRight, AddCard, Search,
  TrendingDown, AttachFile, AccountBalance
} from "@mui/icons-material";
import { Card } from "../../components/ui/Card";
import { TableSkeleton } from "../../components/ui/SkeletonLoader";
import ConfirmDialog from "../../components/ConfirmDialog";

const GT_BANKS = [
  "El Crédito Hipotecario Nacional de Guatemala",
  "Banco Inmobiliario, S. A.",
  "Banco de los Trabajadores",
  "Banco Industrial, S. A.",
  "Banco de Desarrollo Rural",
  "Banco Internacional, S. A.",
  "Vivibanco, S. A.",
  "Banco Ficohsa Guatemala, S. A.",
  "Banco Promerica, S. A.",
  "Banco de Antigua, S. A.",
  "Banco de América Central, S. A.",
  "Banco Agromercantil de Guatemala, S. A.",
  "Banco G&T Continental, S. A.",
  "Banco Azteca de Guatemala, S. A.",
  "Banco INV, S. A."
];

const getToday = () => new Date().toISOString().split("T")[0];
const fmt = n => `Q ${parseFloat(n || 0).toFixed(2)}`;

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

// Badge de tipo de movimiento
const MovBadge = ({ type }) => {
  const styles = {
    deposit:    { bg:"#f3f4f6",  color:"#374151",  label:"Histórico" },
    injection:  { bg:"#eff6ff",  color:"#2563eb",  label:"Inyección" },
    withdrawal: { bg:"#fff7ed",  color:"#c2410c",  label:"Retiro" },
  };
  const s = styles[type] || styles.deposit;
  return (
    <span style={{ fontSize:11, background:s.bg, color:s.color, padding:"2px 6px", borderRadius:4, fontWeight:600 }}>
      {s.label}
    </span>
  );
};

const EMPTY_WD_FORM = {
  bank_account_id: "",
  amount: "",
  date: getToday(),
  concept: "",
  reference_number: "",
  observations: "",
  file: null,
};

export default function BanksModule() {
  const { refreshSummary } = useOutletContext();
  const [tab, setTab] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isSuper = currentUser?.is_super_admin;

  // --- Accounts State ---
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [accForm, setAccForm] = useState({ bank_name: "", account_name: "", account_number: "" });

  // --- Movements (deposits + injections) ---
  const [allMovements, setAllMovements] = useState([]);
  const [filteredMovements, setFilteredMovements] = useState([]);
  const [loadingDeposits, setLoadingDeposits] = useState(false);
  const [depPage, setDepPage] = useState(1);
  const [searchSlip, setSearchSlip] = useState("");
  const [searchDate, setSearchDate] = useState("");

  // --- Withdrawals State ---
  const [withdrawals, setWithdrawals] = useState([]);
  const [filteredWd, setFilteredWd] = useState([]);
  const [loadingWd, setLoadingWd] = useState(false);
  const [wdPage, setWdPage] = useState(1);
  const [wdSearchDate, setWdSearchDate] = useState("");
  const [wdSearchConcept, setWdSearchConcept] = useState("");
  const [wdForm, setWdForm] = useState(EMPTY_WD_FORM);
  const [showWdForm, setShowWdForm] = useState(false);

  const itemsPerPage = 10;
  const depTotal = Math.ceil(filteredMovements.length / itemsPerPage) || 1;
  const wdTotal  = Math.ceil(filteredWd.length / itemsPerPage) || 1;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: "", content: "", onConfirm: () => {} });

  // --- Loaders ---
  const loadAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const res = await getBankAccounts();
      setAccounts(res.data || []);
    } catch { setError("Error al cargar cuentas"); }
    setLoadingAccounts(false);
  };

  const loadMovements = async () => {
    setLoadingDeposits(true);
    try { 
      const [resDep, resInj, resWd] = await Promise.all([
        getDeposits(1, 2000),
        getInjections(1, 2000),
        getWithdrawals(1, 2000),
      ]);
      const deps = (resDep.data?.items || []).map(d => ({ ...d, _type: 'deposit' }));
      const injs = (resInj.data?.items || []).map(i => ({ ...i, _type: 'injection' }));
      const wds  = (resWd.data?.items  || []).map(w => ({ ...w, _type: 'withdrawal' }));
      const combined = [...deps, ...injs, ...wds].sort((a, b) => new Date(b.date) - new Date(a.date));
      setAllMovements(combined);
    } catch { setError("Error al cargar movimientos"); }
    setLoadingDeposits(false);
  };

  const loadWithdrawals = async () => {
    setLoadingWd(true);
    try {
      const res = await getWithdrawals(1, 2000);
      setWithdrawals(res.data?.items || []);
    } catch { setError("Error al cargar retiros"); }
    setLoadingWd(false);
  };

  useEffect(() => {
    loadAccounts();
    loadMovements();
    loadWithdrawals();
  }, []);

  // Filtros movimientos (tab 0)
  useEffect(() => {
    let filtered = allMovements;
    if (searchSlip.trim()) filtered = filtered.filter(m => m.slip_number?.toLowerCase().includes(searchSlip.toLowerCase()));
    if (searchDate)         filtered = filtered.filter(m => m.date === searchDate);
    setFilteredMovements(filtered);
    setDepPage(1);
  }, [allMovements, searchSlip, searchDate]);

  // Filtros retiros (tab 1)
  useEffect(() => {
    let filtered = withdrawals;
    if (wdSearchConcept.trim()) filtered = filtered.filter(w => w.concept?.toLowerCase().includes(wdSearchConcept.toLowerCase()));
    if (wdSearchDate)            filtered = filtered.filter(w => w.date === wdSearchDate);
    setFilteredWd(filtered);
    setWdPage(1);
  }, [withdrawals, wdSearchConcept, wdSearchDate]);

  const currentMovements = filteredMovements.slice((depPage - 1) * itemsPerPage, depPage * itemsPerPage);
  const currentWd        = filteredWd.slice((wdPage - 1) * itemsPerPage, wdPage * itemsPerPage);

  // Totales de retiros
  const totalWd = withdrawals.reduce((s, w) => s + (w.amount || 0), 0);

  // -- Account Handlers --
  const onAccSubmit = async e => {
    e.preventDefault(); setError("");
    try {
      await createBankAccount(accForm);
      setAccForm({ bank_name: "", account_name: "", account_number: "" });
      loadAccounts();
    } catch { setError("Error al crear cuenta bancaria"); }
  };

  const onAccDelete = (id) => {
    setConfirmConfig({
      title: "¿Eliminar cuenta?",
      content: "Si esta cuenta tiene depósitos o retiros asociados, no podrá ser eliminada.",
      onConfirm: async () => {
        try { 
          await deleteBankAccount(id); 
          loadAccounts();
        } catch { setError("Error al eliminar cuenta bancaria"); }
        finally { setConfirmOpen(false); }
      }
    });
    setConfirmOpen(true);
  };

  // -- Movement (deposit/injection/withdrawal) Delete from Tab 0 --
  const onMovementDelete = (item) => {
    setConfirmConfig({
      title: "¿Eliminar movimiento?",
      content: "¿Estás seguro de que deseas eliminar este registro bancario?",
      onConfirm: async () => {
        try {
          if (item._type === 'deposit')    await deleteDeposit(item.id);
          else if (item._type === 'injection') await deleteInjection(item.id);
          else if (item._type === 'withdrawal') { await deleteWithdrawal(item.id); loadWithdrawals(); }
          loadMovements();
          if (refreshSummary) refreshSummary();
        } catch { setError("Error al eliminar movimiento"); }
        finally { setConfirmOpen(false); }
      }
    });
    setConfirmOpen(true);
  };

  // -- Withdrawal Handlers --
  const onWdSubmit = async e => {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      const fd = new FormData();
      fd.append("bank_account_id", wdForm.bank_account_id);
      fd.append("amount", wdForm.amount);
      fd.append("date", wdForm.date);
      fd.append("concept", wdForm.concept);
      if (wdForm.reference_number) fd.append("reference_number", wdForm.reference_number);
      if (wdForm.observations) fd.append("observations", wdForm.observations);
      if (wdForm.file) fd.append("file", wdForm.file);
      await createWithdrawal(fd);
      setWdForm(EMPTY_WD_FORM);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setShowWdForm(false);
      loadWithdrawals();
    } catch (err) {
      setError(err?.response?.data?.detail || "Error al registrar retiro");
    }
    setSaving(false);
  };

  const onWdDelete = (item) => {
    setConfirmConfig({
      title: "¿Eliminar retiro?",
      content: `¿Eliminar el retiro bancario de ${fmt(item.amount)} (${item.concept})?`,
      onConfirm: async () => {
        try {
          await deleteWithdrawal(item.id);
          loadWithdrawals();
        } catch { setError("Error al eliminar retiro"); }
        finally { setConfirmOpen(false); }
      }
    });
    setConfirmOpen(true);
  };

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Tabs value={tab} onChange={(e, v) => { setTab(v); setError(""); }} textColor="primary" indicatorColor="primary">
          <Tab label="Movimientos" />
          <Tab label="Salidas de Banco" icon={<TrendingDown sx={{ fontSize:16 }} />} iconPosition="end" />
          <Tab label="Cuentas Bancarias" />
        </Tabs>
      </div>

      {error && <div style={{ color:"var(--color-error)", marginBottom:16 }}>{error}</div>}

      {/* ─── TAB 0: MOVIMIENTOS ─── */}
      {tab === 0 && (
        <Box>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:16 }}>
            <p style={{ fontWeight:700, fontSize:16, margin:0, color:"#111827" }}>Control de Movimientos Bancarios</p>
            <div style={{ display:"flex", gap:12 }}>
              <TextField 
                size="small" 
                placeholder="Buscar por boleta..." 
                value={searchSlip} 
                onChange={e => setSearchSlip(e.target.value)} 
                InputProps={{ startAdornment: <Search sx={{ color:"#9ca3af", mr:1, fontSize:20 }} /> }}
                sx={{ bgcolor:"#fff", width: 200 }}
              />
              <TextField 
                size="small" 
                type="date" 
                value={searchDate} 
                onChange={e => setSearchDate(e.target.value)}
                sx={{ bgcolor:"#fff", width: 150 }}
              />
              {(searchSlip || searchDate) && (
                <Button size="small" onClick={() => { setSearchSlip(""); setSearchDate(""); }} sx={{ textTransform:"none" }}>
                  Limpiar
                </Button>
              )}
            </div>
          </div>
          
          {loadingDeposits ? (
            <TableSkeleton rows={10} cols={7} />
          ) : (
            <TableWrap>
              <TableHead>
              <TableRow sx={{ '& th': { fontWeight:600, color:"#374151", bgcolor:"#f9fafb" } }}>
                <TableCell>Fecha</TableCell><TableCell>No. Boleta</TableCell><TableCell>Tipo</TableCell><TableCell>Cuenta</TableCell><TableCell>Banco</TableCell><TableCell>Observaciones</TableCell><TableCell align="center">Comprobante</TableCell><TableCell align="right">Monto</TableCell><TableCell align="center">Acción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentMovements.length === 0 ? <TableRow><TableCell colSpan={9} align="center" sx={{ py: 3, color:"#6b7280" }}>No se encontraron movimientos</TableCell></TableRow>
              : currentMovements.map(d => (
                <TableRow key={`${d._type}-${d.id}`} sx={{ '&:hover': { bgcolor: d._type === 'withdrawal' ? "#fff7ed" : "#f9fafb" } }}>
                  <TableCell>{d.date}</TableCell>
                  <TableCell sx={{ fontWeight:600, color: d._type === 'withdrawal' ? "#c2410c" : "#111827" }}>
                    {d._type === 'withdrawal' ? d.concept : (d.slip_number || "—")}
                  </TableCell>
                  <TableCell><MovBadge type={d._type} /></TableCell>
                  <TableCell>{d.bank_account ? `${d.bank_account.account_name} (${d.bank_account.account_number})` : '—'}</TableCell>
                  <TableCell>{d.bank_account ? d.bank_account.bank_name : (d.bank_name || '—')}</TableCell>
                  <TableCell sx={{ color:"#6b7280", maxWidth: 150, overflow: "hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} title={d.observations}>{d.observations||"—"}</TableCell>
                  <TableCell align="center">
                    {d.image_url ? (
                      <Button size="small" startIcon={<Receipt />} onClick={() => window.open(`${import.meta.env.VITE_API_BASE_URL || "http://" + window.location.hostname + ":8000"}${d.image_url}`, "_blank")} sx={{ textTransform:"none" }}>
                        Ver
                      </Button>
                    ) : (
                      <span style={{ fontSize:10, color:"#9ca3af" }}>Sin imagen</span>
                    )}
                  </TableCell>
                  <TableCell align="right" sx={{ 
                    fontWeight:700, 
                    color: d._type === 'withdrawal' ? "#c2410c" : "#111827", 
                    fontFamily:"ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" 
                  }}>
                    {d._type === 'withdrawal' ? `-${fmt(d.amount)}` : fmt(d.amount)}
                  </TableCell>
                  <TableCell align="center">
                    {isSuper && (
                      <IconButton color="error" size="small" onClick={() => onMovementDelete(d)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}

            </TableBody>
            </TableWrap>
          )}
          <Pager page={depPage} total={depTotal} onPage={setDepPage} />
        </Box>
      )}

      {/* ─── TAB 1: SALIDAS DE BANCO ─── */}
      {tab === 1 && (
        <Box>

          {/* Botón para abrir modal */}
          <div style={{ marginBottom:20 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <p style={{ fontWeight:700, fontSize:15, margin:0, color:"#111827" }}>Registrar Salida Bancaria</p>
              <Button
                size="small"
                variant="contained"
                disableElevation
                onClick={() => { setShowWdForm(true); setError(""); }}
                sx={{ textTransform:"none", fontWeight:600, bgcolor: "#7c3aed", color: "#fff", '&:hover':{ bgcolor: "#6d28d9" } }}
                startIcon={<TrendingDown />}
              >
                Realizar retiro
              </Button>
            </div>

            <Dialog open={showWdForm} onClose={() => setShowWdForm(false)} maxWidth="sm" fullWidth>
              <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem", borderBottom: "1px solid #f0f0f0", pb: 1.5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <TrendingDown sx={{ color: "#7c3aed" }} />
                  Registrar Salida de Banco
                </div>
              </DialogTitle>
              <form onSubmit={onWdSubmit}>
                <DialogContent sx={{ pt: "20px !important" }}>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(190px, 1fr))", gap:14, marginBottom:14 }}>
                      <FormControl fullWidth size="small" required>
                        <InputLabel>Cuenta Bancaria *</InputLabel>
                        <Select
                          value={wdForm.bank_account_id}
                          label="Cuenta Bancaria *"
                          onChange={e => setWdForm({...wdForm, bank_account_id: e.target.value})}
                        >
                          {accounts.map(a => (
                            <MenuItem key={a.id} value={a.id}>
                              {a.bank_name} — {a.account_name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <TextField
                        size="small" required
                        label="Concepto / Descripción *"
                        value={wdForm.concept}
                        onChange={e => setWdForm({...wdForm, concept: e.target.value})}
                        placeholder="Ej. Pago de servicio eléctrico"
                      />

                      <TextField
                        size="small"
                        label="No. Referencia / Cheque"
                        value={wdForm.reference_number}
                        onChange={e => setWdForm({...wdForm, reference_number: e.target.value})}
                        placeholder="Ej. CHQ-001 / 123456"
                      />

                      <TextField
                        size="small" required type="number" inputProps={{ min:0.01, step:0.01 }}
                        label="Monto (Q) *"
                        value={wdForm.amount}
                        onChange={e => setWdForm({...wdForm, amount: e.target.value})}
                        InputProps={{ startAdornment: <InputAdornment position="start">Q</InputAdornment> }}
                      />

                      <TextField
                        size="small" required type="date"
                        label="Fecha *"
                        value={wdForm.date}
                        onChange={e => setWdForm({...wdForm, date: e.target.value})}
                        InputLabelProps={{ shrink: true }}
                      />
                    </div>

                    {/* Adjuntar comprobante */}
                    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                      <Button
                        size="small" variant="outlined" component="label"
                        startIcon={<AttachFile />}
                        sx={{ textTransform:"none", borderColor:"#d1d5db", color:"#374151" }}
                      >
                        {wdForm.file ? wdForm.file.name : "Adjuntar comprobante (opcional)"}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          hidden
                          onChange={e => setWdForm({...wdForm, file: e.target.files[0] || null})}
                        />
                      </Button>
                      {wdForm.file && (
                        <Button size="small" color="error" onClick={() => { setWdForm({...wdForm, file:null}); if(fileInputRef.current) fileInputRef.current.value=""; }} sx={{ textTransform:"none", minWidth:0 }}>
                          ✕
                        </Button>
                      )}
                      <span style={{ fontSize:11, color:"#9ca3af" }}>JPG, PNG o WEBP · máx. 5 MB</span>
                    </div>

                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                      <Button variant="outlined" size="small" sx={{ textTransform: "none" }} onClick={() => setShowWdForm(false)}>
                        Cancelar
                      </Button>
                      <Button
                        type="submit" variant="contained" disableElevation disabled={saving}
                        sx={{ bgcolor:"#7c3aed", textTransform:"none", fontWeight:600, '&:hover':{ bgcolor:"#6d28d9" } }}
                        startIcon={<TrendingDown />}
                      >
                        {saving ? "Guardando..." : "Confirmar Salida"}
                      </Button>
                </DialogActions>
              </form>
            </Dialog>
          </div>

          {/* Tabla de retiros */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12, flexWrap:"wrap", gap:12 }}>
            <p style={{ fontWeight:700, fontSize:14, margin:0, color:"#111827" }}>Historial de Salidas</p>
            <div style={{ display:"flex", gap:10 }}>
              <TextField
                size="small"
                placeholder="Buscar por concepto..."
                value={wdSearchConcept}
                onChange={e => setWdSearchConcept(e.target.value)}
                InputProps={{ startAdornment: <Search sx={{ color:"#9ca3af", mr:1, fontSize:18 }} /> }}
                sx={{ bgcolor:"#fff", width:190 }}
              />
              <TextField
                size="small" type="date"
                value={wdSearchDate}
                onChange={e => setWdSearchDate(e.target.value)}
                sx={{ bgcolor:"#fff", width:145 }}
              />
              {(wdSearchConcept || wdSearchDate) && (
                <Button size="small" onClick={() => { setWdSearchConcept(""); setWdSearchDate(""); }} sx={{ textTransform:"none" }}>Limpiar</Button>
              )}
            </div>
          </div>

          {loadingWd ? (
            <TableSkeleton rows={8} cols={7} />
          ) : (
            <TableWrap>
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight:600, color:"#374151", bgcolor:"#fdf4ff" } }}>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Concepto</TableCell>
                  <TableCell>Referencia</TableCell>
                  <TableCell>Cuenta / Banco</TableCell>
                  <TableCell align="center">Comprobante</TableCell>
                  <TableCell align="right">Monto</TableCell>
                  <TableCell align="center">Acción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentWd.length === 0 ? (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py:3, color:"#6b7280" }}>Sin retiros registrados</TableCell></TableRow>
                ) : currentWd.map(w => (
                  <TableRow key={w.id} sx={{ '&:hover':{ bgcolor:"#fdf4ff" } }}>
                    <TableCell>{w.date}</TableCell>
                    <TableCell sx={{ fontWeight:600, color:"#7c3aed" }}>{w.concept}</TableCell>
                    <TableCell sx={{ color:"#6b7280", fontFamily:"ui-monospace, Consolas, monospace" }}>{w.reference_number || "—"}</TableCell>
                    <TableCell>
                      {w.bank_account
                        ? <span>{w.bank_account.bank_name}<br/><span style={{ fontSize:11, color:"#6b7280" }}>{w.bank_account.account_name} ({w.bank_account.account_number})</span></span>
                        : "—"
                      }
                    </TableCell>
                    <TableCell align="center">
                      {w.image_url ? (
                        <Button size="small" startIcon={<Receipt />}
                          onClick={() => window.open(`${import.meta.env.VITE_API_BASE_URL || "http://" + window.location.hostname + ":8000"}${w.image_url}`, "_blank")}
                          sx={{ textTransform:"none" }}>Ver</Button>
                      ) : (
                        <span style={{ fontSize:10, color:"#9ca3af" }}>Sin imagen</span>
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight:700, color:"#c2410c", fontFamily:"ui-monospace, Consolas, monospace" }}>
                      -{fmt(w.amount)}
                    </TableCell>
                    <TableCell align="center">
                      {isSuper && (
                        <IconButton color="error" size="small" onClick={() => onWdDelete(w)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableWrap>
          )}
          <Pager page={wdPage} total={wdTotal} onPage={setWdPage} />
        </Box>
      )}

      {/* ─── TAB 2: CUENTAS BANCARIAS ─── */}
      {tab === 2 && (
        <Box>
          <Card style={{ marginBottom:24, boxShadow:"none", border:"1px solid #e5e7eb", borderRadius:"4px" }}>
            <div style={{ padding:"12px 16px", borderBottom:"1px solid #e5e7eb", fontWeight:600, fontSize:"0.875rem", color:"#374151" }}>
              Agregar Cuenta Bancaria
            </div>
            <div style={{ padding:"16px" }}>
              <form onSubmit={onAccSubmit}>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:16, marginBottom:16 }}>
                  <FormControl fullWidth size="small" required>
                    <InputLabel>Banco de Guatemala *</InputLabel>
                    <Select value={accForm.bank_name} label="Banco de Guatemala *" onChange={e => setAccForm({...accForm, bank_name:e.target.value})}>
                      {GT_BANKS.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <TextField size="small" required label="Nombre de la Cuenta *" value={accForm.account_name} onChange={e => setAccForm({...accForm, account_name:e.target.value})} placeholder="Ej. Cuenta de Diezmos" />
                  <TextField size="small" required label="Número de Cuenta *" value={accForm.account_number} onChange={e => setAccForm({...accForm, account_number:e.target.value})} />
                </div>
                <div style={{ display:"flex", justifyContent:"flex-end" }}>
                  <Button type="submit" variant="contained" disableElevation sx={{ bgcolor:"#0F172A", textTransform:"none", fontWeight:600, '&:hover':{bgcolor:"#1E293B"} }} startIcon={<AddCard />}>
                    Guardar Cuenta
                  </Button>
                </div>
              </form>
            </div>
          </Card>

          <p style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Cuentas Bancarias Activas</p>
          {loadingAccounts ? (
            <TableSkeleton rows={5} cols={5} />
          ) : (
            <TableWrap>
              <TableHead>
              <TableRow sx={{ '& th': { fontWeight:600, color:"#374151", bgcolor:"#f9fafb" } }}>
                <TableCell>Banco</TableCell>
                <TableCell>Nombre de la Cuenta</TableCell>
                <TableCell>Número de Cuenta</TableCell>
                <TableCell>Creada por</TableCell>
                <TableCell align="center">Acción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {accounts.length === 0 ? <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3, color:"#6b7280" }}>Sin cuentas registradas</TableCell></TableRow>
              : accounts.map(a => (
                <TableRow key={a.id} sx={{ '&:hover': { bgcolor:"#f9fafb" } }}>
                  <TableCell sx={{ fontWeight:600, color:"#111827" }}>{a.bank_name}</TableCell>
                  <TableCell>{a.account_name}</TableCell>
                  <TableCell sx={{ fontFamily:"ui-monospace, Consolas, monospace" }}>{a.account_number}</TableCell>
                  <TableCell>{a.created_by_name}</TableCell>
                  <TableCell align="center">
                    {isSuper && (
                      <IconButton color="error" size="small" onClick={() => onAccDelete(a.id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </TableWrap>
          )}
        </Box>
      )}

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

