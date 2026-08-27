import api from "./api";

const BASE = (id) => `/ministry-workspace/${id}`;

// ── Config ──────────────────────────────────────────────
export const listMinistryWorkspaces  = ()           => api.get("/ministry-workspace/list");
export const getModuleConfig         = (id)         => api.get(`${BASE(id)}/config`);
export const updateModuleConfig      = (id, data)   => api.put(`${BASE(id)}/config`, data);

// ── Finance ─────────────────────────────────────────────
export const getMinistryFinance      = (id)         => api.get(`${BASE(id)}/finance`);
export const createMinistryFinance   = (id, data)   => api.post(`${BASE(id)}/finance`, data);
export const deleteMinistryFinance   = (id, recId)  => api.delete(`${BASE(id)}/finance/${recId}`);

// ── Attendance ───────────────────────────────────────────
export const getMinistryAttendance   = (id)         => api.get(`${BASE(id)}/attendance`);
export const createAttendanceSession = (id, data)   => api.post(`${BASE(id)}/attendance`, data);
export const saveAttendanceRecords   = (id, sessId, data) => api.post(`${BASE(id)}/attendance/${sessId}/records`, data);
export const deleteAttendanceSession = (id, sessId) => api.delete(`${BASE(id)}/attendance/${sessId}`);

// ── Work Plans ───────────────────────────────────────────
export const getMinistryPlans        = (id)         => api.get(`${BASE(id)}/plans`);
export const createMinistryPlan      = (id, data)   => api.post(`${BASE(id)}/plans`, data);
export const updateMinistryPlan      = (id, planId, data) => api.put(`${BASE(id)}/plans/${planId}`, data);
export const deleteMinistryPlan      = (id, planId) => api.delete(`${BASE(id)}/plans/${planId}`);
export const addPlanTask             = (id, planId, data) => api.post(`${BASE(id)}/plans/${planId}/tasks`, data);
export const togglePlanTask          = (id, planId, taskId) => api.patch(`${BASE(id)}/plans/${planId}/tasks/${taskId}`);
export const deletePlanTask          = (id, planId, taskId) => api.delete(`${BASE(id)}/plans/${planId}/tasks/${taskId}`);

// ── Gallery ──────────────────────────────────────────────
export const getMinistryGallery      = (id)         => api.get(`${BASE(id)}/gallery`);
export const uploadGalleryItem       = (id, formData) => api.post(`${BASE(id)}/gallery`, formData, {
  headers: { "Content-Type": "multipart/form-data" }
});
export const deleteGalleryItem       = (id, itemId) => api.delete(`${BASE(id)}/gallery/${itemId}`);

// ── Monthly Reports ──────────────────────────────────────
export const getMonthlyReports       = (id)         => api.get(`${BASE(id)}/monthly-reports`);
export const createMonthlyReport     = (id, formData) => api.post(`${BASE(id)}/monthly-reports`, formData, {
  headers: { "Content-Type": "multipart/form-data" }
});
export const deleteMonthlyReport     = (id, reportId) => api.delete(`${BASE(id)}/monthly-reports/${reportId}`);
export const getAllMonthlyReports     = (params = {}) => api.get("/ministry-workspace/all-monthly-reports", { params });
