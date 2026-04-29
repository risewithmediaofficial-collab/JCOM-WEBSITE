import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API calls
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (memberId, password) => api.post('/auth/login', { memberId, password }),
  changePassword: (oldPassword, newPassword) => api.post('/auth/change-password', { oldPassword, newPassword }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  approveUser: (userId) => api.patch(`/auth/approve/${userId}`),
  rejectUser: (userId, reason) => api.patch(`/auth/reject/${userId}`, { reason })
};

// User API calls
export const userAPI = {
  getProfile: (userId) => api.get(`/users/${userId}`),
  updateProfile: (userId, data) => api.put(`/users/${userId}`, data),
  getAllUsers: (filters) => api.get('/users', { params: filters }),
  getPendingApprovals: () => api.get('/users/pending'),
  searchUsers: (keyword, filters) => api.get('/users/search', { params: { keyword, ...filters } })
};

// Connection API calls
export const connectionAPI = {
  getConnections: () => api.get('/connections'),
  sendRequest: (toUserId) => api.post('/connections', { toUserId }),
  acceptRequest: (connectionId) => api.patch(`/connections/${connectionId}/accept`),
  rejectRequest: (connectionId) => api.patch(`/connections/${connectionId}/reject`),
  disconnectUser: (connectionId) => api.patch(`/connections/${connectionId}/disconnect`)
};

// Deal API calls
export const dealAPI = {
  getDeals: (filters) => api.get('/deals', { params: filters }),
  createDeal: (data) => api.post('/deals', data),
  updateDealStatus: (dealId, status) => api.patch(`/deals/${dealId}`, { status }),
  confirmDeal: (dealId) => api.patch(`/deals/${dealId}/confirm`),
  getDealStats: () => api.get('/deals/stats')
};

// Meeting API calls
export const meetingAPI = {
  getMeetings: (filters) => api.get('/meetings', { params: filters }),
  createMeeting: (data) => api.post('/meetings', data),
  updateMeeting: (meetingId, data) => api.put(`/meetings/${meetingId}`, data),
  markAttendance: (meetingId, userId) => api.post(`/meetings/${meetingId}/attendance`, { userId })
};

// Stats API calls
export const statsAPI = {
  getOverviewStats: () => api.get('/stats/overview'),
  getLocationStats: (location) => api.get(`/stats/location/${location}`),
  getLeaderboard: (period) => api.get('/stats/leaderboard', { params: { period } }),
  getUserStats: (userId) => api.get(`/stats/user/${userId}`)
};

export default api;
