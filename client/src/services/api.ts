import axios from 'axios';
import type {
  NetworkCase,
  Diagnosis,
  DashboardStats,
  HumanReview,
  AuditLog,
  EvaluationData,
} from '../types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getCases = async (): Promise<NetworkCase[]> => {
  const response = await api.get<NetworkCase[]>('/cases');
  return response.data;
};

export const getCaseById = async (id: string): Promise<NetworkCase> => {
  const response = await api.get<NetworkCase>(`/cases/${id}`);
  return response.data;
};

export const diagnoseCase = async (id: string): Promise<Diagnosis> => {
  const response = await api.post<Diagnosis>(`/cases/${id}/diagnose`);
  return response.data;
};

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get<DashboardStats>('/dashboard/stats');
  return response.data;
};

export const getReviews = async (): Promise<HumanReview[]> => {
  const response = await api.get<HumanReview[]>('/reviews');
  return response.data;
};

export const submitReview = async (
  data: Omit<HumanReview, '_id' | 'createdAt'>
): Promise<HumanReview> => {
  const response = await api.post<HumanReview>('/reviews', data);
  return response.data;
};

export const getAuditLogs = async (): Promise<AuditLog[]> => {
  const response = await api.get<AuditLog[]>('/audit');
  return response.data;
};

export const getEvaluation = async (): Promise<EvaluationData> => {
  const response = await api.get<EvaluationData>('/evaluation');
  return response.data;
};

export default api;
