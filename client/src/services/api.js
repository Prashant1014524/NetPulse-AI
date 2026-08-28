import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getCases = async () => {
  const response = await api.get('/cases');
  return response.data;
};

export const getCaseById = async (id) => {
  const response = await api.get(`/cases/${id}`);
  return response.data;
};

export const diagnoseCase = async (id) => {
  const response = await api.post(`/cases/${id}/diagnose`);
  return response.data;
};

export const getDashboardStats = async () => {
  const response = await api.get('/dashboard/stats');
  return response.data;
};

export const getReviews = async () => {
  const response = await api.get('/reviews');
  return response.data;
};

export const submitReview = async (reviewData) => {
  const response = await api.post('/reviews', reviewData);
  return response.data;
};

export const getAuditLogs = async () => {
  const response = await api.get('/audit');
  return response.data;
};

export const getEvaluation = async () => {
  const response = await api.get('/evaluation');
  return response.data;
};

export default api;
