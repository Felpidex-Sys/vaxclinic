import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Configuração da API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Criar instância do axios
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor para adicionar token JWT automaticamente
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('vaxclinic_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros de resposta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('vaxclinic_token');
      localStorage.removeItem('vaxclinic_user');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export default api;
