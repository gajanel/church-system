/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import API from "./api";

export const getMinistries = () => API.get("/ministries");
export const getMinistry = (id) => API.get(`/ministries/${id}`);
export const createMinistry = (data) => API.post("/ministries", data);
export const updateMinistry = (id, data) => API.put(`/ministries/${id}`, data);
export const deleteMinistry = (id) => API.delete(`/ministries/${id}`);
export const getMinistryRoles = (ministryId) => API.get(`/ministries/${ministryId}/roles`);
export const getMinistryMembers = (ministryId) => API.get(`/ministries/${ministryId}/members`);
export const assignMinistryMember = (ministryId, data) => API.post(`/ministries/${ministryId}/assign`, data);
export const unassignMinistryMember = (memberMinistryId) => API.delete(`/ministries/unassign/${memberMinistryId}`);