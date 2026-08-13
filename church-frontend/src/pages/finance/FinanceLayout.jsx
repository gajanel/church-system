import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { getMonthlySummary } from "../../api/finance";
import { Tabs, Tab, Paper } from "@mui/material";
import {
  AccountBalanceWallet, CallMade, CallReceived, Flag, Receipt
} from "@mui/icons-material";
import { Card, CardBody } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import s from "../../styles/page.module.css";

const thisMonth = new Date().getMonth() + 1;
const thisYear  = new Date().getFullYear();
const fmt       = n => `Q ${parseFloat(n || 0).toFixed(2)}`;

export default function FinanceLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);

  const loadSummary = async () => {
    try {
      const res = await getMonthlySummary(thisMonth, thisYear);
      setSummary(res.data);
    } catch (err) {
      console.error("Error loading summary:", err);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const summaryCards = summary ? [
    { label:"Ofrendas del Mes",  value:summary.total_offerings, color:"#2E7D32", borderColor:"#e0e0e0" }, // Verde Bosque
    { label:"Ingresos del Mes",  value:summary.total_incomes,   color:"#2E7D32", borderColor:"#e0e0e0" },
    { label:"Gastos del Mes",    value:summary.total_expenses,  color:"#C62828", borderColor:"#e0e0e0" }, // Rojo Ladrillo
    { label:"Balance General",   value:summary.balance,         color:summary.balance>=0?"#2E7D32":"#C62828", borderColor:"#e0e0e0" },
  ] : [];

  // Map routes to tab index
  const currentPath = location.pathname;
  let tabValue = "/finance"; // default
  if (currentPath.includes("/finance/incomes")) tabValue = "/finance/incomes";
  else if (currentPath.includes("/finance/expenses")) tabValue = "/finance/expenses";
  else if (currentPath.includes("/finance/goals")) tabValue = "/finance/goals";
  else if (currentPath.includes("/finance/deposits")) tabValue = "/finance/deposits";

  const handleTabChange = (_, newValue) => {
    navigate(newValue);
  };

  return (
    <div className={s.page}>
      <PageHeader title="Finanzas y Contabilidad" subtitle="Visión general de estado financiero y flujos de capital." />

      {/* Summary row */}
      {summary && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px,1fr))", gap:16, marginBottom:24 }}>
          {summaryCards.map((sc, i) => (
            <div key={i} style={{
              background: "#fff",
              border: `1px solid ${sc.borderColor}`,
              borderRadius: "4px",
              padding: "16px",
              boxShadow: "none"
            }}>
              <div style={{ fontSize:"0.75rem", fontWeight:600, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8 }}>
                {sc.label}
              </div>
              <div style={{ fontSize:"1.5rem", fontWeight:700, color:sc.color, fontFamily:"ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
                {fmt(sc.value)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sub-routes will be rendered here */}
      <Outlet context={{ refreshSummary: loadSummary, summary }} />
    </div>
  );
}
