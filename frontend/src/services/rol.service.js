import api from './api';

const listar = async () => (await api.get('/roles')).data.data;
const obtener = async (id) => (await api.get(`/roles/${id}`)).data.data;
const crear = async (payload) => (await api.post('/roles', payload)).data.data;
const editar = async (id, payload) => (await api.put(`/roles/${id}`, payload)).data.data;
const cambiarEstado = async (id, estado) => (await api.patch(`/roles/${id}/estado`, { estado })).data.data;
const eliminar = async (id) => (await api.delete(`/roles/${id}`)).data;
const obtenerPermisos = async (id) => (await api.get(`/roles/${id}/permisos`)).data.data;
const asignarPermisos = async (id, permisoIds) =>
  (await api.put(`/roles/${id}/permisos`, { permisos: permisoIds })).data.data;

export default { listar, obtener, crear, editar, cambiarEstado, eliminar, obtenerPermisos, asignarPermisos };
