import api from './api';

const RUTAS = {
  ventas: '/reportes/ventas',
  pedidos: '/reportes/pedidos',
  ventasPorVendedor: '/reportes/ventas-por-vendedor',
  productosMasVendidos: '/reportes/productos-mas-vendidos',
  inventario: '/reportes/inventario',
  stockBajo: '/reportes/stock-bajo',
  clientesPorZona: '/reportes/clientes-por-zona'
};

const obtener = async (clave, params) => (await api.get(RUTAS[clave], { params })).data.data;

// El CSV también requiere el JWT en el header, así que se descarga como blob
// autenticado en vez de enlazar directamente a la URL del backend.
const descargarCSV = async (clave, params, nombreArchivo) => {
  const respuesta = await api.get(RUTAS[clave], {
    params: { ...params, formato: 'csv' },
    responseType: 'blob'
  });
  const url = window.URL.createObjectURL(new Blob([respuesta.data], { type: 'text/csv' }));
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `${nombreArchivo}.csv`;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  setTimeout(() => window.URL.revokeObjectURL(url), 10000);
};

export default { obtener, descargarCSV };
