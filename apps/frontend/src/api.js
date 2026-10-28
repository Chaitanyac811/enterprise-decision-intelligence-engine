/**
 * Frontend API client
 * Communicates with Node.js Express Backend
 */

const API_BASE = '/api';

async function fetchJson(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}: Failed to fetch ${endpoint}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`API Fetch Error [${endpoint}]:`, err.message);
    throw err;
  }
}

function buildQueryString(params = {}) {
  const q = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== '' && val !== 'All') {
      q.append(key, val);
    }
  }
  const str = q.toString();
  return str ? `?${str}` : '';
}

export const api = {
  // Health
  getHealth: () => fetchJson('/health'),

  // Analytics & KPIs
  getKpis: (filters) => fetchJson(`/analytics/kpi${buildQueryString(filters)}`),
  getTrends: (filters) => fetchJson(`/analytics/trends${buildQueryString(filters)}`),
  getCategories: (filters) => fetchJson(`/analytics/categories${buildQueryString(filters)}`),
  getRegions: (filters) => fetchJson(`/analytics/regions${buildQueryString(filters)}`),
  getTopProducts: (filters, limit = 10) => fetchJson(`/analytics/top-products${buildQueryString({ ...filters, limit })}`),

  // Anomaly Detection & Inspection
  getAnomalies: (filters) => fetchJson(`/analytics/anomalies${buildQueryString(filters)}`),
  inspectAnomalyDate: (date) => fetchJson(`/analytics/anomalies/inspect?date=${date}`),

  // Sales Forecasting
  getForecast: (filters, horizon = 7) => fetchJson(`/analytics/forecast${buildQueryString({ ...filters, horizon })}`),

  // Business Recommendations
  getRecommendations: (filters) => fetchJson(`/analytics/recommendations${buildQueryString(filters)}`),

  // Transactions Explorer
  getTransactions: (params) => fetchJson(`/transactions${buildQueryString(params)}`),

  // Data Ingestion & ETL
  uploadCsv: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/ingest/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Upload failed with status ${res.status}`);
    }
    return await res.json();
  },
  getIngestionHistory: () => fetchJson('/ingest/history'),
  getSampleCsvUrl: () => `${API_BASE}/data/sample-csv`,
};
