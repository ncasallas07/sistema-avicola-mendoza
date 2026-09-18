import api from './api';

// Fábrica de servicios CRUD: todos los módulos (clientes, proveedores,
// productos, usuarios) exponen la misma forma de endpoints en el backend.
export const crearRecursoCRUD = (base) => ({
  listar: async (params) => (await api.get(base, { params })).data.data,
  obtener: async (id) => (await api.get(`${base}/${id}`)).data.data,
  crear: async (payload) => (await api.post(base, payload)).data.data,
  editar: async (id, payload) => (await api.put(`${base}/${id}`, payload)).data.data,
  cambiarEstado: async (id, estado) => (await api.patch(`${base}/${id}/estado`, { estado })).data.data
});
