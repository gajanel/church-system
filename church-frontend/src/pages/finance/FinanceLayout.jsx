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

  const handleTabChange = (_, newValue) => {
    navigate(newValue);
  };

  return (
    <div className={s.page}>
      {!isLanding && (
        <>
          <PageHeader title="Finanzas y Contabilidad" subtitle="Visión general de estado financiero y flujos de capital.">
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

          {/* Navigation tabs */}
          <Paper
            elevation={0}
            sx={{ borderRadius: "8px", border: "1px solid #e5e7eb", marginBottom: 3, overflow: "hidden" }}
          >
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                minHeight: 44,
                "& .MuiTab-root": {
                  minHeight: 44,
                  textTransform: "none",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "#6b7280",
                  padding: "0 18px",
                  gap: "6px",
                },
                "& .Mui-selected": { color: "#1d4ed8" },
                "& .MuiTabs-indicator": { backgroundColor: "#1d4ed8", height: 3 },
              }}
            >
              <Tab
                icon={<AccountBalanceWallet sx={{ fontSize: 16 }} />}
                iconPosition="start"
                label="Caja General"
                value="/finance/cash"
              />
              <Tab
                icon={<Savings sx={{ fontSize: 16 }} />}
                iconPosition="start"
                label="Ofrendas"
                value="/finance/offerings"
              />
              <Tab
                icon={<CallMade sx={{ fontSize: 16 }} />}
                iconPosition="start"
                label="Otros Ingresos"
                value="/finance/incomes"
              />
              <Tab
                icon={<CallReceived sx={{ fontSize: 16 }} />}
                iconPosition="start"
                label="Gastos"
                value="/finance/expenses"
              />
              <Tab
                icon={<Flag sx={{ fontSize: 16 }} />}
                iconPosition="start"
                label="Metas Fijas"
                value="/finance/goals"
              />
              <Tab
                icon={<AccountBalance sx={{ fontSize: 16 }} />}
                iconPosition="start"
                label="Bancos"
                value="/finance/deposits"
              />
            </Tabs>
          </Paper>
        </>
      )}

      {/* Sub-routes will be rendered here */}
      <Outlet context={{ refreshSummary: loadSummary, summary }} />
    </div>
  );
}
