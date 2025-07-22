import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any auth tokens here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

// Teams API
export const teamsAPI = {
  getAll: () => api.get("/teams"),
  getById: (id) => api.get(`/teams/${id}`),
  create: (data) => api.post("/teams", data),
  update: (id, data) => api.put(`/teams/${id}`, data),
  delete: (id) => api.delete(`/teams/${id}`),
  getHierarchy: (id) => api.get(`/teams/${id}/hierarchy`),
};

// Users API
export const usersAPI = {
  getAll: () => api.get("/users"),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post("/users", data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getByRole: (role) => api.get(`/users/role/${role}`),
  search: (query) => api.get(`/users/search/${query}`),
  updateRole: (id, app_role) => api.put(`/users/${id}/role`, { app_role }),
  assignTeamLead: (data) => api.put("/users/assign-lead", data),
};

// Team Members API
export const teamMembersAPI = {
  getAll: () => api.get("/team-members"),
  getByTeam: (teamId) => api.get(`/team-members/team/${teamId}`),
  add: (data) => api.post("/team-members", data),
  remove: (id, data) => api.put(`/team-members/${id}/remove`, data),
  move: (id, data) => api.put(`/team-members/${id}/move`, data),
  getHistory: (userId) => api.get(`/team-members/user/${userId}/history`),
  getStats: (teamId) => api.get(`/team-members/team/${teamId}/stats`),
};

// Skills API
export const skillsAPI = {
  getAll: () => api.get("/skills"),
  getById: (id) => api.get(`/skills/${id}`),
  create: (data) => api.post("/skills", data),
  update: (id, data) => api.put(`/skills/${id}`, data),
  delete: (id) => api.delete(`/skills/${id}`),
  addToUser: (userId, data) => api.post(`/skills/user/${userId}`, data),
  updateUserSkill: (userId, skillId, data) =>
    api.put(`/skills/user/${userId}/${skillId}`, data),
  removeFromUser: (userId, skillId) =>
    api.delete(`/skills/user/${userId}/${skillId}`),
  getByCategory: (category) => api.get(`/skills/category/${category}`),
};

// Capabilities API
export const capabilitiesAPI = {
  getAll: () => api.get("/capabilities"),
  getById: (id) => api.get(`/capabilities/${id}`),
  create: (data) => api.post("/capabilities", data),
  update: (id, data) => api.put(`/capabilities/${id}`, data),
  delete: (id) => api.delete(`/capabilities/${id}`),
  addToTeam: (teamId, data) => api.post(`/capabilities/team/${teamId}`, data),
  updateTeamCapability: (teamId, capabilityId, data) =>
    api.put(`/capabilities/team/${teamId}/${capabilityId}`, data),
  removeFromTeam: (teamId, capabilityId) =>
    api.delete(`/capabilities/team/${teamId}/${capabilityId}`),
};

// Availability API
export const availabilityAPI = {
  getAll: () => api.get("/availability"),
  getByUser: (userId) => api.get(`/availability/user/${userId}`),
  getCurrent: (userId) => api.get(`/availability/user/${userId}/current`),
  create: (data) => api.post("/availability", data),
  update: (id, data) => api.put(`/availability/${id}`, data),
  delete: (id) => api.delete(`/availability/${id}`),
  getTeamSummary: (teamId) => api.get(`/availability/team/${teamId}/summary`),
};

// Hierarchy API
export const hierarchyAPI = {
  getAll: () => api.get("/hierarchy"),
  getByTeam: (teamId) => api.get(`/hierarchy/team/${teamId}`),
  create: (data) => api.post("/hierarchy", data),
  delete: (parentId, childId) =>
    api.delete(`/hierarchy/${parentId}/${childId}`),
  getRoots: () => api.get("/hierarchy/roots"),
  getLeaves: () => api.get("/hierarchy/leaves"),
};

// Changes API
export const changesAPI = {
  getAll: () => api.get("/changes"),
  getByStatus: (status) => api.get(`/changes/status/${status}`),
  getById: (id) => api.get(`/changes/${id}`),
  create: (data) => api.post("/changes", data),
  approve: (id, data) => api.put(`/changes/${id}/approve`, data),
  reject: (id, data) => api.put(`/changes/${id}/reject`, data),
  getPendingCount: () => api.get("/changes/pending/count"),
};

// Audit API
export const auditAPI = {
  getAll: () => api.get("/audit"),
  getByTable: (tableName) => api.get(`/audit/table/${tableName}`),
  getByRecord: (tableName, recordId) =>
    api.get(`/audit/record/${tableName}/${recordId}`),
  getByUser: (userId) => api.get(`/audit/user/${userId}`),
  getByDateRange: (startDate, endDate) =>
    api.get("/audit/date-range", { params: { startDate, endDate } }),
  getSummary: () => api.get("/audit/summary"),
  getRecent: (limit) => api.get("/audit/recent", { params: { limit } }),
};

export default api;
