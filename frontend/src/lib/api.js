import axios from 'axios';

const STORAGE_KEY = 'logistikapp.session';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const session = JSON.parse(raw);
      if (session?.token) {
        config.headers.Authorization = `Bearer ${session.token}`;
      }
    }
  } catch {
    // ignore
  }
  return config;
});

export default api;
