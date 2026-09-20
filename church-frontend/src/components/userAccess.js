export const USER_MODULES = [
  { id: "dashboard", label: "Inicio", description: "Panel principal y resumen general" },
  { id: "members", label: "Miembros", description: "Directorio y fichas de miembros" },
  { id: "ministries", label: "Administrar ministerios", description: "Configuración general de ministerios" },
  {
    id: "finance", label: "Finanzas", description: "Operaciones y control financiero", children: [
      { id: "finance.cash", label: "Caja general" },
      { id: "finance.offerings", label: "Ofrendas" },
      { id: "finance.incomes", label: "Ingresos" },
      { id: "finance.expenses", label: "Gastos" },
      { id: "finance.goals", label: "Metas" },
      { id: "finance.deposits", label: "Boletas" }
    ]
  },
  { id: "projects", label: "Proyectos", description: "Proyectos y seguimiento" },
  { id: "events", label: "Eventos", description: "Calendario y actividades" },
  { id: "privileges", label: "Privilegios", description: "Programación de participación" },
  { id: "announcements", label: "Anuncios", description: "Contenido para proyección" },
  {
    id: "reports", label: "Reportes", description: "Consultas e informes", children: [
      { id: "reports.monthly", label: "Balance mensual" },
      { id: "reports.annual", label: "Corte anual" },
      { id: "reports.members", label: "Demográfico" },
      { id: "reports.projects", label: "Obras misioneras" },
      { id: "reports.contributions", label: "Aportes de miembros" },
      { id: "reports.attendance", label: "Asistencia" },
      { id: "reports.ministries", label: "Ministerios" }
    ]
  },
  { id: "attendance", label: "Asistencia", description: "Registro de cultos y reuniones" }
];

export const getUserModuleLabel = (moduleId, ministries = []) => {
  for (const module of USER_MODULES) {
    if (module.id === moduleId) return module.label;
    const child = (module.children || []).find(item => item.id === moduleId);
    if (child) return child.label;
  }
  if (moduleId.startsWith("ministry.")) {
    const ministryId = Number(moduleId.replace("ministry.", ""));
    return ministries.find(ministry => ministry.id === ministryId)?.name || "Ministerio no disponible";
  }
  if (moduleId === "workspace") return "Todos los ministerios";
  return moduleId;
};

export const userHasModuleAccess = (user, moduleId) => {
  if (!user) return false;
  if (user.is_admin || user.is_super_admin) return true;

  const modules = user.modules || [];
  if (!moduleId.includes(".")) return modules.includes(moduleId);

  const parent = moduleId.split(".")[0];
  if (modules.includes(moduleId)) return true;

  const hasScopedChildren = modules.some(item => item.startsWith(`${parent}.`));
  return modules.includes(parent) && !hasScopedChildren;
};
