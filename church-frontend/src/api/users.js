/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import API from "./api";

export const getUsers = () => API.get("/auth/users");
export const createUser = (data) => API.post("/auth/users", data);
export const updateUser = (id, data) => API.put(`/auth/users/${id}`, data);
export const deleteUser = (id) => API.delete(`/auth/users/${id}`);
export const changePassword = (data) => API.post("/auth/change-password", data);