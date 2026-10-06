import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import usuarioService from '../../services/usuario.service';
import rolService from '../../services/rol.service';
import Spinner from '../../components/Spinner';
import Button from '../../components/Button';

const UsuarioForm = () => {
  const { id } = useParams();
  const esEdicion = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const { tienePermiso } = useAuth();
  // Al crear siempre se elige el rol inicial; al editar, solo si el usuario
  // autenticado tiene usuarios.cambiar_rol (el backend también lo exige).
  const puedeElegirRol = !esEdicion || tienePermiso('usuarios.cambiar_rol');
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol_id: '' });
  const [roles, setRoles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const cargarRoles = rolService.listar().then((lista) => {
      const activos = lista.filter((r) => r.estado === 'activo');
      setRoles(activos);
      return activos;
    });

    const cargarUsuario = esEdicion
      ? usuarioService.listar().then((usuarios) => {
          const usuario = usuarios.find((u) => String(u.id) === id);
          if (!usuario) throw new Error('Usuario no encontrado');
          return usuario;
        })
      : Promise.resolve(null);

    Promise.all([cargarRoles, cargarUsuario])
      .then(([activos, usuario]) => {
        if (usuario) {
          setForm({
            nombre: usuario.nombre,
            email: usuario.email,
            password: '',
            rol_id: usuario.rol?.id || activos[0]?.id || ''
          });
        } else {
          setForm((f) => ({ ...f, rol_id: activos[0]?.id || '' }));
        }
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      if (esEdicion) {
        const cambios = { nombre: form.nombre, email: form.email };
        if (puedeElegirRol) cambios.rol_id = Number(form.rol_id);
        await usuarioService.editar(id, cambios);
        toast.exito('Usuario actualizado correctamente');
      } else {
        await usuarioService.crear({ ...form, rol_id: Number(form.rol_id) });
        toast.exito('Usuario creado correctamente');
      }
      navigate('/usuarios');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <Spinner />;

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-4 text-xl font-bold text-slate-800 dark:text-slate-100">{esEdicion ? 'Editar usuario' : 'Nuevo usuario'}</h1>
      <form onSubmit={guardar} className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <Campo label="Nombre completo" required value={form.nombre} onChange={cambiar('nombre')} />
        <Campo label="Correo" type="email" required value={form.email} onChange={cambiar('email')} />
        {!esEdicion && (
          <Campo label="Contraseña" type="password" required minLength={8} value={form.password} onChange={cambiar('password')} />
        )}

        {puedeElegirRol && (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
              Rol <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <select
              required
              value={form.rol_id}
              onChange={cambiar('rol_id')}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            >
              {roles.map((rol) => (
                <option key={rol.id} value={rol.id}>
                  {rol.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button type="submit" loading={guardando}>
            {guardando ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </div>
  );
};

const Campo = ({ label, required, ...props }) => (
  <div>
    <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
      {label} {required && <span className="text-red-500 dark:text-red-400">*</span>}
    </label>
    <input
      {...props}
      required={required}
      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
    />
  </div>
);

export default UsuarioForm;
