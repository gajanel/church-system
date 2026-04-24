import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:8000`;

const API = axios.create({
  baseURL: API_URL,
});

// Interceptor para agregar el token de acceso a cada petición
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar la expiración del token (401)
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si el error es 401 y no hemos re-intentado ya la petición
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refresh_token");

      if (refreshToken) {
        try {
          // Intentar obtener un nuevo access_token
          const res = await axios.post(`${API_URL}/auth/refresh`, {
            refresh_token: refreshToken
          });

          if (res.status === 200) {
            const { access_token } = res.data;
            localStorage.setItem("token", access_token);
            
            // Re-intentar la petición original con el nuevo token
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return API(originalRequest);
          }
        } catch (refreshError) {
          // Si falla el refresco (ej. refresh_token expiró), cerramos sesión
          localStorage.removeItem("token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("user");
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      } else {
        // No hay refresh token, redirigir al login
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default API;