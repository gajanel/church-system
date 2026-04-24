import API from "./api";

export const getAuditLogs = (skip = 0, limit = 100) => 
  API.get(`/audit/?skip=${skip}&limit=${limit}`);
