import api from './api';

const listar = async () => (await api.get('/categorias')).data.data;
const crear = async (payload) => (await api.post('/categorias', payload)).data.data;

export default { listar, crear };
