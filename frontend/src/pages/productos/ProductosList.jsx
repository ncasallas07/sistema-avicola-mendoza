import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, PackageX, PackageCheck, PackageSearch } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import productoService from '../../services/producto.service';
import categoriaService from '../../services/categoria.service';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useConfirm } from '../../hooks/useConfirm';

const formatoMoneda = (valor) => `$${Number(valor).toLocaleString('es-CO')}`;

const ProductosList = () => {
  const { esAdmin } = useAuth();
  const toast = useToast();
  const { confirmar, dialogProps } = useConfirm();
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({ nombre: '', categoria_id: '', stock_bajo: '' });

  const cargar = async (params = {}) => {
    setCargando(true);
    try {
      const limpios = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== ''));
      setProductos(await productoService.listar(limpios));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    categoriaService.listar().then(setCategorias).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buscar = (e) => {
    e.preventDefault();
    cargar(filtros);
  };

  const toggleEstado = async (p) => {
    const nuevoEstado = p.estado === 'activo' ? 'inactivo' : 'activo';
    const ok = await confirmar({
      titulo: nuevoEstado === 'activo' ? 'Activar producto' : 'Desactivar producto',
      mensaje: `¿${nuevoEstado === 'activo' ? 'Activar' : 'Desactivar'} "${p.nombre}"?`,
      variante: nuevoEstado === 'activo' ? 'primary' : 'danger',
      textoConfirmar: nuevoEstado === 'activo' ? 'Activar' : 'Desactivar'
    });
    if (!ok) return;

    try {
      await productoService.cambiarEstado(p.id, nuevoEstado);
      toast.exito('Estado del producto actualizado');
      cargar(filtros);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <ConfirmDialog {...dialogProps} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-800">Productos</h1>
        {esAdmin && (
          <Link to="/productos/nuevo">
            <Button icon={Plus}>Nuevo producto</Button>
          </Link>
        )}
      </div>

      <form onSubmit={buscar} className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <input
          placeholder="Buscar por nombre"
          value={filtros.nombre}
          onChange={(e) => setFiltros({ ...filtros, nombre: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
        <select
          value={filtros.categoria_id}
          onChange={(e) => setFiltros({ ...filtros, categoria_id: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={filtros.stock_bajo === 'true'}
            onChange={(e) => setFiltros({ ...filtros, stock_bajo: e.target.checked ? 'true' : '' })}
          />
          Solo stock bajo
        </label>
        <Button type="submit" variant="secondary" size="sm">Buscar</Button>
      </form>

      {cargando ? (
        <Spinner />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Presentación</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Estado</th>
                {esAdmin && <th className="px-4 py-3 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productos.map((p) => {
                const indicador = p.cantidad_disponible <= 0 ? 'agotado' : p.cantidad_disponible <= p.stock_minimo ? 'bajo' : 'normal';
                return (
                  <tr key={p.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-700">{p.nombre}</td>
                    <td className="px-4 py-3 text-slate-600">{p.categoria?.nombre || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{p.textura_presentacion || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{formatoMoneda(p.precio)} / {p.unidad_medida}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-700">{p.cantidad_disponible}</span>{' '}
                      <Badge valor={indicador} />
                    </td>
                    <td className="px-4 py-3"><Badge valor={p.estado} /></td>
                    {esAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-3">
                          <Link
                            to={`/productos/${p.id}/editar`}
                            className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-emerald-700"
                          >
                            <Pencil size={14} /> Editar
                          </Link>
                          <button
                            onClick={() => toggleEstado(p)}
                            className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600"
                          >
                            {p.estado === 'activo' ? <PackageX size={14} /> : <PackageCheck size={14} />}
                            {p.estado === 'activo' ? 'Desactivar' : 'Activar'}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
              {productos.length === 0 && (
                <tr>
                  <td colSpan={esAdmin ? 7 : 6} className="px-4 py-12">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <PackageSearch size={28} />
                      <p className="text-sm">No se encontraron productos.</p>
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

export default ProductosList;
