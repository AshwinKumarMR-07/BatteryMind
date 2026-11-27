const API_BASE = '/api';

const getAuthHeaders = (json = false) => {
  const headers = {};
  if (json) headers['Content-Type'] = 'application/json';
  const token = localStorage.getItem('batterymind_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

const apiFetch = (url, options = {}) => {
  const isJson = options.headers && options.headers['Content-Type'];
  return fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(Boolean(isJson)),
      ...(options.headers || {})
    }
  });
};

export const api = {
  register: async (payload) => {
    const res = await apiFetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Registration failed');
    }
    return res.json();
  },
  login: async (username, password) => {
    const res = await apiFetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Login failed');
    }
    return res.json();
  },
  logout: async () => {
    const token = localStorage.getItem('batterymind_token');
    if (token) {
      await fetch(`${API_BASE}/auth/logout`, { method: 'POST', headers: getAuthHeaders() }).catch(() => {});
    }
    localStorage.removeItem('batterymind_token');
    localStorage.removeItem('batterymind_user');
  },
  getMe: async () => {
    const res = await apiFetch(`${API_BASE}/auth/me`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Authentication session expired');
    return res.json();
  },
  updateProfile: async (payload) => {
    const res = await apiFetch(`${API_BASE}/auth/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to update profile');
    }
    return res.json();
  },
  changePassword: async (payload) => {
    const res = await apiFetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to change password');
    }
    return res.json();
  },
  getUsers: async () => {
    const res = await apiFetch(`${API_BASE}/users`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },
  createUser: async (payload) => {
    const res = await apiFetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to create user');
    }
    return res.json();
  },
  updateUser: async (id, payload) => {
    const res = await apiFetch(`${API_BASE}/users/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to update user');
    }
    return res.json();
  },
  deleteUser: async (id) => {
    const res = await apiFetch(`${API_BASE}/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to delete user');
    }
    return res.json();
  },
  // Dashboard
  getDashboardStats: async () => {
    const res = await apiFetch(`${API_BASE}/dashboard/stats`);
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
  },

  // Batteries
  getBatteries: async (category = '', status = '', search = '') => {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    if (status && status !== 'All') params.append('status', status);
    if (search) params.append('search', search);
    const res = await apiFetch(`${API_BASE}/batteries?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch batteries');
    return res.json();
  },

  getDevices: async () => {
    const res = await apiFetch(`${API_BASE}/devices`);
    if (!res.ok) throw new Error('Failed to fetch registered devices');
    return res.json();
  },

  createDevice: async (deviceData) => {
    const res = await apiFetch(`${API_BASE}/devices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deviceData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to register device');
    }
    return res.json();
  },

  pairDevice: async (deviceId, batteryId) => {
    const res = await apiFetch(`${API_BASE}/devices/${deviceId}/pair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ battery_id: batteryId })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to pair device');
    }
    return res.json();
  },

  revokeDevice: async (deviceId) => {
    const res = await apiFetch(`${API_BASE}/devices/${deviceId}/revoke`, {
      method: 'POST'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to revoke device');
    }
    return res.json();
  },

  getBattery: async (id) => {
    const res = await apiFetch(`${API_BASE}/batteries/${id}`);
    if (!res.ok) throw new Error('Failed to fetch battery details');
    return res.json();
  },

  createBattery: async (batteryData) => {
    const res = await apiFetch(`${API_BASE}/batteries`, {
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
    const res = await apiFetch(`${API_BASE}/batteries/${batteryId}/readings?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch sensor readings');
    return res.json();
  },

  addReading: async (readingData) => {
    const res = await apiFetch(`${API_BASE}/readings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(readingData)
    });
    if (!res.ok) throw new Error('Failed to post reading');
    return res.json();
  },

  // AI & Analytics
  getSohEstimation: async (batteryId) => {
    const res = await apiFetch(`${API_BASE}/ai/soh-estimation/${batteryId}`);
    if (!res.ok) throw new Error('Failed to fetch SOH estimation');
    return res.json();
  },

  getAnomalies: async (batteryId) => {
    const res = await apiFetch(`${API_BASE}/ai/anomalies/${batteryId}`);
    if (!res.ok) throw new Error('Failed to fetch anomaly records');
    return res.json();
  },

  getForecast: async (batteryId) => {
    const res = await apiFetch(`${API_BASE}/ai/forecast/${batteryId}`);
    if (!res.ok) throw new Error('Failed to fetch degradation forecast');
    return res.json();
  },

  getXai: async (batteryId) => {
    const res = await apiFetch(`${API_BASE}/ai/xai/${batteryId}`);
    if (!res.ok) throw new Error('Failed to fetch XAI explanation');
    return res.json();
  },

  // Alerts
  getAlerts: async (severity = '', status = '') => {
    const params = new URLSearchParams();
    if (severity && severity !== 'All') params.append('severity', severity);
    if (status && status !== 'All') params.append('status', status);
    const res = await apiFetch(`${API_BASE}/alerts?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
  },

  updateAlertStatus: async (alertId, newStatus) => {
    const res = await apiFetch(`${API_BASE}/alerts/${alertId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    if (!res.ok) throw new Error('Failed to update alert');
    return res.json();
  },

  // Datasets
  getUploadedDatasets: async () => {
    const res = await apiFetch(`${API_BASE}/uploaded-datasets`);
    if (!res.ok) throw new Error('Failed to fetch uploaded datasets');
    return res.json();
  },

  uploadCsv: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiFetch(`${API_BASE}/upload-csv`, {
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
    const res = await apiFetch(`${API_BASE}/simulate-telemetry/${batteryId}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to simulate telemetry');
    return res.json();
  },

  // Settings
  getSettings: async () => {
    const res = await apiFetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  updateSettings: async (settings) => {
    const res = await apiFetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  }
};
