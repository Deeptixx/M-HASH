import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('[DependLock API Error]', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Ecosystem
export const fetchEcosystem = () => apiClient.get('/ecosystem');
export const uploadEcosystem = (file) => {
  const fd = new FormData();
  fd.append('file', file);
  return apiClient.post('/ecosystem/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
};
export const resetEcosystem = () => apiClient.post('/ecosystem/reset');

// Dashboard
export const fetchDashboardSummary = () => apiClient.get('/dashboard/summary');

// Risk
export const fetchAllPackages = () => apiClient.get('/risk/packages');
export const fetchHotspots = (limit = 10) => apiClient.get(`/risk/hotspots?limit=${limit}`);
export const fetchPackageRisk = (packageId) => apiClient.get(`/risk/packages/${packageId}`);
export const fetchPackageLockin = (packageId) => apiClient.get(`/risk/packages/${packageId}/lockin`);

// Simulation
export const simulateCompromise = (packageId) =>
  apiClient.post('/simulate', { package_id: packageId });

// Mitigation
export const evaluateMitigations = (packageId, budget = {}) =>
  apiClient.post('/mitigation/evaluate', {
    package_id: packageId,
    ...budget,
  });

export const fetchBeforeAfter = (packageId, strategy) =>
  apiClient.get(`/resilience/before-after?package_id=${packageId}&strategy=${strategy}`);
