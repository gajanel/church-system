import API from "./api.jsx";

export const getAnnouncements = () => API.get("/announcements");
export const createAnnouncement = (data) => API.post("/announcements", data);
export const updateAnnouncement = (id, data) => API.put(`/announcements/${id}`, data);
export const deleteAnnouncement = (id) => API.delete(`/announcements/${id}`);
export const publishAnnouncement = (id) => API.post(`/announcements/${id}/publish`);
export const publishWeeklyProgram = (weekStart) => API.post(`/announcements/publish/weekly_program?week_start=${weekStart}`);
export const publishPlaylist = (ids) => API.post("/announcements/publish/playlist", ids);
