import api from './api';

const listar = async () => (await api.get('/permisos')).data.data;

export default { listar };
