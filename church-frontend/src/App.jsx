import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";

// Layouts and Core Components (kept static for stability)
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// Lazy Loaded Pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Members = lazy(() => import("./pages/Members"));
const Login = lazy(() => import("./pages/Login"));
const Ministries = lazy(() => import("./pages/Ministries"));
const Finance = lazy(() => import("./pages/Finance"));
const Projects = lazy(() => import("./pages/Projects"));
const Events = lazy(() => import("./pages/Events"));
const Reports = lazy(() => import("./pages/Reports"));
const Users = lazy(() => import("./pages/Users"));
const Privileges = lazy(() => import("./pages/Privileges"));
const Announcements = lazy(() => import("./pages/Announcements"));
const Projection = lazy(() => import("./pages/Projection"));
const Attendance = lazy(() => import("./pages/Attendance"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));

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
    // Recuperamos la configuración para aplicar el branding "Premium"
    const applyBranding = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/settings/public`);
        const data = await response.json(); // el endpoint devuelve el objeto directamente
        
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
        // Silencioso — el branding por defecto ya está en tokens.css
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
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/members"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Members />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/ministries"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Ministries />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/finance"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Finance />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Projects />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Events />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route path="/reports" element={<ProtectedRoute><MainLayout><Reports /></MainLayout></ProtectedRoute>} />
          <Route path="/privileges" element={<ProtectedRoute><MainLayout><Privileges /></MainLayout></ProtectedRoute>} />
          <Route path="/announcements" element={<ProtectedRoute><MainLayout><Announcements /></MainLayout></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute><MainLayout><Attendance /></MainLayout></ProtectedRoute>} />
          
          <Route
            path="/usuarios"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Users />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Settings />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route path="/projection" element={<Projection />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
