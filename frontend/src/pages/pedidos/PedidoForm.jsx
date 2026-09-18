import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import clienteService from '../../services/cliente.service';
import productoService from '../../services/producto.service';
import pedidoService from '../../services/pedido.service';
import Spinner from '../../components/Spinner';
import Button from '../../components/Button';

const PedidoForm = () => {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [clienteId, setClienteId] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [items, setItems] = useState([]);
  const [productoSel, setProductoSel] = useState('');
  const [cantidadSel, setCantidadSel] = useState('1');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    Promise.all([
      clienteService.listar({ estado: 'activo' }),
      productoService.listar({ estado: 'activo' })
    ])
      .then(([c, p]) => {
        setClientes(c);
        setProductos(p);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clienteSeleccionado = useMemo(
    () => clientes.find((c) => c.id === Number(clienteId)),
    [clientes, clienteId]
  );

  const agregarItem = () => {
    if (!productoSel || Number(cantidadSel) <= 0) return;
    const producto = productos.find((p) => p.id === Number(productoSel));
    if (!producto) return;

    if (items.some((it) => it.producto_id === producto.id)) {
      toast.error('Ese producto ya está en el pedido, ajusta la cantidad en la lista.');
      return;
    }

    setItems([
      ...items,
      { producto_id: producto.id, nombre: producto.nombre, precio: Number(producto.precio), cantidad: Number(cantidadSel), disponible: producto.cantidad_disponible }
    ]);
    setProductoSel('');
    setCantidadSel('1');
  };

  const quitarItem = (id) => setItems(items.filter((it) => it.producto_id !== id));

  const totalEstimado = items.reduce((acc, it) => acc + it.precio * it.cantidad, 0);

  const guardar = async (e) => {
    e.preventDefault();
    if (!clienteId) return toast.error('Selecciona un cliente');
    if (items.length === 0) return toast.error('Agrega al menos un producto');

    setEnviando(true);
    try {
      const pedido = await pedidoService.crear({
        cliente_id: Number(clienteId),
        observaciones: observaciones || undefined,
        items: items.map((it) => ({ producto_id: it.producto_id, cantidad: it.cantidad }))
      });
      toast.exito(`Pedido ${pedido.numero_pedido} creado correctamente, queda en estado Pendiente`);
      navigate(`/pedidos/${pedido.id}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) return <Spinner />;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-2xl font-bold text-slate-800">Nuevo pedido</h1>

      <form onSubmit={guardar} className="flex flex-col gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="mb-1 block text-sm font-medium text-slate-600">
            Cliente <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">Selecciona un cliente...</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre_razon_social} — {c.documento}</option>
            ))}
          </select>

          {clienteSeleccionado && (
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-lg bg-emerald-50/60 p-3 text-xs text-slate-600">
              <p><span className="text-slate-400">Identificación:</span> {clienteSeleccionado.documento}</p>
              <p><span className="text-slate-400">Teléfono:</span> {clienteSeleccionado.telefono || '—'}</p>
              <p><span className="text-slate-400">Dirección:</span> {clienteSeleccionado.direccion || '—'}</p>
              <p><span className="text-slate-400">Zona:</span> {clienteSeleccionado.zona || '—'}</p>
            </div>
          )}

          <label className="mb-1 mt-4 block text-sm font-medium text-slate-600">Observaciones</label>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="Opcional: indicaciones de entrega, etc."
          />

          <p className="mt-3 text-xs text-slate-400">
            Vendedor responsable: <span className="font-medium text-slate-600">{usuario?.nombre}</span> (se asigna automáticamente, no se puede cambiar)
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-semibold text-slate-700">Productos</h2>

          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[220px] flex-1">
              <label className="mb-1 block text-xs text-slate-500">Producto</label>
              <select
                value={productoSel}
                onChange={(e) => setProductoSel(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              >
                <option value="">Selecciona...</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} — ${Number(p.precio).toLocaleString('es-CO')} (disp: {p.cantidad_disponible})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Cantidad</label>
              <input
                type="number"
                min="1"
                value={cantidadSel}
                onChange={(e) => setCantidadSel(e.target.value)}
                className="w-24 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              />
            </div>
            <Button type="button" variant="secondary" size="sm" icon={Plus} onClick={agregarItem}>
              Agregar
            </Button>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {items.length === 0 && <p className="py-4 text-center text-sm text-slate-400">Aún no has agregado productos.</p>}
            {items.map((it) => (
              <div key={it.producto_id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-medium text-slate-700">{it.nombre}</p>
                  <p className="text-xs text-slate-400">
                    {it.cantidad} × ${it.precio.toLocaleString('es-CO')}
                    {it.cantidad > it.disponible && (
                      <span className="ml-2 text-amber-600">⚠ podría no alcanzar al confirmar (disp: {it.disponible})</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-slate-700">${(it.precio * it.cantidad).toLocaleString('es-CO')}</span>
                  <button
                    type="button"
                    onClick={() => quitarItem(it.producto_id)}
                    className="text-slate-400 hover:text-red-600"
                    aria-label="Quitar producto"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {items.length > 0 && (
            <div className="mt-3 flex justify-end border-t border-slate-100 pt-3">
              <p className="text-sm text-slate-500">
                Total estimado: <span className="text-base font-bold text-slate-800">${totalEstimado.toLocaleString('es-CO')}</span>
              </p>
            </div>
          )}

          <div className="mt-3 flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
            <Info size={14} className="mt-0.5 shrink-0" />
            <p>
              El pedido se guarda como <strong>Pendiente</strong> y todavía no descuenta inventario. La
              disponibilidad se valida y se descuenta recién cuando el pedido se <strong>confirma</strong>.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button type="submit" loading={enviando}>
            {enviando ? 'Creando pedido...' : 'Crear pedido'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PedidoForm;
