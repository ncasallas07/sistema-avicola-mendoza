import api from './api';

export const login = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password });
  return data.data; // { token, usuario }
};

export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } catch {
    // Si el token ya expiró no importa; igual limpiamos la sesión localmente.
  }
};

export const obtenerPerfil = async () => {
  const { data } = await api.get('/auth/me');
  return data.data;
};

// Devuelve siempre el mismo mensaje genérico (ver auth.controller.js): el
// backend nunca revela si el correo existe o no.
export const solicitarRecuperacion = async (email) => {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data.message;
};

export const restablecerPassword = async (token, password) => {
  const { data } = await api.post('/auth/reset-password', { token, password });
  return data.message;
};
