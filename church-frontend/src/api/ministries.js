import API from "./api";

export const getMinistries = () => API.get("/ministries");
export const getMinistry = (id) => API.get(`/ministries/${id}`);
export const createMinistry = (data) => API.post("/ministries", data);
export const updateMinistry = (id, data) => API.put(`/ministries/${id}`, data);
export const deleteMinistry = (id) => API.delete(`/ministries/${id}`);
export const getMinistryRoles = (ministryId) => API.get(`/ministries/${ministryId}/roles`);