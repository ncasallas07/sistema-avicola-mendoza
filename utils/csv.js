const aCSV = (filas) => {
  if (!filas.length) return '';
  const columnas = Object.keys(filas[0]);
  const escapar = (valor) => `"${String(valor ?? '').replace(/"/g, '""')}"`;
  const encabezado = columnas.join(',');
  const cuerpo = filas.map((fila) => columnas.map((c) => escapar(fila[c])).join(',')).join('\n');
  return `${encabezado}\n${cuerpo}`;
};

module.exports = { aCSV };
