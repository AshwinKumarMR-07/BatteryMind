const API_BASE = '/api';

export const api = {
  // Dashboard
  getDashboardStats: async () => {
    const res = await fetch(`${API_BASE}/dashboard/stats`);
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
  },

  // Batteries
  getBatteries: async (category = '', status = '', search = '') => {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    if (status && status !== 'All') params.append('status', status);
    if (search) params.append('search', search);
    const res = await fetch(`${API_BASE}/batteries?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch batteries');
    return res.json();
  },

  getBattery: async (id) => {
    const res = await fetch(`${API_BASE}/batteries/${id}`);
    if (!res.ok) throw new Error('Failed to fetch battery details');
    return res.json();
  },

  createBattery: async (batteryData) => {
    const res = await fetch(`${API_BASE}/batteries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batteryData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to create battery');
    }
    return res.json();
  },

  // Sensor Readings
  getReadings: async (batteryId, limit = 50) => {
    const res = await fetch(`${API_BASE}/batteries/${batteryId}/readings?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch sensor readings');
    return res.json();
  },

  addReading: async (readingData) => {
    const res = await fetch(`${API_BASE}/readings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(readingData)
    });
    if (!res.ok) throw new Error('Failed to post reading');
    return res.json();
  },

  // AI & Analytics
  getSohEstimation: async (batteryId) => {
    const res = await fetch(`${API_BASE}/ai/soh-estimation/${batteryId}`);
    if (!res.ok) throw new Error('Failed to fetch SOH estimation');
    return res.json();
  },

  getAnomalies: async (batteryId) => {
    const res = await fetch(`${API_BASE}/ai/anomalies/${batteryId}`);
    if (!res.ok) throw new Error('Failed to fetch anomaly records');
    return res.json();
  },

  getForecast: async (batteryId) => {
    const res = await fetch(`${API_BASE}/ai/forecast/${batteryId}`);
    if (!res.ok) throw new Error('Failed to fetch degradation forecast');
    return res.json();
  },

  getXai: async (batteryId) => {
    const res = await fetch(`${API_BASE}/ai/xai/${batteryId}`);
    if (!res.ok) throw new Error('Failed to fetch XAI explanation');
    return res.json();
  },

  // Alerts
  getAlerts: async (severity = '', status = '') => {
    const params = new URLSearchParams();
    if (severity && severity !== 'All') params.append('severity', severity);
    if (status && status !== 'All') params.append('status', status);
    const res = await fetch(`${API_BASE}/alerts?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
  },

  updateAlertStatus: async (alertId, newStatus) => {
    const res = await fetch(`${API_BASE}/alerts/${alertId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    if (!res.ok) throw new Error('Failed to update alert');
    return res.json();
  },

  // Datasets
  getUploadedDatasets: async () => {
    const res = await fetch(`${API_BASE}/uploaded-datasets`);
    if (!res.ok) throw new Error('Failed to fetch uploaded datasets');
    return res.json();
  },

  uploadCsv: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/upload-csv`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'CSV upload failed');
    }
    return res.json();
  },

  // Telemetry Simulation
  simulateTelemetry: async (batteryId) => {
    const res = await fetch(`${API_BASE}/simulate-telemetry/${batteryId}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to simulate telemetry');
    return res.json();
  },

  // Settings
  getSettings: async () => {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  updateSettings: async (settings) => {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  }
};
