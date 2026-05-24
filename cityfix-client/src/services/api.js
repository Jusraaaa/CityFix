import { getStoredAuth } from './authStorage.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5125';

async function request(path, options = {}) {
  const auth = getStoredAuth();
  const authHeaders = auth?.token ? { Authorization: `Bearer ${auth.token}` } : {};

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  login: (payload) => request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  register: (payload) => request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getDashboardSummary: () => request('/api/dashboard/summary'),
  getIncidentsByCategory: () => request('/api/dashboard/incidents-by-category'),
  getIncidentsByMunicipality: () => request('/api/dashboard/incidents-by-municipality'),
  getIncidents: () => request('/api/incidents'),
  getMyReports: () => request('/api/incidents/my-reports'),
  getIncident: (id) => request(`/api/incidents/${encodeURIComponent(id)}`),
  getIncidentStatusHistory: (id) => request(`/api/incidents/${encodeURIComponent(id)}/status-history`),
  updateIncidentStatus: (id, status, adminNote = '', resolution = {}) => request(`/api/incidents/${encodeURIComponent(id)}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, adminNote, ...resolution })
  }),
  createIncident: (payload) => request('/api/incidents', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getCategories: () => request('/api/categories'),
  createCategory: (payload) => request('/api/categories', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getMunicipalities: () => request('/api/municipalities'),
  createMunicipality: (payload) => request('/api/municipalities', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getAdmins: () => request('/api/admins'),
  createAdmin: (payload) => request('/api/admins', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  updateAdmin: (id, payload) => request(`/api/admins/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),
  deactivateAdmin: (id) => request(`/api/admins/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  })
};
