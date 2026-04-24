import API from "./api";
import { API_URL } from "./api";

/** Obtiene la configuración global del sistema. */
export const getSettings = () => API.get("/settings");

/** Obtiene la configuración global (público, sin auth). */
export const getPublicSettings = () => API.get("/settings/public");

/** Actualiza la configuración global. Solo admins. */
export const updateSettings = (data) => API.put("/settings", data);

/** Resetea la configuración a valores de fábrica. */
export const factoryReset = () => API.post("/settings/factory-reset");

/** Descarga un backup JSON de la base de datos. */
export const downloadBackup = async () => {
  const token = localStorage.getItem("token");
  const baseUrl = API_URL;
  const res = await fetch(`${baseUrl}/settings/backup`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Error al generar backup");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  a.href = url;
  a.download = `backup_sistema_${timestamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
