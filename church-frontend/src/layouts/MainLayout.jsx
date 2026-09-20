/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import { useNavigate, useLocation } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useTranslation } from "react-i18next";

import {
  DashboardOutlined         as DashboardIcon,
  PeopleAltOutlined         as MembersIcon,
  GroupsOutlined            as MinistriesIcon,
  AccountBalanceWalletOutlined as FinanceIcon,
  FolderOutlined            as ProjectsIcon,
  CalendarMonthOutlined     as EventsIcon,
  AssignmentIndOutlined     as PrivilegesIcon,
  CampaignOutlined          as AnnouncementsIcon,
  FactCheckOutlined         as AttendanceIcon,
  AssessmentOutlined        as ReportsIcon,
  AdminPanelSettingsOutlined as AdminIcon,
  SettingsOutlined          as SettingsIcon,
  AccountBalanceOutlined    as ChurchIcon,
  DomainOutlined            as WorkspaceIcon,
  LogoutOutlined            as LogoutIcon,
  MenuOutlined              as MenuIcon,
  LanguageOutlined          as LanguageIcon,
  ChevronRight,
  ChevronLeft,
  KeyboardDoubleArrowLeft,
  KeyboardDoubleArrowRight,
  AttachMoney, MenuBook, PersonOutlined, AccountBalanceWallet,
  CallReceived, CallMade, Flag, Savings, AccountBalance
} from "@mui/icons-material";

import { Tooltip } from "@mui/material";
import styles from "./MainLayout.module.css";
import { getSettings } from "../api/settings";
import { userHasModuleAccess } from "../components/userAccess";

const ICON_SIZE = 17;

const MENU_ITEMS = (t, hasAccess, isAdmin, user) => [
  { title: t("sidebar.dashboard"),     icon: <DashboardIcon     sx={{ fontSize: ICON_SIZE }} />, path: "/",            show: hasAccess("dashboard") },
  { title: t("sidebar.members"),       icon: <MembersIcon       sx={{ fontSize: ICON_SIZE }} />, path: "/members",     show: hasAccess("members") },
  { title: t("sidebar.ministries"), icon: <MinistriesIcon sx={{ fontSize: ICON_SIZE }} />, path: "/ministries", show: hasAccess("ministries") || user?.modules?.includes("workspace") || user?.modules?.some(m => m.startsWith("ministry.")) || isAdmin },
  {
    title: t("sidebar.finance"), icon: <FinanceIcon sx={{ fontSize: ICON_SIZE }} />,
    group: "finance", show: hasAccess("finance"),
    children: [
      { title: t("sidebar.finance_summary"), icon: <AccountBalanceWallet sx={{ fontSize: 15 }} />, path: "/finance", exact: true, show: hasAccess("finance") },
      { title: t("sidebar.cash"), icon: <AttachMoney sx={{ fontSize: 15 }} />, path: "/finance/cash", show: hasAccess("finance.cash") },
      { title: t("sidebar.offerings"), icon: <Savings sx={{ fontSize: 15 }} />, path: "/finance/offerings", show: hasAccess("finance.offerings") },
      { title: t("sidebar.incomes"), icon: <CallReceived sx={{ fontSize: 15 }} />, path: "/finance/incomes", show: hasAccess("finance.incomes") },
      { title: t("sidebar.expenses"), icon: <CallMade sx={{ fontSize: 15 }} />, path: "/finance/expenses", show: hasAccess("finance.expenses") },
      { title: t("sidebar.goals"), icon: <Flag sx={{ fontSize: 15 }} />, path: "/finance/goals", show: hasAccess("finance.goals") },
      { title: t("sidebar.deposits"), icon: <AccountBalance sx={{ fontSize: 15 }} />, path: "/finance/deposits", show: hasAccess("finance.deposits") },
    ],
  },
  { title: t("sidebar.projects"),      icon: <ProjectsIcon      sx={{ fontSize: ICON_SIZE }} />, path: "/projects",     show: hasAccess("projects") },
  { title: t("sidebar.events"),        icon: <EventsIcon        sx={{ fontSize: ICON_SIZE }} />, path: "/events",       show: hasAccess("events") },
  { title: t("sidebar.privileges"),    icon: <PrivilegesIcon    sx={{ fontSize: ICON_SIZE }} />, path: "/privileges",   show: hasAccess("privileges") },
  { title: t("sidebar.announcements"), icon: <AnnouncementsIcon sx={{ fontSize: ICON_SIZE }} />, path: "/announcements", show: hasAccess("announcements") },
  { title: t("sidebar.attendance"),    icon: <AttendanceIcon    sx={{ fontSize: ICON_SIZE }} />, path: "/attendance",   show: hasAccess("attendance") },
  {
    title: t("sidebar.reports"), icon: <ReportsIcon sx={{ fontSize: ICON_SIZE }} />,
    group: "reports", show: hasAccess("reports"),
    children: [
      { title: t("sidebar.reports_summary"), icon: <ReportsIcon sx={{ fontSize: 15 }} />, path: "/reports", exact: true, show: hasAccess("reports") },
      { title: t("sidebar.monthly_report"), icon: <MenuBook sx={{ fontSize: 15 }} />, path: "/reports/monthly", show: hasAccess("reports.monthly") },
      { title: t("sidebar.bank_report"), icon: <AccountBalance sx={{ fontSize: 15 }} />, path: "/reports/bank-monthly", show: hasAccess("reports.monthly") },
      { title: t("sidebar.annual_report"), icon: <EventsIcon sx={{ fontSize: 15 }} />, path: "/reports/annual", show: hasAccess("reports.annual") },
      { title: t("sidebar.members_report"), icon: <MembersIcon sx={{ fontSize: 15 }} />, path: "/reports/members", show: hasAccess("reports.members") },
      { title: t("sidebar.projects_report"), icon: <ProjectsIcon sx={{ fontSize: 15 }} />, path: "/reports/projects", show: hasAccess("reports.projects") },
      { title: t("sidebar.contributions_report"), icon: <Savings sx={{ fontSize: 15 }} />, path: "/reports/contributions", show: hasAccess("reports.contributions") },
      { title: t("sidebar.attendance_report"), icon: <AttendanceIcon sx={{ fontSize: 15 }} />, path: "/reports/attendance", show: hasAccess("reports.attendance") },
      { title: t("sidebar.ministries_report"), icon: <MinistriesIcon sx={{ fontSize: 15 }} />, path: "/reports/ministries", show: hasAccess("reports.ministries") },
    ],
  },
  {
    title: t("sidebar.administration"), icon: <AdminIcon sx={{ fontSize: ICON_SIZE }} />,
    group: "administration", show: true,
    children: [
      { title: t("sidebar.users"), icon: <AdminIcon sx={{ fontSize: 15 }} />, path: "/usuarios", show: isAdmin },
      { title: t("sidebar.settings"), icon: <SettingsIcon sx={{ fontSize: 15 }} />, path: "/settings", show: true },
    ],
  },
];


