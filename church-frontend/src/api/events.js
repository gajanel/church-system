/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import API from "./api";

export const getEvents = (month, year) => {
  const params = {};
  if (month) params.month = month;
  if (year) params.year = year;
  return API.get("/events/", { params });
};
export const getEventsSummary = () => API.get("/events/summary");
export const getUpcomingEvents = (limit = 5) => API.get("/events/upcoming", { params: { limit } });
export const getEvent = (id) => API.get(`/events/${id}`);
export const createEvent = (data) => API.post("/events/", data);
export const updateEvent = (id, data) => API.put(`/events/${id}`, data);
export const deleteEvent = (id) => API.delete(`/events/${id}`);
