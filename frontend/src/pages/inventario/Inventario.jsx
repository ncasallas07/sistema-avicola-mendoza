import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { History, ArrowDownCircle, ArrowUpCircle, Boxes } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import inventarioService from '../../services/inventario.service';
import productoService from '../../services/producto.service';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';
import Button from '../../components/Button';

const Inventario = () => {
  const { esAdmin } = useAuth();
  const toast = useToast();
  const [existencias, setExistencias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [mostrarForm, setMostrarForm] = useState(null); // 'entrada' | 'salida' | null
  const [movimiento, setMovimiento] = useState({ producto_id: '', cantidad: '', motivo: 'Compra' });
  const [enviando, setEnviando] = useState(false);

  const cargar = async (indicador = '') => {
    setCargando(true);
    try {
      const params = indicador ? { indicador } : undefined;
      setExistencias(await inventarioService.listarExistencias(params));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    productoService.listar({ estado: 'activo' }).then(setProductos).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const abrirFormulario = (tipo) => {
    setMovimiento({ producto_id: '', cantidad: '', motivo: 'Compra' });
    setMostrarForm(tipo);
  };

  const registrarMovimiento = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      const payload = { producto_id: Number(movimiento.producto_id), cantidad: Number(movimiento.cantidad), motivo: movimiento.motivo };
      if (mostrarForm === 'entrada') {
        await inventarioService.registrarEntrada(payload);
      } else {
        await inventarioService.registrarSalida(payload);
      }
      toast.exito(`Inventario actualizado correctamente (${mostrarForm})`);
      setMostrarForm(null);
      cargar(filtro);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEnviando(false);
    }
  };

  const FILTROS = [
    { valor: '', etiqueta: 'Todos' },
    { valor: 'normal', etiqueta: 'Normal' },
    { valor: 'bajo', etiqueta: 'Bajo' },
    { valor: 'agotado', etiqueta: 'Agotado' }
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-800">Inventario</h1>
        <div className="flex gap-2">
          <Link to="/inventario/movimientos">
            <Button variant="secondary" icon={History}>Ver movimientos</Button>
          </Link>
          {esAdmin && (
            <>
              <Button icon={ArrowDownCircle} onClick={() => abrirFormulario('entrada')}>Entrada</Button>
              <Button
                variant="secondary"
                icon={ArrowUpCircle}
                className="!border-amber-300 !text-amber-700 hover:!bg-amber-50"
                onClick={() => abrirFormulario('salida')}
              >
                Salida
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-2 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
        {FILTROS.map(({ valor, etiqueta }) => (
          <button
            key={valor || 'todos'}
            onClick={() => {
              setFiltro(valor);
              cargar(valor);
            }}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filtro === valor ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      {mostrarForm && (
        <form onSubmit={registrarMovimiento} className="flex flex-wrap items-end gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Producto</label>
            <select
              required
              value={movimiento.producto_id}
              onChange={(e) => setMovimiento({ ...movimiento, producto_id: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            >
              <option value="">Selecciona...</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre} (disp: {p.cantidad_disponible})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Cantidad</label>
            <input
              type="number"
              min="1"
              required
              value={movimiento.cantidad}
              onChange={(e) => setMovimiento({ ...movimiento, cantidad: e.target.value })}
              className="w-28 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Motivo</label>
            <select
              value={movimiento.motivo}
              onChange={(e) => setMovimiento({ ...movimiento, motivo: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            >
              <option value="Compra">Compra</option>
              <option value="Ajuste">Ajuste</option>
            </select>
          </div>
          <Button loading={enviando}>{`Registrar ${mostrarForm}`}</Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setMostrarForm(null)}>
            Cancelar
          </Button>
        </form>
      )}

      {cargando ? (
        <Spinner />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Disponible</th>
                <th className="px-4 py-3">Stock mínimo</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {existencias.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-700">{p.nombre}</td>
                  <td className="px-4 py-3">{p.cantidad_disponible}</td>
                  <td className="px-4 py-3 text-slate-600">{p.stock_minimo}</td>
                  <td className="px-4 py-3"><Badge valor={p.indicador} /></td>
                </tr>
              ))}
              {existencias.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Boxes size={28} />
                      <p className="text-sm">No hay productos que coincidan.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Inventario;
