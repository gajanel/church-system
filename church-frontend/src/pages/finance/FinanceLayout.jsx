/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { getMonthlySummary } from "../../api/finance";
import { Tabs, Tab, Paper, Button } from "@mui/material";
import {
  AccountBalanceWallet, CallMade, CallReceived, Flag, Savings, AccountBalance, ArrowBack
} from "@mui/icons-material";
import { PageHeader } from "../../components/ui/PageHeader";
import s from "../../styles/page.module.css";

const thisMonth = new Date().getMonth() + 1;
const thisYear  = new Date().getFullYear();

export default function FinanceLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);

  const isLanding = location.pathname === "/finance" || location.pathname === "/finance/";

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

  // Map routes to tab index
  const currentPath = location.pathname;
  let tabValue = "/finance/cash";
  if (currentPath === "/finance" || currentPath === "/finance/cash") tabValue = "/finance/cash";
  else if (currentPath.includes("/finance/offerings"))  tabValue = "/finance/offerings";
  else if (currentPath.includes("/finance/incomes"))    tabValue = "/finance/incomes";
  else if (currentPath.includes("/finance/expenses"))   tabValue = "/finance/expenses";
  else if (currentPath.includes("/finance/goals"))      tabValue = "/finance/goals";
  else if (currentPath.includes("/finance/deposits"))   tabValue = "/finance/deposits";

  const titles = {
    "/finance/cash": "Caja General",
    "/finance/offerings": "Ofrendas",
    "/finance/incomes": "Ingresos Adicionales",
    "/finance/expenses": "Gastos",
    "/finance/goals": "Metas Financieras",
    "/finance/deposits": "Bancos"
  };
  const currentTitle = titles[tabValue] || "Finanzas y Contabilidad";

  const handleTabChange = (_, newValue) => {
    navigate(newValue);
  };

  return (
    <div className={s.page}>
      {!isLanding && (
        <>
          <PageHeader title={currentTitle} subtitle="Módulo de gestión financiera">
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate("/finance")}
              variant="outlined"
              size="small"
              sx={{ textTransform: "none", borderRadius: "8px", color: "#374151", borderColor: "#d1d5db" }}
            >
              Volver al Menú
            </Button>
          </PageHeader>
        </>
      )}

      {/* Sub-routes will be rendered here */}
      <Outlet context={{ refreshSummary: loadSummary, summary }} />
    </div>
  );
}
