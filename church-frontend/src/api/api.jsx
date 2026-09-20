import axios from "axios";

export const API_URL = (import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? `${window.location.protocol}//${window.location.hostname}:8000` : window.location.origin)).replace(/\/$/, "");
export const WS_URL = API_URL.replace(/^http/, "ws");
const API = axios.create({ baseURL: API_URL, timeout: 30000 });
let refreshPromise = null;

function clearSession() {
  ["token", "refresh_token", "user"].forEach(key => localStorage.removeItem(key));
  if (window.location.pathname !== "/login") window.location.assign("/login");
}

API.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(response => response, async error => {
  const original = error.config;
  if (error.response?.status !== 401 || !original) return Promise.reject(error);
  if (original._retry) {
    clearSession();
    return Promise.reject(error);
  }
  original._retry = true;
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) {
    clearSession();
    return Promise.reject(error);
  }
  try {
    // Share one refresh request when several API calls expire together.
    if (!refreshPromise) {
      refreshPromise = axios.post(`${API_URL}/auth/refresh`, {
        refresh_token: refreshToken,
      }, { timeout: 15000 }).then(({ data }) => {
        if (!data.access_token) throw new Error("Respuesta de sesión inválida");
        // A completed logout must not be reversed by an in-flight refresh.
        if (localStorage.getItem("refresh_token") !== refreshToken) throw new Error("La sesión cambió");
        localStorage.setItem("token", data.access_token);
        return data.access_token;
      }).finally(() => { refreshPromise = null; });
    }
    const token = await refreshPromise;
    original.headers.Authorization = `Bearer ${token}`;
    return API(original);
  } catch (refreshError) {
    if (refreshError.response?.status === 401 || refreshError.response?.status === 403) clearSession();
    return Promise.reject(refreshError);
  }
});

export default API;
