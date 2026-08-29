/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import API from "./api";

export const getProjects = () => API.get("/projects/");
export const getProjectsSummary = () => API.get("/projects/summary");
export const getProject = (id) => API.get(`/projects/${id}`);
export const createProject = (data) => API.post("/projects/", data);
export const updateProject = (id, data) => API.put(`/projects/${id}`, data);
export const deleteProject = (id) => API.delete(`/projects/${id}`);
