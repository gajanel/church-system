import API from "./api";

export const getPrivilegeCatalog    = ()              => API.get("/privileges/catalog");
export const getPrivilegeTypes      = ()              => API.get("/privileges/types");
export const createPrivilegeType    = (data)          => API.post("/privileges/types", data);
export const updatePrivilegeType    = (id, data)      => API.put(`/privileges/types/${id}`, data);
export const deletePrivilegeType    = (id)            => API.delete(`/privileges/types/${id}`);

export const getAllProfiles          = ()              => API.get("/privileges/profiles");
export const getMemberPrivileges    = (memberId)      => API.get(`/privileges/profiles/${memberId}`);
export const addMemberPrivilege     = (data)          => API.post("/privileges/profiles", data);
export const removeMemberPrivilege  = (memberId, priv)=> API.delete(`/privileges/profiles/${memberId}/${encodeURIComponent(priv)}`);

export const getSchedule            = (weekStart)     => API.get(`/privileges/schedule?week_start=${weekStart}`);
export const autoGenerateSchedule   = (data)          => API.post("/privileges/schedule/auto", data);
export const updateScheduleEntry    = (id, memberId, notes) =>
  API.put(`/privileges/schedule/${id}?member_id=${memberId}${notes ? `&notes=${encodeURIComponent(notes)}` : ""}`);
export const deleteSchedule         = (weekStart)     => API.delete(`/privileges/schedule?week_start=${weekStart}`);

export const getServiceDaysConfig   = ()              => API.get("/privileges/config/days");
export const updateServiceDayConfig = (name, is_gen)  => API.put(`/privileges/config/days/${name}`, { is_general: is_gen });