export default function MainLayout({ children }) {
  const { t, i18n } = useTranslation();
  const navigate    = useNavigate();
  const location    = useLocation();

  const [user, setUser]               = useState(null);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [langOpen, setLangOpen]       = useState(false);
  const [collapsed, setCollapsed]     = useState(
    () => localStorage.getItem("sidebar_collapsed") === "true"
  );
  const [expandedGroups, setExpandedGroups] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sidebar_groups") || "[]"); }
    catch { return []; }
  });
  const [settings, setSettings] = useState(null);

  const dropdownRef = useRef(null);
  const langRef     = useRef(null);

  const logout = useCallback(() => {
    ["token", "refresh_token", "user"].forEach(key => localStorage.removeItem(key));
    navigate("/login");
  }, [navigate]);

  /* Load user + settings */
  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (raw) {
      try { setUser(JSON.parse(raw)); }
      catch { logout(); }
    }
    getSettings().then(res => setSettings(res.data)).catch(() => {});
  }, [logout]);

  /* Close menus on outside click */
  useEffect(() => {
    const onOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      if (langRef.current    && !langRef.current.contains(e.target))    setLangOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  /* Close sidebar on route change (mobile) */
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const isAdmin = user?.is_admin || user?.is_super_admin;
  const hasAccess = useCallback(
    moduleId => userHasModuleAccess(user, moduleId),
    [user]
  );

  const menuItems = useMemo(() => (
    MENU_ITEMS(t, hasAccess, isAdmin, user).map(item => ({
      ...item,
      children: item.children?.filter(child => child.show !== false),
    }))
  ), [t, hasAccess, isAdmin, user]);

  // For breadcrumb and routing: flatten all allowed items
  const allPaths = useMemo(() => (
    menuItems
      .filter(item => item.show !== false)
      .flatMap(item => item.children?.length ? item.children : (item.path ? [item] : []))
  ), [menuItems]);

  /* Verify route access on navigation */
  useEffect(() => {
    if (!user) return; // Wait until user is parsed
    if (user.is_admin || user.is_super_admin) return; // Admins have full access

    const ministryAccess = hasAccess("ministries") || user.modules?.includes("workspace") || user.modules?.some(m => m.startsWith("ministry."));

    // Check if the current route matches any allowed path
    const isAllowed = allPaths.some(m => 
      m.path === location.pathname || 
      (m.path !== "/" && location.pathname.startsWith(m.path))
    ) || (location.pathname.startsWith("/ministry-workspace") && ministryAccess);

    if (!isAllowed) {
      if (allPaths.length > 0) {
        navigate(allPaths[0].path, { replace: true });
      }
    }
    
    if (location.pathname === "/ministries/admin" && !isAdmin) {
        navigate("/ministries", { replace: true });
    }
  }, [location.pathname, user, allPaths, navigate, hasAccess, isAdmin]);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar_collapsed", String(next));
  };

  const changeLanguage = (lng) => { i18n.changeLanguage(lng); setLangOpen(false); };

  const pageTitle = [...allPaths].sort((a, b) => b.path.length - a.path.length).find(m =>
    m.path === location.pathname ||
    (!m.exact && m.path !== "/" && location.pathname.startsWith(`${m.path}/`))
  )?.title ?? "Panel";

  const toggleGroup = (groupKey) => {
    setExpandedGroups(prev => {
      const next = prev.includes(groupKey)
        ? [] // Cierra el grupo si ya estaba abierto
        : [groupKey]; // Abre el grupo y cierra todos los demás
      localStorage.setItem("sidebar_groups", JSON.stringify(next));
      return next;
    });
  };

  // Auto-expand group if a child is active
  const isGroupActive = (item) =>
    item.children?.some(c =>
      location.pathname === c.path ||
      (!c.exact && c.path !== "/" && location.pathname.startsWith(c.path + "/"))
    );

  useEffect(() => {
    const activeItem = menuItems.find(m => m.group && isGroupActive(m));
    if (activeItem) {
      setExpandedGroups(prev => {
        if (!prev.includes(activeItem.group)) {
          const next = [activeItem.group];
          localStorage.setItem("sidebar_groups", JSON.stringify(next));
          return next;
        }
        return prev;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <div className={styles.shell}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className={styles.overlay} onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`${styles.sidebar} ${mobileOpen ? styles.open : ""} ${collapsed ? styles.collapsed : ""}`}>

        {/* Brand */}
        <div className={styles.logo}>
          <div className={styles.logoMark}>
            <ChurchIcon sx={{ fontSize: 16 }} />
          </div>
          {!collapsed && (
            <div className={styles.logoText}>
              <div className={styles.logoName}>{settings?.church_name || "Ministerio"}</div>
              <div className={styles.logoBadge}>Gestión congregacional</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className={styles.nav} aria-label="Menú principal">
          {!collapsed && (
            <div className={styles.navSection}>{t("common.actions")}</div>
          )}
          <ul className={styles.navList}>
            {menuItems.filter(i => i.show).map(item => {
              // ── Group item (has children) ──
              if (item.children) {
                const groupActive  = isGroupActive(item);
                const isExpanded   = expandedGroups.includes(item.group);

                return collapsed ? (
                  <li key={item.group}>
                    <Tooltip title={item.title} placement="right" arrow>
                      <button
                        className={`${styles.navBtn} ${isGroupActive(item) ? styles.active : ""}`}
                        onClick={() => {
                          setCollapsed(false);
                          localStorage.setItem("sidebar_collapsed", "false");
                          setExpandedGroups([item.group]);
                          localStorage.setItem("sidebar_groups", JSON.stringify([item.group]));
                        }}
                        style={{ justifyContent: "center", padding: "8px" }}
                      >
                        <span className={styles.navIcon}>{item.icon}</span>
                      </button>
                    </Tooltip>
                  </li>
                ) : (
                  <li key={item.group}>
                    {/* Group header button */}
                    <button
                      className={`${styles.navBtn} ${groupActive ? styles.groupActive : ""}`}
                      onClick={() => toggleGroup(item.group)}
                      aria-expanded={isExpanded}
                    >
                      <span className={styles.navIcon}>{item.icon}</span>
                      <span className={styles.navTitle}>{item.title}</span>
                      <span className={`${styles.groupChevron} ${isExpanded ? styles.groupChevronOpen : ""}`}>
                        <ChevronRight sx={{ fontSize: 13 }} />
                      </span>
                    </button>
                    {/* Sub-items */}
                    {isExpanded && (
                      <ul className={styles.subList}>
                        {item.children.map(child => {
                          const childActive = location.pathname === child.path ||
                            (!child.exact && child.path !== "/" && location.pathname.startsWith(child.path + "/"));
                          return (
                            <li key={child.path}>
                              <button
                                className={`${styles.subBtn} ${childActive ? styles.subActive : ""}`}
                                onClick={() => navigate(child.path)}
                                aria-current={childActive ? "page" : undefined}
                              >
                                <span className={styles.subIcon}>{child.icon}</span>
                                <span className={styles.subTitle}>{child.title}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              }

              // ── Regular item ──
              const active =
                location.pathname === item.path ||
                (item.path !== "/" && location.pathname.startsWith(item.path + "/"));
              return (
                <li key={item.path}>
                  {collapsed ? (
                    <Tooltip title={item.title} placement="right" arrow>
                      <button
                        className={`${styles.navBtn} ${active ? styles.active : ""}`}
                        onClick={() => navigate(item.path)}
                        aria-current={active ? "page" : undefined}
                        style={{ justifyContent: "center", padding: "8px" }}
                      >
                        <span className={styles.navIcon}>{item.icon}</span>
                      </button>
                    </Tooltip>
                  ) : (
                    <button
                      className={`${styles.navBtn} ${active ? styles.active : ""}`}
                      onClick={() => navigate(item.path)}
                      aria-current={active ? "page" : undefined}
                    >
                      <span className={styles.navIcon}>{item.icon}</span>
                      <span className={styles.navTitle}>{item.title}</span>
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Collapse toggle */}
        <button
          className={styles.collapseBtn}
          onClick={toggleCollapse}
          title={collapsed ? "Expandir menú" : "Colapsar menú"}
        >
          {collapsed
            ? <KeyboardDoubleArrowRight sx={{ fontSize: 14 }} />
            : <KeyboardDoubleArrowLeft  sx={{ fontSize: 14 }} />
          }
        </button>
      </aside>

      {/* ── Topbar ── */}
      <header className={`${styles.topbar} ${collapsed ? styles.collapsed : ""}`}>
        <button
          className={styles.hamburger}
          onClick={() => setMobileOpen(open => {
            if (!open && collapsed) setCollapsed(false);
            return !open;
          })}
          aria-label="Abrir menú"
        >
          <MenuIcon sx={{ fontSize: 16 }} />
        </button>

        {/* Breadcrumb */}
        <div className={styles.topbarTitle}>
          {pageTitle !== t("sidebar.dashboard") ? (
            <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
              {settings?.church_name || "Sistema"} <span style={{ margin: "0 4px" }}>›</span> <strong style={{ color: "var(--text-primary)" }}>{pageTitle}</strong>
            </span>
          ) : (
            <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{settings?.church_name || "Panel de Administración"}</span>
          )}
        </div>

        <div className={styles.topbarActions}>

          {/* Language */}
          <div className={styles.langMenuWrap} ref={langRef}>
            <button
              className={styles.iconActionBtn}
              onClick={() => setLangOpen(!langOpen)}
              title="Cambiar idioma"
            >
              <LanguageIcon sx={{ fontSize: 15 }} />
              <span className={styles.langLabel}>{i18n.language.toUpperCase()}</span>
            </button>
            {langOpen && (
              <div className={styles.dropdown}>
                <button className={styles.dropdownItem} onClick={() => changeLanguage("es")}>
                  <span className={styles.langFlag}>🇪🇸</span> Español
                </button>
                <button className={styles.dropdownItem} onClick={() => changeLanguage("en")}>
                  <span className={styles.langFlag}>🇺🇸</span> English
                </button>
              </div>
            )}
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
                <div className={styles.avatar} aria-hidden>
                  <PersonOutlined sx={{ fontSize: 20 }} />
                </div>
              </button>

              {dropdownOpen && (
                <div className={styles.dropdown} role="menu">
                  <div className={styles.dropdownSection} style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{user.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, fontFamily: "monospace" }}>
                      @{user.username}
                    </div>
                  </div>
                  <div className={styles.dropdownDivider} />
                  <button
                    className={`${styles.dropdownItem} ${styles.logoutBtn}`}
                    role="menuitem"
                    onClick={logout}
                  >
                    <LogoutIcon sx={{ fontSize: 14 }} />
                    {t("sidebar.logout")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ── Main content ── */}
      <main className={`${styles.main} ${collapsed ? styles.collapsed : ""}`}>
        {children}
      </main>
    </div>
  );
}
