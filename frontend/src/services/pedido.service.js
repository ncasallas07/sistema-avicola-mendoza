import api from './api';

const listar = async (params) => (await api.get('/pedidos', { params })).data.data;
const obtener = async (id) => (await api.get(`/pedidos/${id}`)).data.data;
const crear = async (payload) => (await api.post('/pedidos', payload)).data.data;
// Devuelve el envoltorio completo {success, message, data} para que la UI
// pueda mostrar el mensaje específico que arma el backend por cada transición
// (ej. "Pedido confirmado correctamente. Se descontó el inventario.").
const cambiarEstado = async (id, estado) => (await api.patch(`/pedidos/${id}/estado`, { estado })).data;

// El comprobante requiere el JWT en el header Authorization, así que no puede
// ser un <a href> directo: se descarga como blob autenticado y se abre en una
// pestaña nueva (o se ofrece para guardar) desde el propio navegador.
const abrirComprobante = async (id, numeroPedido) => {
  const respuesta = await api.get(`/pedidos/${id}/comprobante`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([respuesta.data], { type: 'application/pdf' }));
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.target = '_blank';
  enlace.rel = 'noopener';
  const numero = (numeroPedido || '').replace(/^PED-/, '') || 'comprobante';
  enlace.download = `Comprobante-Pedido-${numero}.pdf`;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  setTimeout(() => window.URL.revokeObjectURL(url), 10000);
};

export default { listar, obtener, crear, cambiarEstado, abrirComprobante };
