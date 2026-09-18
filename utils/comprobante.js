const PDFDocument = require('pdfkit');

const VERDE = '#047857';
const GRIS_CLARO = '#f1f5f9';
const GRIS_TEXTO = '#334155';

const formatoMoneda = (valor) => `$${Number(valor).toLocaleString('es-CO', { maximumFractionDigits: 0 })}`;
const formatoFecha = (fecha) => new Date(fecha).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

const generarComprobantePDF = (pedido) => {
  const doc = new PDFDocument({ margin: 0, size: 'A4' });
  const anchoPagina = doc.page.width;
  const margenLateral = 40;
  const anchoUtil = anchoPagina - margenLateral * 2;

  // Encabezado con banda de color corporativo
  doc.rect(0, 0, anchoPagina, 90).fill(VERDE);
  doc
    .fillColor('#ffffff')
    .font('Helvetica-Bold')
    .fontSize(20)
    .text('AVÍCOLA MENDOZA', margenLateral, 26);
  doc
    .font('Helvetica')
    .fontSize(10)
    .text('Comprobante Comercial de Pedido', margenLateral, 54);

  doc.fillColor(GRIS_TEXTO);
  let y = 112;

  // Bloque de datos: documento (izquierda) y cliente (derecha)
  const colIzq = margenLateral;
  const colDer = margenLateral + anchoUtil / 2 + 10;

  doc.font('Helvetica-Bold').fontSize(9).text('DATOS DEL PEDIDO', colIzq, y);
  doc.font('Helvetica-Bold').fontSize(9).text('DATOS DEL CLIENTE', colDer, y);
  y += 14;

  doc.font('Helvetica').fontSize(10);
  doc.text(`N° Pedido: ${pedido.numero_pedido}`, colIzq, y);
  doc.text(pedido.cliente.nombre_razon_social, colDer, y);
  y += 15;
  doc.text(`Fecha: ${formatoFecha(pedido.fecha_creacion)}`, colIzq, y);
  doc.text(`Documento: ${pedido.cliente.documento}`, colDer, y);
  y += 15;
  doc.text(`Estado: ${pedido.estado}`, colIzq, y);
  doc.text(`Teléfono: ${pedido.cliente.telefono || '—'}`, colDer, y);
  y += 15;
  doc.text(`Vendedor: ${pedido.creadoPor.nombre}`, colIzq, y);
  doc.text(`Dirección: ${pedido.cliente.direccion || '—'}`, colDer, y);
  y += 15;
  doc.text(`Zona: ${pedido.cliente.zona || '—'}`, colDer, y);
  y += 25;

  // Tabla de productos
  const filaAlto = 22;
  const colProducto = margenLateral;
  const colCantidad = margenLateral + anchoUtil * 0.5;
  const colPrecio = margenLateral + anchoUtil * 0.65;
  const colSubtotal = margenLateral + anchoUtil * 0.82;

  doc.rect(margenLateral, y, anchoUtil, filaAlto).fill(GRIS_CLARO);
  doc.fillColor(GRIS_TEXTO).font('Helvetica-Bold').fontSize(9);
  doc.text('PRODUCTO', colProducto + 6, y + 7);
  doc.text('CANT.', colCantidad, y + 7);
  doc.text('PRECIO UNIT.', colPrecio, y + 7);
  doc.text('SUBTOTAL', colSubtotal, y + 7, { width: anchoUtil - (colSubtotal - margenLateral) - 6, align: 'right' });
  y += filaAlto;

  doc.font('Helvetica').fontSize(9.5);
  pedido.detalles.forEach((detalle, i) => {
    if (i % 2 === 1) {
      doc.rect(margenLateral, y, anchoUtil, filaAlto).fill('#fafafa');
      doc.fillColor(GRIS_TEXTO);
    }
    doc.text(detalle.producto.nombre, colProducto + 6, y + 6, { width: colCantidad - colProducto - 10 });
    doc.text(String(detalle.cantidad), colCantidad, y + 6);
    doc.text(formatoMoneda(detalle.precio_unitario), colPrecio, y + 6);
    doc.text(formatoMoneda(detalle.subtotal_linea), colSubtotal, y + 6, {
      width: anchoUtil - (colSubtotal - margenLateral) - 6,
      align: 'right'
    });
    y += filaAlto;
  });

  doc.moveTo(margenLateral, y).lineTo(margenLateral + anchoUtil, y).strokeColor('#cbd5e1').stroke();
  y += 12;

  // Totales
  doc.font('Helvetica').fontSize(10);
  doc.text('Subtotal:', colPrecio, y, { width: colSubtotal - colPrecio });
  doc.text(formatoMoneda(pedido.subtotal), colSubtotal, y, {
    width: anchoUtil - (colSubtotal - margenLateral) - 6,
    align: 'right'
  });
  y += 16;
  doc.font('Helvetica-Bold').fontSize(12);
  doc.text('TOTAL:', colPrecio, y, { width: colSubtotal - colPrecio });
  doc.fillColor(VERDE).text(formatoMoneda(pedido.total), colSubtotal, y, {
    width: anchoUtil - (colSubtotal - margenLateral) - 6,
    align: 'right'
  });
  doc.fillColor(GRIS_TEXTO);
  y += 30;

  if (pedido.observaciones) {
    doc.font('Helvetica-Bold').fontSize(9).text('OBSERVACIONES', margenLateral, y);
    y += 13;
    doc.font('Helvetica').fontSize(9.5).text(pedido.observaciones, margenLateral, y, { width: anchoUtil });
  }

  doc
    .fontSize(8)
    .fillColor('#94a3b8')
    .text(
      'Comprobante comercial interno para control de AVÍCOLA MENDOZA — no constituye factura electrónica DIAN.',
      margenLateral,
      doc.page.height - 50,
      { width: anchoUtil, align: 'center' }
    );

  return doc;
};

module.exports = { generarComprobantePDF };
