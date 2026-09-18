import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Ban, CheckCircle2, Truck } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import proveedorService from '../../services/proveedor.service';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useConfirm } from '../../hooks/useConfirm';

const ProveedoresList = () => {
  const toast = useToast();
  const { confirmar, dialogProps } = useConfirm();
  const [proveedores, setProveedores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [nombre, setNombre] = useState('');

  const cargar = async (filtros = {}) => {
    setCargando(true);
    try {
      setProveedores(await proveedorService.listar(filtros));
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

  const toggleEstado = async (p) => {
    const nuevoEstado = p.estado === 'activo' ? 'inactivo' : 'activo';
    const ok = await confirmar({
      titulo: nuevoEstado === 'activo' ? 'Activar proveedor' : 'Desactivar proveedor',
      mensaje: `¿${nuevoEstado === 'activo' ? 'Activar' : 'Desactivar'} a "${p.nombre_razon_social}"?`,
      variante: nuevoEstado === 'activo' ? 'primary' : 'danger',
      textoConfirmar: nuevoEstado === 'activo' ? 'Activar' : 'Desactivar'
    });
    if (!ok) return;

    try {
      await proveedorService.cambiarEstado(p.id, nuevoEstado);
      toast.exito('Estado del proveedor actualizado');
      cargar({ nombre });
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <ConfirmDialog {...dialogProps} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-800">Proveedores</h1>
        <Link to="/proveedores/nuevo">
          <Button icon={Plus}>Nuevo proveedor</Button>
        </Link>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          cargar({ nombre });
        }}
        className="flex gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
      >
        <input
          placeholder="Buscar por nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
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
                <th className="px-4 py-3">Identificación</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {proveedores.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-700">{p.nombre_razon_social}</td>
                  <td className="px-4 py-3 text-slate-600">{p.identificacion}</td>
                  <td className="px-4 py-3 text-slate-600">{p.telefono || '—'}</td>
                  <td className="px-4 py-3"><Badge valor={p.estado} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <Link
                        to={`/proveedores/${p.id}/editar`}
                        className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-emerald-700"
                      >
                        <Pencil size={14} /> Editar
                      </Link>
                      <button
                        onClick={() => toggleEstado(p)}
                        className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600"
                      >
                        {p.estado === 'activo' ? <Ban size={14} /> : <CheckCircle2 size={14} />}
                        {p.estado === 'activo' ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {proveedores.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Truck size={28} />
                      <p className="text-sm">No se encontraron proveedores.</p>
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

export default ProveedoresList;
