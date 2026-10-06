import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, History, Search } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import inventarioService from '../../services/inventario.service';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';
import Button from '../../components/Button';

const MovimientosInventario = () => {
  const toast = useToast();
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({ desde: '', hasta: '' });
  const [producto, setProducto] = useState('');
  const [tipo, setTipo] = useState('');

  const cargar = async (params = {}) => {
    setCargando(true);
    try {
      const limpios = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== ''));
      setMovimientos(await inventarioService.listarMovimientos(limpios));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // "Producto" y "Tipo" se filtran en el cliente porque el backend solo
  // acepta producto_id/desde/hasta en este endpoint; no hace falta tocar la
  // API para dar esta búsqueda rápida sobre lo que ya se cargó.
  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter((m) => {
      const coincideProducto = producto
        ? m.producto?.nombre?.toLowerCase().includes(producto.toLowerCase())
        : true;
      const coincideTipo = tipo ? m.tipo === tipo : true;
      return coincideProducto && coincideTipo;
    });
  }, [movimientos, producto, tipo]);

  const hayFiltrosActivos = producto || tipo || filtros.desde || filtros.hasta;

  const limpiarFiltros = () => {
    setProducto('');
    setTipo('');
    const vacio = { desde: '', hasta: '' };
    setFiltros(vacio);
    cargar(vacio);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/inventario" className="flex items-center gap-1 text-sm text-emerald-700 hover:underline dark:text-emerald-400">
            <ArrowLeft size={14} /> Volver a existencias
          </Link>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold text-slate-800 dark:text-slate-100">
            <History size={22} className="text-emerald-600 dark:text-emerald-400" />
            Movimientos de inventario
          </h1>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          cargar(filtros);
        }}
        className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800"
      >
        <div className="min-w-[180px] flex-1">
          <label className="block text-xs font-medium text-slate-400 dark:text-slate-500">Buscar producto</label>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              value={producto}
              onChange={(e) => setProducto(e.target.value)}
              placeholder="Nombre del producto"
              className="w-full rounded-md border border-slate-300 bg-white py-1.5 pl-8 pr-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 dark:text-slate-500">Tipo de movimiento</label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
            <option value="">Todos</option>
            <option value="Entrada">Entrada</option>
            <option value="Salida">Salida</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 dark:text-slate-500">Fecha inicial</label>
          <input type="date" value={filtros.desde} onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })} className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 dark:text-slate-500">Fecha final</label>
          <input type="date" value={filtros.hasta} onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })} className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" />
        </div>
        <Button type="submit" variant="secondary" size="sm">Filtrar</Button>
        {hayFiltrosActivos && (
          <Button type="button" variant="ghost" size="sm" onClick={limpiarFiltros}>
            Limpiar filtros
          </Button>
        )}
      </form>

      {cargando ? (
        <Spinner texto="Cargando movimientos..." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-700/40 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Cantidad</th>
                <th className="px-4 py-3">Motivo</th>
                <th className="px-4 py-3">Usuario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {movimientosFiltrados.map((m) => (
                <tr key={m.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40">
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{new Date(m.fecha).toLocaleString('es-CO')}</td>
                  <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">{m.producto?.nombre}</td>
                  <td className="px-4 py-3"><Badge valor={m.tipo} /></td>
                  <td className="px-4 py-3 dark:text-slate-200">{m.cantidad}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      {m.motivo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{m.usuario?.nombre}</td>
                </tr>
              ))}
              {movimientosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12">
                    <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500">
                      <History size={28} />
                      <p className="text-sm">No se encontraron movimientos para los filtros seleccionados.</p>
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

export default MovimientosInventario;
