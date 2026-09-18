import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, FileText, Plus, ClipboardX } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import pedidoService from '../../services/pedido.service';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';
import Button from '../../components/Button';

const ESTADOS = ['Pendiente', 'Confirmado', 'En preparación', 'Enviado', 'Entregado', 'Cancelado'];

const PedidosList = () => {
  const { esAdmin } = useAuth();
  const toast = useToast();
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({ estado: '', desde: '', hasta: '' });

  const cargar = async (params = {}) => {
    setCargando(true);
    try {
      const limpios = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== ''));
      setPedidos(await pedidoService.listar(limpios));
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pedidos</h1>
          {!esAdmin && <p className="text-sm text-slate-500">Solo se muestran los pedidos que tú registraste</p>}
        </div>
        <Link to="/pedidos/nuevo">
          <Button icon={Plus}>Nuevo pedido</Button>
        </Link>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          cargar(filtros);
        }}
        className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
      >
        <div>
          <label className="block text-xs font-medium text-slate-400">Estado</label>
          <select
            value={filtros.estado}
            onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="">Todos</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400">Desde</label>
          <input type="date" value={filtros.desde} onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400">Hasta</label>
          <input type="date" value={filtros.hasta} onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
        </div>
        <Button type="submit" variant="secondary" size="sm">Filtrar</Button>
        {(filtros.estado || filtros.desde || filtros.hasta) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const vacio = { estado: '', desde: '', hasta: '' };
              setFiltros(vacio);
              cargar(vacio);
            }}
          >
            Limpiar filtros
          </Button>
        )}
      </form>

      {cargando ? (
        <Spinner />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">N° Pedido</th>
                <th className="px-4 py-3">Cliente</th>
                {esAdmin && <th className="px-4 py-3">Vendedor</th>}
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pedidos.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-700">{p.numero_pedido}</td>
                  <td className="px-4 py-3 text-slate-600">{p.cliente?.nombre_razon_social}</td>
                  {esAdmin && <td className="px-4 py-3 text-slate-600">{p.creadoPor?.nombre}</td>}
                  <td className="px-4 py-3 text-slate-600">{new Date(p.fecha_creacion).toLocaleDateString('es-CO')}</td>
                  <td className="px-4 py-3 font-medium text-slate-700">${Number(p.total).toLocaleString('es-CO')}</td>
                  <td className="px-4 py-3"><Badge valor={p.estado} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <Link
                        to={`/pedidos/${p.id}`}
                        className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-emerald-700"
                      >
                        <Eye size={14} /> Ver
                      </Link>
                      <Link
                        to={`/pedidos/${p.id}/comprobante`}
                        className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-emerald-700"
                      >
                        <FileText size={14} /> Comprobante
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {pedidos.length === 0 && (
                <tr>
                  <td colSpan={esAdmin ? 7 : 6} className="px-4 py-12">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <ClipboardX size={28} />
                      <p className="text-sm">No hay pedidos que coincidan con el filtro.</p>
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

export default PedidosList;
