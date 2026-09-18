import api from './api';

const obtener = async (params) => (await api.get('/dashboard', { params })).data.data;

export default { obtener };
