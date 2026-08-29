/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { 
  getDeposits, getInjections, deleteDeposit, deleteInjection,
  getBankAccounts, createBankAccount, deleteBankAccount
} from "../../api/finance";
import {
  Button, TextField, Select, MenuItem, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton,
  Tabs, Tab, Box
} from "@mui/material";
import { Receipt, Delete, ChevronLeft, ChevronRight, AddCard, Search } from "@mui/icons-material";
import { Card, CardHeader, CardBody } from "../../components/ui/Card";
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

export default function BanksModule() {
  const { refreshSummary } = useOutletContext();
  const [tab, setTab] = useState(0);
  const [error, setError] = useState("");
  
  // --- Accounts State ---
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [accForm, setAccForm] = useState({ bank_name: "", account_name: "", account_number: "" });

  // --- Deposits State ---
  const [allMovements, setAllMovements] = useState([]);
  const [filteredMovements, setFilteredMovements] = useState([]);
  const [loadingDeposits, setLoadingDeposits] = useState(false);
  const [depPage, setDepPage] = useState(1);
  const [searchSlip, setSearchSlip] = useState("");
  const [searchDate, setSearchDate] = useState("");

  const itemsPerPage = 10;
  const depTotal = Math.ceil(filteredMovements.length / itemsPerPage) || 1;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: "", content: "", onConfirm: () => {} });

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
      const [resDep, resInj] = await Promise.all([
        getDeposits(1, 2000),
        getInjections(1, 2000)
      ]);
      const deps = (resDep.data?.items || []).map(d => ({ ...d, _type: 'deposit' }));
      const injs = (resInj.data?.items || []).map(i => ({ ...i, _type: 'injection' }));
      
      const combined = [...deps, ...injs].sort((a, b) => new Date(b.date) - new Date(a.date));
      setAllMovements(combined);
    } catch { setError("Error al cargar movimientos"); }
    setLoadingDeposits(false);
  };

  useEffect(() => {
    loadAccounts();
    loadMovements();
  }, []);

  useEffect(() => {
    let filtered = allMovements;
    if (searchSlip.trim()) {
      filtered = filtered.filter(m => m.slip_number?.toLowerCase().includes(searchSlip.toLowerCase()));
    }
    if (searchDate) {
      filtered = filtered.filter(m => m.date === searchDate);
    }
    setFilteredMovements(filtered);
    setDepPage(1);
  }, [allMovements, searchSlip, searchDate]);

  const currentMovements = filteredMovements.slice((depPage - 1) * itemsPerPage, depPage * itemsPerPage);

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
      content: "Si esta cuenta tiene depósitos asociados, no podrá ser eliminada.",
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

  // -- Deposit Handlers --
  const onMovementDelete = (item) => {
    setConfirmConfig({
      title: "¿Eliminar movimiento?",
      content: "¿Estás seguro de que deseas eliminar este registro bancario?",
      onConfirm: async () => {
        try {
          if (item._type === 'deposit') {
            await deleteDeposit(item.id);
          } else {
            await deleteInjection(item.id);
          }
          loadMovements();
          if (refreshSummary) refreshSummary();
        } catch { setError("Error al eliminar movimiento"); }
        finally { setConfirmOpen(false); }
      }
    });
    setConfirmOpen(true);
  };

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Tabs value={tab} onChange={(e, v) => { setTab(v); setError(""); }} textColor="primary" indicatorColor="primary">
          <Tab label="Movimientos (Depósitos)" />
          <Tab label="Cuentas Bancarias" />
        </Tabs>
      </div>

      {error && <div style={{ color:"var(--color-error)", marginBottom:16 }}>{error}</div>}

      {/* --- PESTAÑA: DEPOSITOS --- */}
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
                <TableRow key={`${d._type}-${d.id}`} sx={{ '&:hover': { bgcolor:"#f9fafb" } }}>
                  <TableCell>{d.date}</TableCell>
                  <TableCell sx={{ fontWeight:600, color:"#111827" }}>{d.slip_number || "—"}</TableCell>
                  <TableCell>
                    {d._type === 'deposit' ? (
                      <span style={{ fontSize:11, background:"#f3f4f6", padding:"2px 6px", borderRadius:4, fontWeight:600 }}>Histórico</span>
                    ) : (
                      <span style={{ fontSize:11, background:"#eff6ff", color:"#2563eb", padding:"2px 6px", borderRadius:4, fontWeight:600 }}>Inyección</span>
                    )}
                  </TableCell>
                  <TableCell>{d.bank_account ? `${d.bank_account.account_name} (${d.bank_account.account_number})` : '—'}</TableCell>
                  <TableCell>{d.bank_account ? d.bank_account.bank_name : (d.bank_name || '—')}</TableCell>
                  <TableCell sx={{ color:"#6b7280", maxWidth: 150, overflow: "hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} title={d.observations}>{d.observations||"—"}</TableCell>
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
                    <IconButton color="error" size="small" onClick={() => onMovementDelete(d)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </TableWrap>
          )}
          <Pager page={depPage} total={depTotal} onPage={setDepPage} />
        </Box>
      )}

      {/* --- PESTAÑA: CUENTAS --- */}
      {tab === 1 && (
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
                    <IconButton color="error" size="small" onClick={() => onAccDelete(a.id)}>
                      <Delete fontSize="small" />
                    </IconButton>
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
