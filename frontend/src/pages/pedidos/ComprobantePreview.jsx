import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, FileWarning, Printer } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import pedidoService from '../../services/pedido.service';
import Spinner from '../../components/Spinner';
import Button from '../../components/Button';
import Logo from '../../components/Logo';

const formatoMoneda = (valor) => `$${Number(valor).toLocaleString('es-CO')}`;
const formatoFecha = (fecha) =>
  new Date(fecha).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

const ComprobantePreview = () => {
  const { id } = useParams();
  const toast = useToast();
  const [pedido, setPedido] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    pedidoService
      .obtener(id)
      .then(setPedido)
      .catch((err) => {
        setError(err.message);
        toast.error(err.message);
      })
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const descargarPDF = async () => {
    setDescargando(true);
    try {
      await pedidoService.abrirComprobante(id, pedido.numero_pedido);
      toast.exito('PDF descargado correctamente');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDescargando(false);
    }
  };

  if (cargando) return <Spinner texto="Generando comprobante..." />;

  if (!pedido) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-100 px-4 text-center dark:bg-slate-900">
        <Logo tamano="md" />
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white px-8 py-10 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/40">
            <FileWarning size={26} className="text-red-500 dark:text-red-400" />
          </div>
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">No se pudo generar el comprobante</h1>
          <p className="max-w-xs text-sm text-slate-500 dark:text-slate-400">{error || 'No fue posible cargar este pedido.'}</p>
          <Link to="/pedidos">
            <Button variant="secondary" icon={ArrowLeft}>Volver a pedidos</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-200 pb-16 dark:bg-slate-950">
      {/* Barra de acciones: se oculta al imprimir */}
      <div className="print:hidden sticky top-0 z-10 flex items-center justify-between border-b border-slate-300 bg-white px-4 py-3 shadow-sm sm:px-6 dark:border-slate-700 dark:bg-slate-800">
        <Link
          to={`/pedidos/${id}`}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-400"
        >
          <ArrowLeft size={16} /> Volver al pedido
        </Link>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={Printer} onClick={() => window.print()}>
            Imprimir
          </Button>
          <Button size="sm" icon={Download} loading={descargando} onClick={descargarPDF}>
            Descargar PDF
          </Button>
        </div>
      </div>

      {/* Documento — formato A4 */}
      <div className="mx-auto mt-6 w-full max-w-[210mm] bg-white p-10 shadow-lg print:mt-0 print:w-full print:max-w-none print:p-8 print:shadow-none">
        <div className="flex items-start justify-between border-b border-slate-200 pb-6">
          <Logo tamano="md" />
          <div className="text-right text-xs text-slate-500">
            <p className="text-sm font-semibold text-slate-700">Comprobante Comercial de Pedido</p>
            <p>Documento interno — no es factura electrónica DIAN</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Datos del pedido</p>
            <p><span className="text-slate-400">N° Pedido:</span> <span className="font-medium">{pedido.numero_pedido}</span></p>
            <p><span className="text-slate-400">Fecha:</span> {formatoFecha(pedido.fecha_creacion)}</p>
            <p><span className="text-slate-400">Estado:</span> {pedido.estado}</p>
            <p><span className="text-slate-400">Vendedor:</span> {pedido.creadoPor?.nombre}</p>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Datos del cliente</p>
            <p className="font-medium">{pedido.cliente?.nombre_razon_social}</p>
            <p><span className="text-slate-400">Documento:</span> {pedido.cliente?.documento}</p>
            <p><span className="text-slate-400">Teléfono:</span> {pedido.cliente?.telefono || '—'}</p>
            <p><span className="text-slate-400">Dirección:</span> {pedido.cliente?.direccion || '—'}</p>
            <p><span className="text-slate-400">Zona:</span> {pedido.cliente?.zona || '—'}</p>
          </div>
        </div>

        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b-2 border-slate-700 text-left text-xs uppercase text-slate-500">
              <th className="pb-2">Producto</th>
              <th className="pb-2">Cantidad</th>
              <th className="pb-2">Precio unit.</th>
              <th className="pb-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {pedido.detalles?.map((d) => (
              <tr key={d.id} className="border-b border-slate-100">
                <td className="py-2.5">{d.producto?.nombre}</td>
                <td className="py-2.5">{d.cantidad}</td>
                <td className="py-2.5">{formatoMoneda(d.precio_unitario)}</td>
                <td className="py-2.5 text-right">{formatoMoneda(d.subtotal_linea)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <div className="w-56 text-sm">
            <div className="flex justify-between py-1 text-slate-500">
              <span>Subtotal</span>
              <span>{formatoMoneda(pedido.subtotal)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 py-2 text-base font-bold text-emerald-700">
              <span>Total</span>
              <span>{formatoMoneda(pedido.total)}</span>
            </div>
          </div>
        </div>

        {pedido.observaciones && (
          <div className="mt-6 rounded-lg bg-slate-50 p-4 text-sm">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Observaciones</p>
            <p className="text-slate-600">{pedido.observaciones}</p>
          </div>
        )}

        <p className="mt-10 text-center text-[11px] text-slate-400">
          Comprobante comercial interno para control de AVÍCOLA MENDOZA — no constituye factura electrónica DIAN.
        </p>
      </div>
    </div>
  );
};

export default ComprobantePreview;
