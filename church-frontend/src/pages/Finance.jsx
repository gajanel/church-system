import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  getOfferings, createOffering, getIncomes, createIncome,
  getExpenses, createExpense, getFixedExpenses, createFixedExpense, deleteFixedExpense,
  getMonthlySummary, getDeposits, createDeposit, deleteDeposit
} from "../api/finance";
import { getMembers } from "../api/members";
import {
  Button, TextField, Tabs, Tab, Select, MenuItem, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton
} from "@mui/material";
import { 
  AccountBalanceWallet, CallMade, CallReceived, Flag, Delete, AddCircle, Receipt,
  ChevronLeft, ChevronRight 
} from "@mui/icons-material";
import { Card, CardHeader, CardBody } from "../components/ui/Card";
import ConfirmDialog from "../components/ConfirmDialog";
import { Badge } from "../components/ui/Badge";
import { PageHeader } from "../components/ui/PageHeader";
import { TableSkeleton } from "../components/ui/SkeletonLoader";
import s from "../styles/page.module.css";

const INCOME_TYPES  = ["Donación","Venta","Rifa","Colaboración","Otros ingresos"];
const EXPENSE_TYPES = ["Alquiler terreno","Ofrenda misionera","Ahorro pastoral","Ofrenda especial","Otros gastos"];
const BANKS         = ["Banrural","Industrial","G&T","BAC","Otros"];

const getToday  = () => new Date().toISOString().split("T")[0];
const thisMonth = new Date().getMonth() + 1;
const thisYear  = new Date().getFullYear();
const fmt       = n => `Q ${parseFloat(n || 0).toFixed(2)}`;
const fmtDT     = dt => { if (!dt) return "—"; const d = new Date(dt); return d.toLocaleDateString("es-GT")+" "+d.toLocaleTimeString("es-GT",{hour:"2-digit",minute:"2-digit"}); };

const G3 = { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:12 };
const G2 = { display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 };

