import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import usuarioService from '../../services/usuario.service';
import Spinner from '../../components/Spinner';
import Button from '../../components/Button';

const UsuarioForm = () => {
  const { id } = useParams();
  const esEdicion = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'Vendedor' });
  const [cargando, setCargando] = useState(esEdicion);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!esEdicion) return;
    // El backend no expone GET /usuarios/:id; se busca en el listado completo.
    usuarioService
      .listar()
      .then((usuarios) => {
        const usuario = usuarios.find((u) => String(u.id) === id);
        if (!usuario) throw new Error('Usuario no encontrado');
        setForm({ nombre: usuario.nombre, email: usuario.email, password: '', rol: usuario.rol?.nombre || 'Vendedor' });
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
        await usuarioService.editar(id, { nombre: form.nombre, email: form.email, rol: form.rol });
        toast.exito('Usuario actualizado correctamente');
      } else {
        await usuarioService.crear(form);
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
      <h1 className="mb-4 text-xl font-bold text-slate-800">{esEdicion ? 'Editar usuario' : 'Nuevo usuario'}</h1>
      <form onSubmit={guardar} className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <Campo label="Nombre completo" required value={form.nombre} onChange={cambiar('nombre')} />
        <Campo label="Correo" type="email" required value={form.email} onChange={cambiar('email')} />
        {!esEdicion && (
          <Campo label="Contraseña" type="password" required minLength={8} value={form.password} onChange={cambiar('password')} />
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">
            Rol <span className="text-red-500">*</span>
          </label>
          <select required value={form.rol} onChange={cambiar('rol')} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="Vendedor">Vendedor</option>
            <option value="Admin">Admin</option>
          </select>
        </div>

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
    <label className="mb-1 block text-sm font-medium text-slate-600">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      {...props}
      required={required}
      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
    />
  </div>
);

export default UsuarioForm;
