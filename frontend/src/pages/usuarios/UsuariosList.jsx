import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, ShieldOff, ShieldCheck } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import usuarioService from '../../services/usuario.service';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useConfirm } from '../../hooks/useConfirm';

const UsuariosList = () => {
  const toast = useToast();
  const { confirmar, dialogProps } = useConfirm();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = () => {
    setCargando(true);
    usuarioService
      .listar()
      .then(setUsuarios)
      .catch((err) => toast.error(err.message))
      .finally(() => setCargando(false));
  };

  useEffect(cargar, []);

  const toggleEstado = async (u) => {
    const nuevoEstado = u.estado === 'activo' ? 'inactivo' : 'activo';
    const ok = await confirmar({
      titulo: nuevoEstado === 'activo' ? 'Activar usuario' : 'Desactivar usuario',
      mensaje: `¿${nuevoEstado === 'activo' ? 'Activar' : 'Desactivar'} a "${u.nombre}"? ${
        nuevoEstado === 'inactivo' ? 'No podrá iniciar sesión mientras esté inactivo.' : ''
      }`,
      variante: nuevoEstado === 'activo' ? 'primary' : 'danger',
      textoConfirmar: nuevoEstado === 'activo' ? 'Activar' : 'Desactivar'
    });
    if (!ok) return;

    try {
      await usuarioService.cambiarEstado(u.id, nuevoEstado);
      toast.exito('Estado del usuario actualizado');
      cargar();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <ConfirmDialog {...dialogProps} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-800">Usuarios</h1>
        <Link to="/usuarios/nuevo">
          <Button icon={Plus}>Nuevo usuario</Button>
        </Link>
      </div>

      {cargando ? (
        <Spinner />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuarios.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-700">{u.nombre}</td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3 text-slate-600">{u.rol?.nombre}</td>
                  <td className="px-4 py-3"><Badge valor={u.estado} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <Link
                        to={`/usuarios/${u.id}/editar`}
                        className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-emerald-700"
                      >
                        <Pencil size={14} /> Editar
                      </Link>
                      <button
                        onClick={() => toggleEstado(u)}
                        className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600"
                      >
                        {u.estado === 'activo' ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                        {u.estado === 'activo' ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UsuariosList;
