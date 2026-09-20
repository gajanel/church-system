/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import { useState, useEffect, useCallback } from "react";
import {
  Button, TextField, Select, MenuItem, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Chip, CircularProgress, Tooltip
} from "@mui/material";
import {
  AccountBalance, TrendingUp, TrendingDown, SwapHoriz,
  Add, Delete, ChevronLeft, ChevronRight, Refresh, AccountBalanceWallet
} from "@mui/icons-material";
import { getCashRegister, createInjection, getInjections, deleteInjection, getBankAccounts } from "../../api/finance";
import { TableSkeleton } from "../../components/ui/SkeletonLoader";

/* ─── helpers ─────────────────────────────────────────────────────── */
const fmt = (n) => `Q ${parseFloat(n || 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`;
const getToday = () => new Date().toISOString().split("T")[0];

const MONTHS = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];

const KIND_COLORS = {
  inyeccion: { bg: "#f0fdf4", color: "#16a34a", label: "Inyección (Entrada)" },
  retiro:    { bg: "#fef2f2", color: "#dc2626", label: "Retiro (Salida)" },
};

const TableWrap = ({ children }) => (
  <TableContainer
    component={Paper}
    elevation={0}
    sx={{ border: "1px solid #e5e7eb", borderRadius: "8px", boxShadow: "none" }}
  >
    <Table size="small" sx={{ "& .MuiTableCell-root": { padding: "7px 14px", fontSize: "0.8rem" } }}>
      {children}
    </Table>
  </TableContainer>
);

const Pager = ({ page, total, onPage }) =>
  total > 1 ? (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 12 }}>
      <IconButton size="small" disabled={page === 1} onClick={() => onPage(page - 1)}>
        <ChevronLeft fontSize="small" />
      </IconButton>
      <span style={{ fontSize: 12, fontWeight: 600 }}>Pág. {page} / {total}</span>
      <IconButton size="small" disabled={page === total} onClick={() => onPage(page + 1)}>
        <ChevronRight fontSize="small" />
      </IconButton>
    </div>
  ) : null;

