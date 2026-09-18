import axios from 'axios';

const API_PORT = window.location.port === '5173' ? '8081' : (window.location.port || '8081');
const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:${API_PORT}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT token in Authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
