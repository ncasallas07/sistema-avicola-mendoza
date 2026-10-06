import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Ban, CheckCircle2, Trash2, ShieldCheck } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import rolService from '../../services/rol.service';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useConfirm } from '../../hooks/useConfirm';

const RolesList = () => {
  const toast = useToast();
  const { tienePermiso } = useAuth();
  const { confirmar, dialogProps } = useConfirm();
  const [roles, setRoles] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = () => {
    setCargando(true);
    rolService
      .listar()
      .then(setRoles)
      .catch((err) => toast.error(err.message))
      .finally(() => setCargando(false));
  };

  useEffect(cargar, []);

  const toggleEstado = async (rol) => {
    const nuevoEstado = rol.estado === 'activo' ? 'inactivo' : 'activo';
    const ok = await confirmar({
      titulo: nuevoEstado === 'activo' ? 'Activar rol' : 'Desactivar rol',
      mensaje: `¿${nuevoEstado === 'activo' ? 'Activar' : 'Desactivar'} el rol "${rol.nombre}"? ${
        nuevoEstado === 'inactivo' ? 'No podrá asignarse a nuevos usuarios mientras esté inactivo.' : ''
      }`,
      variante: nuevoEstado === 'activo' ? 'primary' : 'danger',
      textoConfirmar: nuevoEstado === 'activo' ? 'Activar' : 'Desactivar'
    });
    if (!ok) return;

    try {
      await rolService.cambiarEstado(rol.id, nuevoEstado);
      toast.exito('Estado del rol actualizado');
      cargar();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const eliminar = async (rol) => {
    const ok = await confirmar({
      titulo: 'Eliminar rol',
      mensaje: `¿Eliminar el rol "${rol.nombre}"? Esta acción no se puede deshacer.`,
      variante: 'danger',
      textoConfirmar: 'Eliminar'
    });
    if (!ok) return;

    try {
      await rolService.eliminar(rol.id);
      toast.exito('Rol eliminado correctamente');
      cargar();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <ConfirmDialog {...dialogProps} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Roles y permisos</h1>
        {tienePermiso('roles.crear') && (
          <Link to="/roles/nuevo">
            <Button icon={Plus}>Nuevo rol</Button>
          </Link>
        )}
      </div>

      {cargando ? (
        <Spinner />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-700/40 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3">Permisos</th>
                <th className="px-4 py-3">Usuarios</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {roles.map((rol) => (
                <tr key={rol.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40">
                  <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">{rol.nombre}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-slate-600 dark:text-slate-300">{rol.descripcion || '—'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{rol.total_permisos}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{rol.total_usuarios}</td>
                  <td className="px-4 py-3"><Badge valor={rol.estado} /></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-3">
                      {tienePermiso('roles.editar') && (
                        <Link
                          to={`/roles/${rol.id}/editar`}
                          className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-400"
                        >
                          <Pencil size={14} /> Editar
                        </Link>
                      )}
                      {tienePermiso('roles.eliminar') && (
                        <button
                          onClick={() => toggleEstado(rol)}
                          className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                        >
                          {rol.estado === 'activo' ? <Ban size={14} /> : <CheckCircle2 size={14} />}
                          {rol.estado === 'activo' ? 'Desactivar' : 'Activar'}
                        </button>
                      )}
                      {tienePermiso('roles.eliminar') && rol.total_usuarios === 0 && (
                        <button
                          onClick={() => eliminar(rol)}
                          className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                        >
                          <Trash2 size={14} /> Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {roles.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12">
                    <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500">
                      <ShieldCheck size={28} />
                      <p className="text-sm">No se encontraron roles.</p>
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

export default RolesList;
