import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, PackageCheck, PackageX } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import pedidoService from '../../services/pedido.service';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import ConfirmDialog from '../../components/ConfirmDialog';
import EstadoError from '../../components/EstadoError';
import { useConfirm } from '../../hooks/useConfirm';

// Reflejo, solo para UX, de las transiciones que el backend permite realmente
// (services/pedido.service.js → TRANSICIONES_VALIDAS). El backend es quien decide,
// incluida la validación y el descuento real de inventario al confirmar.
const TRANSICIONES = {
  Pendiente: ['Confirmado', 'Cancelado'],
  Confirmado: ['En preparación', 'Cancelado'],
  'En preparación': ['Enviado', 'Cancelado'],
  Enviado: ['Entregado', 'Cancelado'],
  Entregado: [],
  Cancelado: []
};

const PedidoDetalle = () => {
  const { id } = useParams();
  const toast = useToast();
  const { confirmar, dialogProps } = useConfirm();
  const [pedido, setPedido] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [cambiando, setCambiando] = useState(false);
  const [error, setError] = useState('');
  const { tienePermiso } = useAuth();
  // Cancelar un pedido ya enviado exige decidir si el producto regresa al
  // inventario; solo puede hacerlo quien registra movimientos (el administrador).
  const puedeCancelarEnviado = tienePermiso('inventario.registrar_movimiento');
  const [dialogoEnviado, setDialogoEnviado] = useState(false);

  const cargar = () => {
    setCargando(true);
    setError('');
    pedidoService
      .obtener(id)
      .then(setPedido)
      .catch((err) => {
        setError(err.message);
        toast.error(err.message);
      })
      .finally(() => setCargando(false));
  };

  useEffect(cargar, [id]);

  const ejecutarCambio = async (estado, extra) => {
    setCambiando(true);
    try {
      const respuesta = await pedidoService.cambiarEstado(id, estado, extra);
      toast.exito(respuesta.message || 'Estado del pedido actualizado');
      cargar();
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    } finally {
      setCambiando(false);
    }
  };

  const cancelarEnviado = async (reingresar) => {
    const ok = await ejecutarCambio('Cancelado', { reingresar_inventario: reingresar });
    if (ok) setDialogoEnviado(false);
  };

  const cambiarEstado = async (estado) => {
    const esCancelacion = estado === 'Cancelado';
    if (esCancelacion && pedido.estado === 'Enviado') {
      setDialogoEnviado(true);
      return;
    }
    const ok = await confirmar({
      titulo: esCancelacion ? 'Cancelar pedido' : `Cambiar estado a "${estado}"`,
      mensaje: esCancelacion
        ? 'Esta acción cancelará el pedido. Si ya se había confirmado, el inventario descontado se devolverá automáticamente.'
        : estado === 'Confirmado'
          ? 'Al confirmar se validará y descontará el inventario disponible de cada producto.'
          : `¿Confirmas que el pedido pasa a "${estado}"?`,
      variante: esCancelacion ? 'danger' : 'primary',
      textoConfirmar: esCancelacion ? 'Sí, cancelar' : 'Confirmar'
    });
    if (!ok) return;
    await ejecutarCambio(estado);
  };

  if (cargando) return <Spinner texto="Cargando pedido..." />;
  if (!pedido) {
    return (
      <EstadoError
        titulo="No se pudo cargar el pedido"
        mensaje={error}
        textoVolver="Volver a pedidos"
        rutaVolver="/pedidos"
      />
    );
  }

  // Un pedido enviado solo lo puede cancelar el administrador.
  const siguientesEstados = (TRANSICIONES[pedido.estado] || []).filter(
    (e) => !(pedido.estado === 'Enviado' && e === 'Cancelado' && !puedeCancelarEnviado)
  );

  return (
    <div className="flex flex-col gap-5">
      <ConfirmDialog {...dialogProps} cargando={cambiando} />

      {dialogoEnviado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 print:hidden">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl dark:bg-slate-800">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">Cancelar pedido enviado</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Este pedido ya salió de la bodega. Elige qué pasa con el producto:
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                disabled={cambiando}
                onClick={() => cancelarEnviado(true)}
                className="flex items-start gap-3 rounded-lg border-2 border-emerald-500 bg-emerald-50 p-3 text-left hover:bg-emerald-100 disabled:opacity-60 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40"
              >
                <PackageCheck size={20} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>
                  <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">Devolver al inventario</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">
                    El producto regresó en buen estado: las cantidades vuelven a estar disponibles.
                  </span>
                </span>
              </button>
              <button
                type="button"
                disabled={cambiando}
                onClick={() => cancelarEnviado(false)}
                className="flex items-start gap-3 rounded-lg border-2 border-red-400 bg-red-50 p-3 text-left hover:bg-red-100 disabled:opacity-60 dark:bg-red-950/40 dark:hover:bg-red-900/40"
              >
                <PackageX size={20} className="mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
                <span>
                  <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">No devolver al inventario</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">
                    El producto no regresa o no está en condiciones de venderse: las cantidades no se devuelven.
                  </span>
                </span>
              </button>
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setDialogoEnviado(false)} disabled={cambiando}>
                Volver sin cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/pedidos" className="flex items-center gap-1 text-sm text-emerald-700 hover:underline dark:text-emerald-400">
            <ArrowLeft size={14} /> Volver a pedidos
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-slate-800 dark:text-slate-100">{pedido.numero_pedido}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {new Date(pedido.fecha_creacion).toLocaleString('es-CO')} · Vendedor: {pedido.creadoPor?.nombre}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge valor={pedido.estado} />
          <Link to={`/pedidos/${id}/comprobante`}>
            <Button variant="secondary" size="sm" icon={FileText}>
              Ver comprobante
            </Button>
          </Link>
        </div>
      </div>

      {siguientesEstados.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Cambiar estado a:</span>
          {siguientesEstados.map((estado) => (
            <Button
              key={estado}
              size="sm"
              variant={estado === 'Cancelado' ? 'danger' : 'primary'}
              disabled={cambiando}
              onClick={() => cambiarEstado(estado)}
            >
              {estado}
            </Button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 dark:border-slate-700 dark:bg-slate-800">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Cliente</p>
          <p className="text-sm text-slate-700 dark:text-slate-200">{pedido.cliente?.nombre_razon_social}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Doc: {pedido.cliente?.documento}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Zona / Dirección</p>
          <p className="text-sm text-slate-700 dark:text-slate-200">{pedido.cliente?.zona || '—'} · {pedido.cliente?.direccion || '—'}</p>
        </div>
        {pedido.observaciones && (
          <div className="sm:col-span-2">
            <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Observaciones</p>
            <p className="text-sm text-slate-700 dark:text-slate-200">{pedido.observaciones}</p>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h2 className="mb-3 font-semibold text-slate-700 dark:text-slate-200">Productos</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-400 dark:text-slate-500">
              <tr>
                <th className="py-2">Producto</th>
                <th className="py-2">Cantidad</th>
                <th className="py-2">Precio unit.</th>
                <th className="py-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 dark:text-slate-200">
              {pedido.detalles?.map((d) => (
                <tr key={d.id}>
                  <td className="py-2.5">{d.producto?.nombre}</td>
                  <td className="py-2.5">{d.cantidad}</td>
                  <td className="py-2.5">${Number(d.precio_unitario).toLocaleString('es-CO')}</td>
                  <td className="py-2.5 text-right">${Number(d.subtotal_linea).toLocaleString('es-CO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex justify-end border-t border-slate-100 pt-3 text-sm dark:border-slate-700">
          <div className="text-right">
            <p className="text-slate-500 dark:text-slate-400">Subtotal: ${Number(pedido.subtotal).toLocaleString('es-CO')}</p>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">Total: ${Number(pedido.total).toLocaleString('es-CO')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PedidoDetalle;
