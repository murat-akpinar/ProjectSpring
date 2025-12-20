import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      const errorUrl = error.config?.url || '';
      
      // Only auto-redirect for /auth/me endpoint (token validation)
      // This means the token is invalid/expired
      if (errorUrl.includes('/auth/me')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (currentPath !== '/login') {
          window.location.href = '/login';
        }
      }
      // For all other endpoints, don't auto-redirect
      // Let the component handle the error (might be permission issue, not auth issue)
    }
    return Promise.reject(error);
  }
);

export default api;

