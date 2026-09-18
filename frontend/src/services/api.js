import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      const rutaActual = window.location.pathname;
      if (error.response.status === 401 && rutaActual !== '/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        window.location.href = '/login';
      }
    }
    const mensaje = error.response?.data?.message || 'Ocurrió un error de comunicación con el servidor';
    return Promise.reject(new Error(mensaje));
  }
);

export default api;
