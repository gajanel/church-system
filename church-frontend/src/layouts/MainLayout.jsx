import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home as HomeIcon,
  People as UsersIcon,
  AccountBalance as ChurchIcon,
  AttachMoney as MoneyIcon,
  AccountTree as ProjectIcon,
  Event as EventIcon,
  Star as StarIcon,
  Campaign as AnnouncementIcon,
  Assessment as ReportIcon,
  AdminPanelSettings as AdminIcon,
  AssignmentInd as AttendanceIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  Settings as SettingsIcon,
  Language as LanguageIcon,
  ChevronRight,
} from "@mui/icons-material";
import styles from "./MainLayout.module.css";
import { getSettings } from "../api/settings";

const MENU_ITEMS = (t, hasAccess, isAdmin) => [
  { title: t("sidebar.dashboard"),    icon: <HomeIcon       sx={{ fontSize: 16 }} />, path: "/",             show: true },
  { title: t("sidebar.members"),      icon: <UsersIcon      sx={{ fontSize: 16 }} />, path: "/members",      show: hasAccess("members") },
  { title: t("sidebar.ministries"),   icon: <ChurchIcon     sx={{ fontSize: 16 }} />, path: "/ministries",   show: hasAccess("ministries") },
  { title: t("sidebar.finance"),      icon: <MoneyIcon      sx={{ fontSize: 16 }} />, path: "/finance",      show: hasAccess("finance") },
  { title: t("sidebar.projects"),     icon: <ProjectIcon    sx={{ fontSize: 16 }} />, path: "/projects",     show: hasAccess("projects") },
  { title: t("sidebar.events"),       icon: <EventIcon      sx={{ fontSize: 16 }} />, path: "/events",       show: hasAccess("events") },
  { title: t("sidebar.privileges"),   icon: <StarIcon       sx={{ fontSize: 16 }} />, path: "/privileges",   show: hasAccess("privileges") },
  { title: t("sidebar.announcements"), icon: <AnnouncementIcon sx={{ fontSize: 16 }} />, path: "/announcements", show: hasAccess("announcements") },
  { title: t("sidebar.attendance"),   icon: <AttendanceIcon sx={{ fontSize: 16 }} />, path: "/attendance",   show: hasAccess("attendance") },
  { title: t("sidebar.reports"),      icon: <ReportIcon     sx={{ fontSize: 16 }} />, path: "/reports",      show: hasAccess("reports") },
  { title: t("sidebar.users"),        icon: <AdminIcon      sx={{ fontSize: 16 }} />, path: "/usuarios",     show: isAdmin },
  { title: t("sidebar.settings"),     icon: <SettingsIcon   sx={{ fontSize: 16 }} />, path: "/settings",     show: isAdmin },
];

