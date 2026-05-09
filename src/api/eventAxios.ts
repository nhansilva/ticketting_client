import axios from 'axios';
import { useAuthStore } from '../store/auth.store';

const EVENT_BASE_URL = import.meta.env.VITE_EVENT_API_URL ?? 'http://localhost:8082';

export const eventAxiosInstance = axios.create({
  baseURL: EVENT_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

eventAxiosInstance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

eventAxiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
