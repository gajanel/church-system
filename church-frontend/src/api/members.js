import API from "./api";

export const getMembers = (page = 1, size = 50) => API.get(`/members?page=${page}&size=${size}`);
export const getMember = (id) => API.get(`/members/${id}`);
export const createMember = (data) => API.post("/members", data);
export const updateMember = (id, data) => API.put(`/members/${id}`, data);
export const deleteMember = (id) => API.delete(`/members/${id}`);
export const getMemberMinistries = (id) => API.get(`/members/${id}/ministries`);
export const assignMinistry = (id, data) => API.post(`/members/${id}/ministries`, data);
export const removeMinistry = (memberId, memberMinistryId) =>
  API.delete(`/members/${memberId}/ministries/${memberMinistryId}`);

export const uploadMemberPhoto = (id, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return API.post(`/members/${id}/photo`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};