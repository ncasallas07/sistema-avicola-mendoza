// Se usa punto y coma como separador porque Excel, con la configuración
// regional de Colombia, lo espera para abrir el archivo en columnas. El BOM
// inicial indica que el archivo es UTF-8 para que las tildes se vean bien.
const SEPARADOR = ';';
const BOM = '\uFEFF';

const aCSV = (filas) => {
  if (!filas.length) return BOM;
  const columnas = Object.keys(filas[0]);
  // Los decimales se escriben con coma, como los espera Excel en español.
  const formatear = (valor) => {
    if (valor instanceof Date) {
      const d = (n) => String(n).padStart(2, '0');
      return `${valor.getFullYear()}-${d(valor.getMonth() + 1)}-${d(valor.getDate())} ${d(valor.getHours())}:${d(valor.getMinutes())}`;
    }
    if (valor && typeof valor === 'object') {
      // Relaciones incluidas (por ejemplo, el cliente del pedido): se muestra su nombre.
      return String(valor.nombre_razon_social ?? valor.nombre ?? JSON.stringify(valor));
    }
    const texto = String(valor ?? '');
    return /^-?\d+\.\d+$/.test(texto) ? texto.replace('.', ',') : texto;
  };
  const escapar = (valor) => `"${formatear(valor).replace(/"/g, '""')}"`;
  const encabezado = columnas.map(escapar).join(SEPARADOR);
  const cuerpo = filas.map((fila) => columnas.map((c) => escapar(fila[c])).join(SEPARADOR)).join('\r\n');
  return `${BOM}${encabezado}\r\n${cuerpo}`;
};

module.exports = { aCSV };
