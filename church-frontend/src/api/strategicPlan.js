import api from "./api";

export const getStrategicPlan = () => {
  return api.get("/strategic-plan");
};

export const updateStrategicPlanArea = (areaId, data) => {
  return api.put(`/strategic-plan/${areaId}`, data);
};
