/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import API from "./api";

export const getAuditLogs = (skip = 0, limit = 100) => 
  API.get(`/audit/?skip=${skip}&limit=${limit}`);
