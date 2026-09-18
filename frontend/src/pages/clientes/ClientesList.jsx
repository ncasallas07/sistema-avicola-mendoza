import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, UserX, UserCheck, Users2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import clienteService from '../../services/cliente.service';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useConfirm } from '../../hooks/useConfirm';

const ClientesList = () => {
  const { esAdmin } = useAuth();
  const toast = useToast();
  const { confirmar, dialogProps } = useConfirm();
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({ nombre: '', documento: '', zona: '', estado: '' });

  const cargar = async (params = {}) => {
    setCargando(true);
    try {
      const filtrosLimpios = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== '')
      );
      const datos = await clienteService.listar(filtrosLimpios);
      setClientes(datos);
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

  const buscar = (e) => {
    e.preventDefault();
    cargar(filtros);
  };

  const toggleEstado = async (cliente) => {
    const nuevoEstado = cliente.estado === 'activo' ? 'inactivo' : 'activo';
    const ok = await confirmar({
      titulo: nuevoEstado === 'activo' ? 'Activar cliente' : 'Desactivar cliente',
      mensaje: `¿${nuevoEstado === 'activo' ? 'Activar' : 'Desactivar'} a "${cliente.nombre_razon_social}"?`,
      variante: nuevoEstado === 'activo' ? 'primary' : 'danger',
      textoConfirmar: nuevoEstado === 'activo' ? 'Activar' : 'Desactivar'
    });
    if (!ok) return;

    try {
      await clienteService.cambiarEstado(cliente.id, nuevoEstado);
      toast.exito('Estado del cliente actualizado');
      cargar(filtros);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <ConfirmDialog {...dialogProps} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
        <Link to="/clientes/nuevo">
          <Button icon={Plus}>Nuevo cliente</Button>
        </Link>
      </div>

      <form onSubmit={buscar} className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <input
          placeholder="Buscar por nombre"
          value={filtros.nombre}
          onChange={(e) => setFiltros({ ...filtros, nombre: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
        <input
          placeholder="Documento"
          value={filtros.documento}
          onChange={(e) => setFiltros({ ...filtros, documento: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
        <input
          placeholder="Zona"
          value={filtros.zona}
          onChange={(e) => setFiltros({ ...filtros, zona: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
        <select
          value={filtros.estado}
          onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
        <Button type="submit" variant="secondary" size="sm">Buscar</Button>
      </form>

      {cargando ? (
        <Spinner />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Nombre / Razón social</th>
                <th className="px-4 py-3">Documento</th>
                <th className="px-4 py-3">Zona</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clientes.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link to={`/clientes/${c.id}`} className="font-medium text-emerald-700 hover:underline">
                      {c.nombre_razon_social}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.documento}</td>
                  <td className="px-4 py-3 text-slate-600">{c.zona || '—'}</td>
                  <td className="px-4 py-3"><Badge valor={c.estado} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <Link
                        to={`/clientes/${c.id}/editar`}
                        className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-emerald-700"
                      >
                        <Pencil size={14} /> Editar
                      </Link>
                      {esAdmin && (
                        <button
                          onClick={() => toggleEstado(c)}
                          className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600"
                        >
                          {c.estado === 'activo' ? <UserX size={14} /> : <UserCheck size={14} />}
                          {c.estado === 'activo' ? 'Desactivar' : 'Activar'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {clientes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Users2 size={28} />
                      <p className="text-sm">No se encontraron clientes.</p>
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

export default ClientesList;
