import axios from 'axios';

// Local dev: set VITE_API_URL=http://localhost:5000 in client/.env
const BASE_URL =
  import.meta.env.VITE_API_URL || 'https://ca-client-tracker-1.onrender.com';
const api = axios.create({
  baseURL: `${String(BASE_URL).replace(/\/$/, '')}/api`,
  withCredentials: true,
});

const unwrap = (res) => res?.data?.data ?? res?.data;

/** API list responses use different keys (`clients`, `services`, …) — normalize for the UI. */
function withItems(payload, arrayKeys) {
  if (!payload || typeof payload !== 'object') return payload;
  if (Array.isArray(payload)) return { items: payload };
  if (Array.isArray(payload.items)) return payload;
  for (const key of arrayKeys) {
    if (Array.isArray(payload[key])) {
      return { ...payload, items: payload[key] };
    }
  }
  return { ...payload, items: [] };
}

export const login = async (payload) => unwrap(await api.post('/auth/login', payload));
export const logout = async () => unwrap(await api.post('/auth/logout'));
export const getMe = async () => unwrap(await api.get('/auth/me'));

export const getClients = async (params) =>
  withItems(unwrap(await api.get('/clients', { params })), ['clients']);

export const getClient = async (clientId) => {
  const d = unwrap(await api.get(`/clients/${clientId}`));
  return d?.client ?? d;
};
export const createClient = async (payload) => unwrap(await api.post('/clients', payload));
export const updateClient = async ({ id, payload }) => unwrap(await api.put(`/clients/${id}`, payload));
export const deleteClient = async (id) => unwrap(await api.delete(`/clients/${id}`));
export const getServices = async (params) =>
  withItems(unwrap(await api.get('/services', { params })), ['services']);
export const createService = async (payload) => unwrap(await api.post('/services', payload));
export const updateService = async ({ id, payload }) =>
  unwrap(await api.put(`/services/${id}`, payload));
export const deleteService = async (id) => unwrap(await api.delete(`/services/${id}`));

export const getClientServices = async (clientId) => {
  const d = unwrap(await api.get(`/client-services/client/${clientId}`));
  const services = d?.services ?? [];
  return { ...d, items: services, services };
};

/** All firm client↔service links (for Clients table service filter). */
export const listClientServiceLinks = async (params) =>
  withItems(unwrap(await api.get('/client-services', { params })), ['clientServices']);

export const getBillingMatrix = async (fy) =>
  unwrap(await api.get('/billing/matrix', { params: { fy } }));
export const generateBilling = async (payload) => unwrap(await api.post('/billing/generate', payload));
export const getBillingEntries = async (params) =>
  withItems(unwrap(await api.get('/billing', { params })), ['billings']);
export const getBillingStats = async (params) => unwrap(await api.get('/billing/stats', { params }));
export const getPayments = async (params) =>
  withItems(unwrap(await api.get('/payments', { params })), ['payments']);
export const getPaymentStats = async (params) => unwrap(await api.get('/payments/stats', { params }));
export const recordPayment = async (payload) => unwrap(await api.post('/payments', payload));

export default api;
