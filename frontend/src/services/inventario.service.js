import api from './api';

const listarExistencias = async (params) => (await api.get('/inventario', { params })).data.data;
const listarMovimientos = async (params) => (await api.get('/inventario/movimientos', { params })).data.data;
const registrarEntrada = async (payload) => (await api.post('/inventario/entrada', payload)).data.data;
const registrarSalida = async (payload) => (await api.post('/inventario/salida', payload)).data.data;

export default { listarExistencias, listarMovimientos, registrarEntrada, registrarSalida };