/* ─── Main component ──────────────────────────────────────────────── */
  const StatCard = ({ icon, label, value, color, sub }) => (
    <div style={{
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      padding: "20px 24px",
      display: "flex",
      flexDirection: "column",
      gap: 8,
      flex: 1,
      minWidth: 160,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#6b7280", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {icon}
        {label}
      </div>
      <div style={{ fontSize: "1.6rem", fontWeight: 700, color, fontFamily: "ui-monospace, monospace", lineHeight: 1.2 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: "#9ca3af" }}>{sub}</div>}
    </div>
  );


export default function CashRegister() {
  const now = new Date();
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1);
  const [selYear,  setSelYear]  = useState(now.getFullYear());

  const [cashData,  setCashData]  = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [typeFilter, setTypeFilter] = useState("todos");

  // Injection modal
  const [injOpen,   setInjOpen]   = useState(false);
  const [injForm,   setInjForm]   = useState({ bank_name: "", amount: "", date: getToday(), slip_number: "", observations: "" });
  const [injFile,   setInjFile]   = useState(null);
  const [injSaving, setInjSaving] = useState(false);
  const [injError,  setInjError]  = useState("");

  // Injection history
  const [injections, setInjections]  = useState([]);
  const [injPage,    setInjPage]     = useState(1);
  const [injPages,   setInjPages]    = useState(1);
  const [injLoading, setInjLoading]  = useState(false);

  // Bank Accounts
  const [accounts, setAccounts] = useState([]);

  /* load cash register */
  const loadCash = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCashRegister(selMonth, selYear);
      setCashData(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [selMonth, selYear]);

  const loadInjections = useCallback(async () => {
    setInjLoading(true);
    try {
      const res = await getInjections(injPage, 8);
      setInjections(res.data?.items || []);
      setInjPages(res.data?.pages || 1);
    } catch (err) { console.error(err); }
    setInjLoading(false);
  }, [injPage]);

  const loadAccounts = useCallback(async () => {
    try {
      const res = await getBankAccounts();
      setAccounts(res.data || []);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { loadCash(); },       [loadCash]);
  useEffect(() => { loadInjections(); }, [loadInjections]);
  useEffect(() => { loadAccounts(); },   [loadAccounts]);

  /* create injection */
  const handleCreateInjection = async () => {
    if (!injForm.bank_account_id || !injForm.amount || !injForm.date) {
      setInjError("Cuenta, monto y fecha son obligatorios.");
      return;
    }
    setInjSaving(true); setInjError("");
    try {
      const fd = new FormData();
      fd.append("bank_account_id", injForm.bank_account_id);
      fd.append("amount",      parseFloat(injForm.amount));
      fd.append("date",        injForm.date);
      if (injForm.slip_number)  fd.append("slip_number",  injForm.slip_number.trim());
      if (injForm.observations) fd.append("observations", injForm.observations.trim());
      if (injFile)              fd.append("file",         injFile);
      await createInjection(fd);
      setInjOpen(false);
      setInjForm({ bank_account_id: "", amount: "", date: getToday(), slip_number: "", observations: "" });
      setInjFile(null);
      loadCash();
      loadInjections();
    } catch (err) {
      setInjError(err?.response?.data?.detail || "Error al registrar la inyección.");
    }
    setInjSaving(false);
  };



  /* ── stat card ── */

  const mv = cashData?.movements || [];

  return (
    <div>
      {/* ── Saldo hero ── */}
      <div style={{
        background: "var(--color-primary)",
        borderRadius: 4,
        padding: "32px 36px",
        marginBottom: 24,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <AccountBalanceWallet sx={{ fontSize: 16 }} /> Saldo en Caja General
          </div>
          {loading
            ? <CircularProgress size={28} sx={{ color: "#fff" }} />
            : <div style={{ fontSize: "2.6rem", fontWeight: 800, fontFamily: "ui-monospace, monospace", lineHeight: 1 }}>
                {fmt(cashData?.cash_balance ?? 0)}
              </div>
          }
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 6 }}>
            Dinero en bancos (inyecciones − retiros bancarios)
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Button
            variant="contained"
            startIcon={<SwapHoriz />}
            onClick={() => { setInjOpen(true); setInjError(""); }}
            sx={{
              bgcolor: "#2563eb", color: "#fff", textTransform: "none", fontWeight: 700,
              borderRadius: 2, "&:hover": { bgcolor: "#1d4ed8" }
            }}
          >
            Inyectar a Banco
          </Button>
            <Tooltip title="Actualizar">
              <IconButton onClick={loadCash} sx={{ color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 2 }}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </div>
      </div>

      {/* ── Month selector + stats ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <span style={{ fontWeight: 600, fontSize: 13, color: "#374151" }}>Resumen del mes:</span>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <Select value={selMonth} onChange={e => setSelMonth(e.target.value)}>
            {MONTHS.map((m, i) => <MenuItem key={i+1} value={i+1}>{m}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 90 }}>
          <Select value={selYear} onChange={e => setSelYear(e.target.value)}>
            {[now.getFullYear()-2, now.getFullYear()-1, now.getFullYear(), now.getFullYear()+1].map(y => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>

      {cashData && (
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 28 }}>
          <StatCard
            icon={<TrendingUp sx={{ fontSize: 15 }} />}
            label="Inyecciones"
            value={fmt(cashData.month_entries)}
            color="#16a34a"
            sub="Entradas a bancos"
          />
          <StatCard
            icon={<TrendingDown sx={{ fontSize: 15 }} />}
            label="Retiros"
            value={fmt(cashData.month_exits)}
            color="#dc2626"
            sub="Salidas de bancos"
          />
          <StatCard
            icon={<AccountBalanceWallet sx={{ fontSize: 15 }} />}
            label="Balance del mes"
            value={fmt(cashData.month_net)}
            color={cashData.month_net >= 0 ? "#16a34a" : "#dc2626"}
            sub="Inyecciones - Retiros"
          />
        </div>
      )}

      {/* ── Movimientos ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>
          Movimientos — {MONTHS[selMonth - 1]} {selYear}
        </p>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} sx={{ fontSize: 12, height: 28, '& .MuiSelect-select': { py: 0.5 } }}>
              <MenuItem value="todos" sx={{ fontSize: 12 }}>Todos los tipos</MenuItem>
              <MenuItem value="inyeccion" sx={{ fontSize: 12 }}>Solo Entradas</MenuItem>
              <MenuItem value="retiro" sx={{ fontSize: 12 }}>Solo Salidas</MenuItem>
            </Select>
          </FormControl>
          <div style={{ display: "flex", gap: 6 }}>
            {["inyeccion","retiro"].map(k => (
              <div key={k} style={{
                display: "flex", alignItems: "center", gap: 4,
                background: KIND_COLORS[k].bg, color: KIND_COLORS[k].color,
                borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: KIND_COLORS[k].color }} />
                {KIND_COLORS[k].label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : (
        <TableWrap>
          <TableHead>
            <TableRow sx={{ "& th": { fontWeight: 700, color: "#374151", bgcolor: "#f9fafb" } }}>
              <TableCell>Fecha</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Concepto</TableCell>
              <TableCell>Parte</TableCell>
              <TableCell>Registrado por</TableCell>
              <TableCell align="right">Monto</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mv.filter(m => typeFilter === "todos" || m.kind === typeFilter).length === 0
              ? <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: "#9ca3af" }}>Sin movimientos en este período</TableCell></TableRow>
              : mv.filter(m => typeFilter === "todos" || m.kind === typeFilter).map((m) => {
                const kc = KIND_COLORS[m.kind] || KIND_COLORS.salida;
                return (
                  <TableRow key={m.id} sx={{ "&:hover": { bgcolor: "#fafafa" } }}>
                    <TableCell sx={{ color: "#6b7280" }}>{String(m.date)}</TableCell>
                    <TableCell>
                      <Chip
                        label={kc.label}
                        size="small"
                        sx={{ bgcolor: kc.bg, color: kc.color, fontWeight: 700, fontSize: 11, height: 22, border: `1px solid ${kc.color}22` }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{m.category} · {m.concept}</TableCell>
                    <TableCell sx={{ color: "#6b7280" }}>{m.party || "—"}</TableCell>
                    <TableCell sx={{ color: "#9ca3af", fontSize: "0.75rem" }}>{m.created_by_name || "—"}</TableCell>
                    <TableCell align="right" sx={{
                      fontWeight: 700,
                      fontFamily: "ui-monospace, monospace",
                      color: m.sign === "+" ? "#16a34a" : "#dc2626"
                    }}>
                      {m.sign}{fmt(m.amount)}
                    </TableCell>
                  </TableRow>
                );
              })
            }
          </TableBody>
        </TableWrap>
      )}



      {/* ── Injection Dialog ── */}
      <Dialog open={injOpen} onClose={() => setInjOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem", borderBottom: "1px solid #f0f0f0", pb: 1.5 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SwapHoriz sx={{ color: "#2563eb" }} />
            Inyectar dinero de Caja a Banco
          </div>
        </DialogTitle>
        <DialogContent sx={{ pt: "20px !important" }}>
          {injError && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderLeft: "3px solid #ef4444", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#b91c1c", marginBottom: 16 }}>
              {injError}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <FormControl fullWidth size="small" required>
              <InputLabel>Cuenta Bancaria destino *</InputLabel>
              <Select
                value={injForm.bank_account_id || ""}
                label="Cuenta Bancaria destino *"
                onChange={e => setInjForm(f => ({ ...f, bank_account_id: e.target.value }))}
              >
                {accounts.length === 0 && <MenuItem disabled value=""><em>No hay cuentas, crea una primero</em></MenuItem>}
                {accounts.map(acc => (
                  <MenuItem key={acc.id} value={acc.id}>
                    {acc.bank_name} - {acc.account_number}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              required
              size="small"
              label="Monto (GTQ) *"
              type="number"
              inputProps={{ step: "0.01", min: "0.01" }}
              value={injForm.amount}
              onChange={e => setInjForm(f => ({ ...f, amount: e.target.value }))}
            />
            <TextField
              required
              size="small"
              label="Fecha *"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={injForm.date}
              onChange={e => setInjForm(f => ({ ...f, date: e.target.value }))}
            />
            <TextField
              size="small"
              label="Número de boleta (opcional)"
              value={injForm.slip_number}
              onChange={e => setInjForm(f => ({ ...f, slip_number: e.target.value }))}
            />
            <TextField
              fullWidth
              size="small"
              label="Observaciones (opcional)"
              multiline
              minRows={2}
              value={injForm.observations}
              onChange={e => setInjForm(f => ({ ...f, observations: e.target.value }))}
              sx={{ gridColumn: "1 / -1" }}
            />
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 6 }}>
              Imagen de boleta (opcional, JPG/PNG/WEBP, máx. 5 MB)
            </label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={e => setInjFile(e.target.files[0] || null)}
              style={{ fontSize: 13 }}
            />
          </div>
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "10px 14px", marginTop: 16, fontSize: 12, color: "#1d4ed8" }}>
            Esta operación <strong>agrega al saldo de Caja General (Bancos)</strong> el monto ingresado y <strong>descuenta de la Caja de Ofrendas</strong> (circulación). Queda registrada como inyección al banco seleccionado.
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" size="small" sx={{ textTransform: "none" }} onClick={() => setInjOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            disableElevation
            size="small"
            disabled={injSaving}
            onClick={handleCreateInjection}
            startIcon={injSaving ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : <Add />}
            sx={{ bgcolor: "#2563eb", textTransform: "none", fontWeight: 700, "&:hover": { bgcolor: "#1d4ed8" } }}
          >
            {injSaving ? "Registrando..." : "Confirmar Inyección"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
