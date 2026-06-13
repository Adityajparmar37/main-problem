import api from './axiosInstance';

export const analyticsApi = {
  getOverview: () => api.get('/analytics/overview'),
  getTrends: () => api.get('/analytics/trends'),
  getReport: () => api.get('/analytics/report'),
};
