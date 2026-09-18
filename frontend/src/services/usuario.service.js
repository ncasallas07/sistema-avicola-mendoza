import api from './api';

const listar = async () => (await api.get('/usuarios')).data.data;
const crear = async (payload) => (await api.post('/usuarios', payload)).data.data;
const editar = async (id, payload) => (await api.put(`/usuarios/${id}`, payload)).data.data;
const cambiarEstado = async (id, estado) =>
  (await api.patch(`/usuarios/${id}/estado`, { estado })).data.data;

export default { listar, crear, editar, cambiarEstado };