export default function MainLayout({ children }) {
  const { t, i18n } = useTranslation();
  const navigate  = useNavigate();
  const location  = useLocation();
  
  const [user, setUser]           = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [langOpen, setLangOpen]     = useState(false);
  const dropdownRef = useRef(null);
  const langRef     = useRef(null);
  const [settings, setSettings] = useState(null);

  /* Load user from session */
  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (raw) setUser(JSON.parse(raw));
    
    // Load system settings
    getSettings().then(res => setSettings(res.data)).catch(() => {});
  }, []);

  /* Close menus on outside click */
  useEffect(() => {
    const onOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  /* Close sidebar on route change (mobile) */
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const hasAccess = (mod) => {
    if (!user) return false;
    if (user.is_admin) return true;
    return user.modules?.includes(mod);
  };

  const logout = () => {
    ["token", "refresh_token", "user"].forEach(k => localStorage.removeItem(k));
    navigate("/login");
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setLangOpen(false);
  };

  const menuItems = MENU_ITEMS(t, hasAccess, user?.is_admin);

  const pageTitle = menuItems.find(m =>
    m.path === location.pathname ||
    (m.path !== "/" && location.pathname.startsWith(m.path))
  )?.title ?? "Panel";

  /* ── Sidebar variants ── */
  const sidebarVariants = {
    open: { x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
    closed: { x: "-100%", transition: { type: "spring", stiffness: 300, damping: 30 } }
  };

  const sidebar = (
    <>
      {/* Brand */}
      <div className={styles.logo}>
        <div className={styles.logoMark}>
          <ChurchIcon sx={{ fontSize: 16, color: "#fff" }} />
        </div>
        <div className={styles.logoText}>
          <div className={styles.logoName}>{settings?.church_name || "Ministerio"}</div>
          <div className={styles.logoBadge}>{settings?.church_address || t("dashboard.subtitle")}</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className={styles.nav} aria-label="Menú principal">
        <div className={styles.navSection}>{t("common.actions")}</div>
        <ul className={styles.navList}>
          {menuItems.filter(i => i.show).map(item => {
            const active =
              location.pathname === item.path ||
              (item.path !== "/" && location.pathname.startsWith(item.path));
            return (
              <li key={item.path}>
                <motion.button
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`${styles.navBtn} ${active ? styles.active : ""}`}
                  onClick={() => navigate(item.path)}
                  aria-current={active ? "page" : undefined}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span className={styles.navTitle}>{item.title}</span>
                  {active && (
                    <motion.div 
                      layoutId="active-pill"
                      className={styles.activePill} 
                    />
                  )}
                  {active && <ChevronRight className={styles.navArrow} sx={{ fontSize: 14 }} />}
                </motion.button>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );

  return (
    <div className={styles.shell}>
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.overlay}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <aside className={`${styles.sidebar} ${mobileOpen ? styles.open : ""}`}>
        {sidebar}
      </aside>

      {/* ── Topbar ── */}
      <header className={styles.topbar}>
        <button
          className={styles.hamburger}
          onClick={() => setMobileOpen(v => !v)}
          aria-label="Abrir menú"
        >
          <MenuIcon sx={{ fontSize: 20 }} />
        </button>

        <div className={styles.topbarTitle}>
          {pageTitle !== t("sidebar.dashboard") && pageTitle}
        </div>

        <div className={styles.topbarActions}>
          {/* Language Selector */}
          <div className={styles.langMenuWrap} ref={langRef}>
            <button 
              className={styles.iconActionBtn}
              onClick={() => setLangOpen(!langOpen)}
              title="Cambiar idioma"
            >
              <LanguageIcon sx={{ fontSize: 18 }} />
              <span className={styles.langLabel}>{i18n.language.toUpperCase()}</span>
            </button>
            <AnimatePresence>
              {langOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className={styles.dropdown}
                >
                  <button className={styles.dropdownItem} onClick={() => changeLanguage('es')}>
                    <span className={styles.langFlag}>🇪🇸</span> Español
                  </button>
                  <button className={styles.dropdownItem} onClick={() => changeLanguage('en')}>
                    <span className={styles.langFlag}>🇺🇸</span> English
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className={styles.dividerV} />

          {/* User menu */}
          {user && (
            <div className={styles.userMenuWrap} ref={dropdownRef}>
              <button
                id="user-menu-btn"
                className={styles.userMenuBtn}
                onClick={() => setDropdownOpen(v => !v)}
                aria-haspopup="true"
                aria-expanded={dropdownOpen}
              >
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{user.name}</span>
                  <span className={styles.userRole}>
                    {user.is_admin ? t("user_management.admin") || "Admin" : t("user_management.user") || "User"}
                  </span>
                </div>
                <div className={styles.avatar} aria-hidden>
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className={styles.dropdown} 
                    role="menu"
                  >
                    <div className={styles.dropdownSection}>{t("sidebar.users")}</div>
                    <div className={styles.dropdownDivider} />
                    <button
                      className={`${styles.dropdownItem} ${styles.logoutBtn}`}
                      role="menuitem"
                      onClick={logout}
                    >
                      <LogoutIcon sx={{ fontSize: 14 }} />
                      {t("sidebar.logout")}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </header>

      {/* ── Main content ── */}
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
