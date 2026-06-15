import axios from 'axios';

// Dynamically determine the base URL
const baseURL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : `${window.location.origin}/api`);

const client = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Automatically inject Token and Company Code
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const companyCode = localStorage.getItem('companyCode');
    if (companyCode) {
      config.headers['X-Company-Code'] = companyCode;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle errors globally
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Session expired or unauthorized
      if (error.response.status === 401 && !window.location.pathname.endsWith('/login')) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        // Redirect to login page
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default client;