export default function Finance() {
  const location = useLocation();
  const [tab, setTab]                   = useState(0);
  const [members, setMembers]           = useState([]);
  const [summary, setSummary]           = useState(null);
  const [error, setError]               = useState("");
  const [loading, setLoading]           = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: "", content: "", onConfirm: () => {} });

  const [offerings, setOfferings]       = useState([]);
  const [ofPage, setOfPage]             = useState(1);
  const [ofTotal, setOfTotal]           = useState(1);
  const [ofForm, setOfForm]             = useState({ offering_type:"servicio", amount:"", date:getToday(), member_id:"", donor_name:"", observations:"" });

  const [incomes, setIncomes]           = useState([]);
  const [inPage, setInPage]             = useState(1);
  const [inTotal, setInTotal]           = useState(1);
  const [inForm, setInForm]             = useState({ income_type:"Donación", amount:"", date:getToday(), member_id:"", donor_name:"", observations:"" });

  const [expenses, setExpenses]         = useState([]);
  const [exPage, setExPage]             = useState(1);
  const [exTotal, setExTotal]           = useState(1);
  const [exForm, setExForm]             = useState({ expense_type:"Alquiler terreno", amount:"", date:getToday(), observations:"" });
  const [exFile, setExFile]             = useState(null);

  const [fixedExp, setFixedExp]         = useState([]);
  const [fixForm, setFixForm]           = useState({ name:"", amount:"" });

  const [deposits, setDeposits]         = useState([]);
  const [depPage, setDepPage]           = useState(1);
  const [depTotal, setDepTotal]         = useState(1);
  const [depForm, setDepForm]           = useState({ slip_number:"", bank_name:"Banrural", amount:"", date:getToday(), observations:"", file:null });

  const loadMembersList = async () => {
    try { const res = await getMembers(1, 200); setMembers(res.data.items); } catch (err) { console.error("Error loading members:", err); }
  };

  const loadSummary = async () => {
    try { const res = await getMonthlySummary(thisMonth, thisYear); setSummary(res.data); } catch (err) { console.error("Error loading summary:", err); }
  };

  const loadOfferings = async () => {
    try { const res = await getOfferings(ofPage, 10); setOfferings(res.data.items); setOfTotal(res.data.pages); } catch (err) { console.error("Error loading offerings:", err); }
  };

  const loadIncomes = async () => {
    try { const res = await getIncomes(inPage, 10); setIncomes(res.data.items); setInTotal(res.data.pages); } catch (err) { console.error("Error loading incomes:", err); }
  };

  const loadExpenses = async () => {
    try { const res = await getExpenses(exPage, 10); setExpenses(res.data.items); setExTotal(res.data.pages); } catch (err) { console.error("Error loading expenses:", err); }
  };

  const loadDeposits = async () => {
    try { const res = await getDeposits(depPage, 10); setDeposits(res.data.items); setDepTotal(res.data.pages); } catch (err) { console.error("Error loading deposits:", err); }
  };

  const loadFixed = async () => {
    try { const res = await getFixedExpenses(); setFixedExp(res.data); } catch (err) { console.error("Error loading goals:", err); }
  };

  useEffect(() => { loadMembersList(); loadSummary(); }, []);
  useEffect(() => { if (tab === 0) loadOfferings(); }, [tab, ofPage]);
  useEffect(() => { if (tab === 1) loadIncomes(); }, [tab, inPage]);
  useEffect(() => { if (tab === 2) loadExpenses(); }, [tab, exPage]);
  useEffect(() => {
    refreshActive();
  }, [tab, location.key]);
  useEffect(() => { if (tab === 4) loadDeposits(); }, [tab, depPage]);

  // Funciones de acción
  const refreshActive = async () => {
    setLoading(true);
    await Promise.all([
      loadSummary(),
      tab === 0 ? loadOfferings() : Promise.resolve(),
      tab === 1 ? loadIncomes() : Promise.resolve(),
      tab === 2 ? loadExpenses() : Promise.resolve(),
      tab === 3 ? loadFixed() : Promise.resolve(),
      tab === 4 ? loadDeposits() : Promise.resolve(),
    ]);
    setLoading(false);
  };

  const onOfrenda = async e => {
    e.preventDefault(); setError("");
    try {
      await createOffering({ ...ofForm, amount:parseFloat(ofForm.amount), member_id:ofForm.member_id?parseInt(ofForm.member_id):null, donor_name:ofForm.donor_name||null, observations:ofForm.observations||null });
      setOfForm({ offering_type:"servicio", amount:"", date:getToday(), member_id:"", donor_name:"", observations:"" });
      refreshActive();
    } catch { setError("Error al registrar ofrenda"); }
  };
  const onIngreso = async e => {
    e.preventDefault(); setError("");
    try {
      await createIncome({ ...inForm, amount:parseFloat(inForm.amount), member_id:inForm.member_id?parseInt(inForm.member_id):null, donor_name:inForm.donor_name||null, observations:inForm.observations||null });
      setInForm({ income_type:"Donación", amount:"", date:getToday(), member_id:"", donor_name:"", observations:"" });
      refreshActive();
    } catch { setError("Error al registrar ingreso"); }
  };
  const onGasto = async e => {
    e.preventDefault(); setError("");
    try {
      const fd = new FormData();
      fd.append("expense_type", exForm.expense_type);
      fd.append("amount", exForm.expense_type === "Diezmo de Ofrendas" ? 0 : parseFloat(exForm.amount));
      fd.append("date", exForm.date);
      if (exForm.observations) fd.append("observations", exForm.observations);
      if (exFile) fd.append("file", exFile);
      await createExpense(fd);
      setExForm({ expense_type:"Alquiler terreno", amount:"", date:getToday(), observations:"" });
      setExFile(null);
      refreshActive();
    } catch { setError("Error al registrar gasto"); }
  };
  const onMeta = async e => {
    e.preventDefault(); setError("");
    try { await createFixedExpense({ name:fixForm.name, amount:parseFloat(fixForm.amount) }); setFixForm({ name:"", amount:"" }); refreshActive(); }
    catch { setError("Error al registrar meta fija"); }
  };
  const onDeposit = async e => {
    e.preventDefault(); setError("");
    try {
      const fd = new FormData();
      fd.append("slip_number", depForm.slip_number);
      fd.append("bank_name", depForm.bank_name);
      fd.append("amount", depForm.amount);
      fd.append("date", depForm.date);
      if (depForm.observations) fd.append("observations", depForm.observations);
      if (depForm.file) fd.append("file", depForm.file);

      await createDeposit(fd);
      setDepForm({ slip_number:"", bank_name:"Banrural", amount:"", date:getToday(), observations:"", file:null });
      refreshActive();
    } catch { setError("Error al registrar boleta"); }
  };

  const handleDeleteFixedExpense = (id) => {
    setConfirmConfig({
      title: "¿Eliminar meta fija?",
      content: "¿Estás seguro de que deseas eliminar esta meta financiera fija?",
      onConfirm: async () => {
        try { await deleteFixedExpense(id); refreshActive(); }
        catch { setError("Error al eliminar meta fija"); }
        finally { setConfirmOpen(false); }
      }
    });
    setConfirmOpen(true);
  };

  const handleDeleteDeposit = (id) => {
    setConfirmConfig({
      title: "¿Eliminar boleta de depósito?",
      content: "¿Estás seguro de que deseas eliminar este registro de depósito bancario?",
      onConfirm: async () => {
        try { await deleteDeposit(id); refreshActive(); }
        catch { setError("Error al eliminar depósito"); }
        finally { setConfirmOpen(false); }
      }
    });
    setConfirmOpen(true);
  };

  const summaryCards = summary ? [
    { label:"Ofrendas del mes",  value:summary.total_offerings, color:"var(--color-success)",  borderColor:"var(--color-success)" },
    { label:"Ingresos del mes",  value:summary.total_incomes,   color:"var(--color-info)",     borderColor:"var(--color-info)" },
    { label:"Gastos del mes",    value:summary.total_expenses,  color:"var(--color-error)",    borderColor:"var(--color-error)" },
    { label:"Balance General",   value:summary.balance,         color:summary.balance>=0?"var(--color-success)":"var(--color-error)", borderColor:summary.balance>=0?"var(--color-success)":"var(--color-error)" },
  ] : [];

  const TableWrap = ({ children }) => (
    <TableContainer component={Paper} elevation={0} sx={{ border:"1px solid var(--border)", borderRadius:"10px" }}>
      <Table size="small">{children}</Table>
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

  const memberSelect = (form, setForm, field="member_id") => (
    <FormControl fullWidth size="small">
      <InputLabel>Miembro (opcional)</InputLabel>
      <Select value={form[field]} label="Miembro (opcional)" onChange={e => setForm({...form, [field]:e.target.value, donor_name:""})}>
        <MenuItem value=""><em>— Ninguno —</em></MenuItem>
        {members.map(m => <MenuItem key={m.id} value={m.id}>{m.first_name} {m.last_name}</MenuItem>)}
      </Select>
    </FormControl>
  );

  return (
    <div className={s.page}>
      <PageHeader title="Finanzas y Contabilidad" subtitle="Gestiona ingresos, gastos y metas mensuales de la congregación." />

      {error && <div className={s.errorText}>{error}</div>}

      {/* Summary row */}
      {summary && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px,1fr))", gap:16, marginBottom:24 }}>
          {summaryCards.map((sc, i) => (
            <Card key={i} style={{ borderTop:`3px solid ${sc.borderColor}` }}>
              <CardBody>
                <div style={{ fontSize:10, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>{sc.label}</div>
                <div style={{ fontSize:22, fontWeight:800, color:sc.color, letterSpacing:"-0.025em" }}>{fmt(sc.value)}</div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Tabs */}
      <Paper sx={{ mb:3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} indicatorColor="primary" textColor="primary" variant="fullWidth">
          <Tab icon={<AccountBalanceWallet />} iconPosition="start" label="Ofrendas" />
          <Tab icon={<CallReceived />} iconPosition="start" label="Ingresos/Inyección" />
          <Tab icon={<CallMade />} iconPosition="start" label="Gastos" />
          <Tab icon={<Flag />} iconPosition="start" label="Metas" />
          <Tab icon={<Receipt />} iconPosition="start" label="Boletas" />
        </Tabs>
      </Paper>

      {/* ── OFRENDAS ── */}
      {tab === 0 && (
        <>
          <Card style={{ marginBottom:24 }}>
            <CardHeader title="Registrar Ofrenda" />
            <CardBody>
              <form onSubmit={onOfrenda}>
                <div style={G3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Tipo de ofrenda *</InputLabel>
                    <Select value={ofForm.offering_type} label="Tipo de ofrenda *" onChange={e => setOfForm({...ofForm, offering_type:e.target.value})}>
                      <MenuItem value="servicio">Ofrenda de servicio</MenuItem>
                      <MenuItem value="especial">Ofrenda especial</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField required type="number" label="Monto (GTQ) *" inputProps={{ step:"0.01", min:"0" }} value={ofForm.amount} onChange={e => setOfForm({...ofForm, amount:e.target.value})} />
                  <TextField required type="date" label="Fecha *" InputLabelProps={{ shrink:true }} value={ofForm.date} onChange={e => setOfForm({...ofForm, date:e.target.value})} />
                </div>
                {ofForm.offering_type === "especial" && (
                  <div style={G2}>
                    {memberSelect(ofForm, setOfForm)}
                    {!ofForm.member_id && <TextField label="Nombre del donante" value={ofForm.donor_name} onChange={e => setOfForm({...ofForm, donor_name:e.target.value})} />}
                  </div>
                )}
                <TextField fullWidth label="Observaciones (opcional)" value={ofForm.observations} onChange={e => setOfForm({...ofForm, observations:e.target.value})} style={{ marginBottom:12 }} />
                <div style={{ display:"flex", justifyContent:"flex-end" }}>
                  <Button type="submit" variant="contained" color="success" startIcon={<AddCircle />}>Registrar Ofrenda</Button>
                </div>
              </form>
            </CardBody>
          </Card>
          <p style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Historial de Ofrendas</p>
          {loading ? (
            <TableSkeleton rows={10} cols={6} />
          ) : (
            <TableWrap>
              <TableHead><TableRow><TableCell>Fecha</TableCell><TableCell>Tipo</TableCell><TableCell>Aportado Por</TableCell><TableCell>Observaciones</TableCell><TableCell>Registrado Por</TableCell><TableCell align="right">Monto</TableCell></TableRow></TableHead>
              <TableBody>
                {offerings.length === 0 ? <TableRow><TableCell colSpan={6} align="center">Sin registros</TableCell></TableRow>
                : offerings.map(o => (
                  <TableRow key={o.id}><TableCell>{o.date}</TableCell><TableCell>{o.offering_type==="servicio"?"Servicio":"Especial"}</TableCell><TableCell>{o.donor_name||o.member_name||"—"}</TableCell><TableCell sx={{ color:"text.secondary" }}>{o.observations||"—"}</TableCell><TableCell>{o.created_by_name}</TableCell><TableCell align="right" sx={{ fontWeight:700, color:"var(--color-success)" }}>+{fmt(o.amount)}</TableCell></TableRow>
                ))}
              </TableBody>
            </TableWrap>
          )}
          <Pager page={ofPage} total={ofTotal} onPage={setOfPage} />
        </>
      )}

      {/* ── INGRESOS ── */}
      {tab === 1 && (
        <>
          <Card style={{ marginBottom:24 }}>
            <CardHeader title="Registrar Ingreso Adicional" />
            <CardBody>
              <form onSubmit={onIngreso}>
                <div style={G3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Tipo de Ingreso *</InputLabel>
                    <Select value={inForm.income_type} label="Tipo de Ingreso *" onChange={e => setInForm({...inForm, income_type:e.target.value})}>
                      {INCOME_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <TextField required type="number" label="Monto *" inputProps={{ step:"0.01", min:"0" }} value={inForm.amount} onChange={e => setInForm({...inForm, amount:e.target.value})} />
                  <TextField required type="date" label="Fecha *" InputLabelProps={{ shrink:true }} value={inForm.date} onChange={e => setInForm({...inForm, date:e.target.value})} />
                </div>
                <div style={G2}>
                  {memberSelect(inForm, setInForm)}
                  {!inForm.member_id && <TextField label="Entregado Por" value={inForm.donor_name} onChange={e => setInForm({...inForm, donor_name:e.target.value})} />}
                </div>
                <TextField fullWidth label="Observaciones" value={inForm.observations} onChange={e => setInForm({...inForm, observations:e.target.value})} style={{ marginBottom:12 }} />
                <div style={{ display:"flex", justifyContent:"flex-end" }}>
                  <Button type="submit" variant="contained" color="info" startIcon={<AddCircle />}>Registrar Ingreso</Button>
                </div>
              </form>
            </CardBody>
          </Card>
          <p style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Historial de Ingresos Extras</p>
          {loading ? (
            <TableSkeleton rows={10} cols={5} />
          ) : (
            <TableWrap>
              <TableHead><TableRow><TableCell>Fecha</TableCell><TableCell>Canal o Tipo</TableCell><TableCell>Aportado Por</TableCell><TableCell>Observaciones</TableCell><TableCell align="right">Monto</TableCell></TableRow></TableHead>
              <TableBody>
                {incomes.length === 0 ? <TableRow><TableCell colSpan={5} align="center">Sin registros</TableCell></TableRow>
                : incomes.map(i => (
                  <TableRow key={i.id}><TableCell>{i.date}</TableCell><TableCell>{i.income_type}</TableCell><TableCell>{i.donor_name||i.member_name||"—"}</TableCell><TableCell sx={{ color:"text.secondary" }}>{i.observations||"—"}</TableCell><TableCell align="right" sx={{ fontWeight:700, color:"var(--color-info)" }}>+{fmt(i.amount)}</TableCell></TableRow>
                ))}
              </TableBody>
            </TableWrap>
          )}
          <Pager page={inPage} total={inTotal} onPage={setInPage} />
        </>
      )}

      {/* ── GASTOS ── */}
      {tab === 2 && (
        <>
          <Card style={{ marginBottom:24 }}>
            <CardHeader title="Registrar Salida de Efectivo" />
            <CardBody>
              <form onSubmit={onGasto}>
                <div style={G3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Rubro de Gasto *</InputLabel>
                    <Select value={exForm.expense_type} label="Rubro de Gasto *" onChange={e => setExForm({...exForm, expense_type:e.target.value})}>
                      {EXPENSE_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <TextField
                    required={exForm.expense_type !== "Diezmo de Ofrendas"}
                    type="number"
                    label={exForm.expense_type === "Diezmo de Ofrendas" ? "Se autocalcula (10%)" : "Monto *"}
                    inputProps={{ step:"0.01", min:"0" }}
                    value={exForm.amount}
                    onChange={e => setExForm({...exForm, amount:e.target.value})}
                    disabled={exForm.expense_type === "Diezmo de Ofrendas"}
                  />
                  <TextField required type="date" label="Fecha *" InputLabelProps={{ shrink:true }} value={exForm.date} onChange={e => setExForm({...exForm, date:e.target.value})} />
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:12, marginBottom:12, alignItems:"center" }}>
                  <TextField fullWidth label="Observaciones y detalles de la factura" value={exForm.observations} onChange={e => setExForm({...exForm, observations:e.target.value})} />
                  <Button
                    variant="outlined"
                    component="label"
                    color={exFile ? "success" : "primary"}
                    startIcon={<Receipt />}
                  >
                    {exFile ? "Cambiar Comprobante" : "Adjuntar Comprobante"}
                    <input
                      type="file"
                      hidden
                      accept="image/*,.pdf"
                      onChange={e => setExFile(e.target.files[0] || null)}
                    />
                  </Button>
                </div>
                {exFile && (
                  <div style={{ fontSize:11, color:"var(--color-success)", fontWeight:600, marginBottom:12, display:"flex", alignItems:"center", gap:6 }}>
                    ✓ Comprobante listo: {exFile.name}
                    <button type="button" onClick={() => setExFile(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--color-error)", fontSize:12, fontWeight:700 }}>✕</button>
                  </div>
                )}
                <div style={{ display:"flex", justifyContent:"flex-end" }}>
                  <Button type="submit" variant="contained" color="error" startIcon={<AddCircle />}>Registrar Gasto</Button>
                </div>
              </form>
            </CardBody>
          </Card>
          <p style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Historial de Egresos</p>
          {loading ? (
            <TableSkeleton rows={10} cols={6} />
          ) : (
            <TableWrap>
              <TableHead><TableRow><TableCell>Fecha</TableCell><TableCell>Concepto</TableCell><TableCell>Observaciones</TableCell><TableCell>Autorizado Por</TableCell><TableCell align="center">Comprobante</TableCell><TableCell align="right">Desembolso</TableCell></TableRow></TableHead>
              <TableBody>
                {expenses.length === 0 ? <TableRow><TableCell colSpan={6} align="center">Sin registros</TableCell></TableRow>
                : expenses.map(ex => (
                  <TableRow key={ex.id}>
                    <TableCell>{ex.date}</TableCell>
                    <TableCell>{ex.expense_type}</TableCell>
                    <TableCell sx={{ color:"text.secondary" }}>{ex.observations||"—"}</TableCell>
                    <TableCell>{ex.created_by_name}</TableCell>
                    <TableCell align="center">
                      {ex.document_url ? (
                        <Button
                          size="small"
                          startIcon={<Receipt />}
                          onClick={() => window.open(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}${ex.document_url}`, "_blank")}
                        >
                          Ver
                        </Button>
                      ) : (
                        <span style={{ fontSize:10, color:"var(--text-muted)" }}>Sin doc.</span>
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight:700, color:"var(--color-error)" }}>-{fmt(ex.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableWrap>
          )}
          <Pager page={exPage} total={exTotal} onPage={setExPage} />
        </>
      )}

      {/* ── METAS ── */}
      {tab === 3 && (
        <>
          <Card style={{ marginBottom:24, background:"var(--color-warning-light)", borderColor:"var(--color-warning-border)" }}>
            <CardBody>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:16, flexWrap:"wrap" }}>
                <div>
                  <p style={{ fontWeight:800, fontSize:15, margin:"0 0 4px" }}>Carga de Obligaciones Fijas</p>
                  <p style={{ fontSize:12, color:"var(--text-secondary)", margin:0 }}>Configura cuotas fijas que sumarán la Meta del Tablero principal.</p>
                </div>
                <div style={{ background:"#fff", padding:"10px 20px", borderRadius:10, textAlign:"center", boxShadow:"var(--shadow-md)" }}>
                  <div style={{ fontSize:10, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase" }}>META VIGENTE</div>
                  <div style={{ fontSize:20, fontWeight:800, color:"var(--color-warning)" }}>{fmt(summary?.monthly_goal)}</div>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card style={{ marginBottom:24 }}>
            <CardHeader title="Añadir Obligación Fija" />
            <CardBody>
              <form onSubmit={onMeta}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 200px auto", gap:12, alignItems:"flex-end" }}>
                  <TextField required label="Concepto Fijo *" placeholder="Ej. Alquiler de templo mensual" value={fixForm.name} onChange={e => setFixForm({...fixForm, name:e.target.value})} />
                  <TextField required type="number" label="Monto Mensual *" inputProps={{ step:"0.01", min:"0" }} value={fixForm.amount} onChange={e => setFixForm({...fixForm, amount:e.target.value})} />
                  <Button type="submit" variant="contained" style={{ height:40 }}>Añadir Meta</Button>
                </div>
              </form>
            </CardBody>
          </Card>
          <p style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Gastos Fijos Actuales</p>
          <TableWrap>
            <TableHead><TableRow><TableCell>Obligación</TableCell><TableCell>Creador</TableCell><TableCell>Fecha</TableCell><TableCell align="right">Monto</TableCell><TableCell align="center">Acción</TableCell></TableRow></TableHead>
            <TableBody>
              {fixedExp.length === 0 ? <TableRow><TableCell colSpan={5} align="center">Sin metas configuradas</TableCell></TableRow>
              : fixedExp.map(f => (
                <TableRow key={f.id}><TableCell sx={{ fontWeight:600 }}>{f.name}</TableCell><TableCell>{f.created_by_name}</TableCell><TableCell>{fmtDT(f.created_at)}</TableCell><TableCell align="right" sx={{ fontWeight:700 }}>{fmt(f.amount)}</TableCell><TableCell align="center"><IconButton color="error" size="small" onClick={() => handleDeleteFixedExpense(f.id)}><Delete fontSize="small" /></IconButton></TableCell></TableRow>
              ))}
            </TableBody>
          </TableWrap>
        </>
      )}

      {/* ── DEPÓSITOS ── */}
      {tab === 4 && (
        <>
          <Card style={{ marginBottom:24 }}>
            <CardHeader title="Registrar Boleta de Depósito" />
            <CardBody>
              <form onSubmit={onDeposit}>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:12 }}>
                  <TextField required label="Número de Boleta *" value={depForm.slip_number} onChange={e => setDepForm({...depForm, slip_number:e.target.value})} />
                  <FormControl fullWidth size="small">
                    <InputLabel>Banco *</InputLabel>
                    <Select value={depForm.bank_name} label="Banco *" onChange={e => setDepForm({...depForm, bank_name:e.target.value})}>
                      {BANKS.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <TextField required type="number" label="Monto *" inputProps={{ step:"0.01", min:"0" }} value={depForm.amount} onChange={e => setDepForm({...depForm, amount:e.target.value})} />
                  <TextField required type="date" label="Fecha *" InputLabelProps={{ shrink:true }} value={depForm.date} onChange={e => setDepForm({...depForm, date:e.target.value})} />
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:12, marginBottom:12, alignItems:"center" }}>
                  <TextField fullWidth label="Observaciones" value={depForm.observations} onChange={e => setDepForm({...depForm, observations:e.target.value})} />
                  <Button variant="outlined" component="label" color={depForm.file ? "success" : "primary"}>
                    {depForm.file ? "Cambiar Imagen" : "Subir Imagen Boleta"}
                    <input type="file" hidden accept="image/*" onChange={e => setDepForm({...depForm, file:e.target.files[0]})} />
                  </Button>
                </div>
                {depForm.file && <div style={{ fontSize:11, color:"var(--color-success)", fontWeight:600, marginBottom:12 }}>✓ Archivo listo: {depForm.file.name}</div>}
                <div style={{ display:"flex", justifyContent:"flex-end" }}>
                  <Button type="submit" variant="contained" color="secondary" startIcon={<Receipt />}>Guardar Boleta</Button>
                </div>
              </form>
            </CardBody>
          </Card>
          <p style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Control de Depósitos Realizados</p>
          {loading ? (
            <TableSkeleton rows={10} cols={7} />
          ) : (
            <TableWrap>
              <TableHead><TableRow><TableCell>Fecha</TableCell><TableCell>No. Boleta</TableCell><TableCell>Banco</TableCell><TableCell>Observaciones</TableCell><TableCell align="center">Comprobante</TableCell><TableCell align="right">Monto</TableCell><TableCell align="center">Acción</TableCell></TableRow></TableHead>
              <TableBody>
                {deposits.length === 0 ? <TableRow><TableCell colSpan={7} align="center">Sin depósitos registrados</TableCell></TableRow>
                : deposits.map(d => (
                  <TableRow key={d.id}>
                    <TableCell>{d.date}</TableCell>
                    <TableCell sx={{ fontWeight:600 }}>{d.slip_number}</TableCell>
                    <TableCell>{d.bank_name}</TableCell>
                    <TableCell sx={{ fontStyle:"italic", color:"text.secondary" }}>{d.observations||"—"}</TableCell>
                    <TableCell align="center">
                      {d.image_url ? (
                        <Button size="small" startIcon={<Receipt />} onClick={() => window.open(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}${d.image_url}`, "_blank")}>
                          Ver
                        </Button>
                      ) : (
                        <span style={{ fontSize:10, color:"var(--text-muted)" }}>Sin imagen</span>
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight:700, color:"var(--color-primary)" }}>{fmt(d.amount)}</TableCell>
                    <TableCell align="center">
                      <IconButton color="error" size="small" onClick={() => handleDeleteDeposit(d.id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableWrap>
          )}
          <Pager page={depPage} total={depTotal} onPage={setDepPage} />
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={confirmConfig.title}
        content={confirmConfig.content}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}