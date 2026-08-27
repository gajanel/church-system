import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";

// Layouts and Core Components (kept static for stability)
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// Lazy Loaded Pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Members = lazy(() => import("./pages/Members"));
const Login = lazy(() => import("./pages/Login"));
const Ministries = lazy(() => import("./pages/Ministries"));
const FinanceLanding    = lazy(() => import("./pages/finance/FinanceLanding"));
const FinanceLayout    = lazy(() => import("./pages/finance/FinanceLayout"));
const CashRegister     = lazy(() => import("./pages/finance/CashRegister"));
const FinanceOfferings = lazy(() => import("./pages/finance/Offerings"));
const FinanceIncomes = lazy(() => import("./pages/finance/Incomes"));
const FinanceExpenses = lazy(() => import("./pages/finance/Expenses"));
const FinanceGoals = lazy(() => import("./pages/finance/Goals"));
const FinanceDeposits = lazy(() => import("./pages/finance/Deposits"));
const Projects = lazy(() => import("./pages/Projects"));
const Events = lazy(() => import("./pages/Events"));
const ReportsLanding = lazy(() => import("./pages/reports/ReportsLanding"));
const ReportsLayout = lazy(() => import("./pages/reports/ReportsLayout"));
const FinancialMonthly = lazy(() => import("./pages/reports/FinancialMonthly"));
const FinancialAnnual = lazy(() => import("./pages/reports/FinancialAnnual"));
const MembersReport = lazy(() => import("./pages/reports/MembersReport"));
const ProjectsReport = lazy(() => import("./pages/reports/ProjectsReport"));
const MemberContributions = lazy(() => import("./pages/reports/MemberContributions"));
const AttendanceReport = lazy(() => import("./pages/reports/AttendanceReport"));
const MinistriesReport = lazy(() => import("./pages/reports/MinistriesReport"));
const Users = lazy(() => import("./pages/Users"));
const Privileges = lazy(() => import("./pages/Privileges"));
const Announcements = lazy(() => import("./pages/Announcements"));
const Projection = lazy(() => import("./pages/Projection"));
const Attendance = lazy(() => import("./pages/Attendance"));
const SettingsLanding = lazy(() => import("./pages/settings/SettingsLanding"));
const SettingsLayout = lazy(() => import("./pages/settings/SettingsLayout"));
const IdentitySettings = lazy(() => import("./pages/settings/Identity"));
const FinanceSettings = lazy(() => import("./pages/settings/FinanceSettings"));
const VerseSettings = lazy(() => import("./pages/settings/VerseSettings"));
const BrandSettings = lazy(() => import("./pages/settings/BrandSettings"));
const SecuritySettings = lazy(() => import("./pages/settings/SecuritySettings"));
const DataSettings = lazy(() => import("./pages/settings/DataSettings"));
const AppearanceSettings = lazy(() => import("./pages/settings/AppearanceSettings"));
const AuditSettings = lazy(() => import("./pages/settings/AuditSettings"));
const NotFound  = lazy(() => import("./pages/NotFound"));
const MinistryWorkspace = lazy(() => import("./pages/MinistryWorkspace"));
const MinistryDetail    = lazy(() => import("./pages/MinistryDetail"));
const MinistriesLanding = lazy(() => import("./pages/MinistriesLanding"));

// Loading Component
const PageLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
    <CircularProgress size={60} thickness={4} sx={{ color: '#2563eb' }} />
  </Box>
);

function App() {
  // Apply visual theme and localization
  useEffect(() => {
    // 1. Dark Mode Persistence
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // 2. Dynamic Branding Transformation
    const applyBranding = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:8000`;
        const response = await fetch(`${baseUrl}/settings/public`);
        if (!response.ok) return;
        const data = await response.json();
        
        if (data && data.primary_color) {
          const root = document.documentElement;
          root.style.setProperty('--color-primary', data.primary_color);
          root.style.setProperty('--color-primary-hover', data.secondary_color || data.primary_color);
          if (data.font_family) {
            root.style.setProperty('--font', data.font_family);
          }
          document.title = data.church_name || "Sistema de Gestión Ministerial";
        }
      } catch (error) {
        // Silencioso
      }
    };
    applyBranding();


    // Listen for theme changes from Settings page
    const onStorage = (e) => {
      if (e.key === "theme") {
        if (e.newValue === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Suspense fallback={<PageLoader />}><Login /></Suspense>} />
        <Route path="/projection" element={<Suspense fallback={<PageLoader />}><Projection /></Suspense>} />
        <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFound /></Suspense>} />

        {/* Protected Routes with MainLayout */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout>
                <Suspense fallback={<PageLoader />}>
                  <Outlet />
                </Suspense>
              </MainLayout>
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/members" element={<Members />} />
          <Route path="/ministries" element={<MinistriesLanding />} />
          <Route path="/ministries/admin" element={<Ministries />} />
          <Route path="/ministry-workspace" element={<MinistryWorkspace />} />
          <Route path="/ministry-workspace/:ministrySlug" element={<MinistryDetail />} />
          <Route path="/finance" element={<FinanceLayout />}>
            <Route index element={<FinanceLanding />} />
            <Route path="cash" element={<CashRegister />} />
            <Route path="offerings" element={<FinanceOfferings />} />
            <Route path="incomes" element={<FinanceIncomes />} />
            <Route path="expenses" element={<FinanceExpenses />} />
            <Route path="goals" element={<FinanceGoals />} />
            <Route path="deposits" element={<FinanceDeposits />} />
          </Route>
          <Route path="/projects" element={<Projects />} />
          <Route path="/events" element={<Events />} />
          <Route path="/reports" element={<ReportsLayout />}>
            <Route index element={<ReportsLanding />} />
            <Route path="monthly" element={<FinancialMonthly />} />
            <Route path="annual" element={<FinancialAnnual />} />
            <Route path="members" element={<MembersReport />} />
            <Route path="projects" element={<ProjectsReport />} />
            <Route path="contributions" element={<MemberContributions />} />
            <Route path="attendance" element={<AttendanceReport />} />
            <Route path="ministries" element={<MinistriesReport />} />
          </Route>
          <Route path="/privileges" element={<Privileges />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/usuarios" element={<Users />} />
          <Route path="/settings" element={<SettingsLayout />}>
            <Route index element={<SettingsLanding />} />
            <Route path="identity" element={<IdentitySettings />} />
            <Route path="finance" element={<FinanceSettings />} />
            <Route path="verse" element={<VerseSettings />} />
            <Route path="brand" element={<BrandSettings />} />
            <Route path="security" element={<SecuritySettings />} />
            <Route path="data" element={<DataSettings />} />
            <Route path="appearance" element={<AppearanceSettings />} />
            <Route path="audit" element={<AuditSettings />} />
          </Route>
        </Route>
      </Routes>

    </BrowserRouter>
  );
}

export default App;
