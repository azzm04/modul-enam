// app/src/services/api.js - Updated with Authentication
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './config.js';

class ApiService {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async getAuthHeaders() {
    const token = await AsyncStorage.getItem('supabase_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  async request(endpoint, options = {}) {
    const headers = await this.getAuthHeaders();
    const url = `${this.baseURL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Public endpoints (no auth required)
  async getSensorReadings() {
    return this.request('/api/readings');
  }

  async getLatestReading() {
    return this.request('/api/readings/latest');
  }

  async getThresholds() {
    return this.request('/api/thresholds');
  }

  async getLatestThreshold() {
    return this.request('/api/thresholds/latest');
  }

  // Protected endpoints (auth required)
  async createThreshold(data) {
    return this.request('/api/thresholds', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createReading(data) {
    return this.request('/api/readings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendNotification(data) {
    return this.request('/api/notifications/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const Api = new ApiService(API_URL);