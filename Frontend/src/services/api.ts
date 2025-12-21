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
    } else {
      console.warn('No token found in localStorage for request:', config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle 401 and 403 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const currentPath = window.location.pathname;
    const errorUrl = error.config?.url || '';
    const token = localStorage.getItem('token');
    
    if (status === 401) {
      // Don't log errors for log endpoint to avoid infinite loop
      if (!errorUrl.includes('/admin/logs/system/frontend')) {
        console.error('401 Unauthorized error:', {
          url: errorUrl,
          path: currentPath,
          hasToken: !!token,
          tokenPreview: token ? token.substring(0, 20) + '...' : 'null'
        });
      }
      
      // Only auto-redirect for /auth/me endpoint (token validation)
      // This means the token is invalid/expired
      if (errorUrl.includes('/auth/me')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (currentPath !== '/login') {
          window.location.href = '/login';
        }
      }
      // For admin endpoints, don't auto-redirect in interceptor
      // Let the component handle the error and show appropriate message
      // The component will check if token exists and handle accordingly
    } else if (status === 403) {
      console.error('403 Forbidden error:', {
        url: errorUrl,
        path: currentPath,
        hasToken: !!token
      });
      
      // 403 means user is authenticated but doesn't have permission
      // Don't redirect, let component show error message
    }
    
    return Promise.reject(error);
  }
);

export default api;

