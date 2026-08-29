/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import api from "./api";

export const getStrategicPlan = () => {
  return api.get("/strategic-plan");
};

export const updateStrategicPlanArea = (areaId, data) => {
  return api.put(`/strategic-plan/${areaId}`, data);
};
