import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import rolService from '../../services/rol.service';
import permisoService from '../../services/permiso.service';
import Spinner from '../../components/Spinner';
import Button from '../../components/Button';

const ETIQUETAS_MODULO = {
  clientes: 'Clientes',
  proveedores: 'Proveedores',
  productos: 'Productos',
  categorias: 'Categorías',
  inventario: 'Inventario',
  pedidos: 'Pedidos',
  usuarios: 'Usuarios',
  roles: 'Roles',
  reportes: 'Reportes'
};

const RolForm = () => {
  const { id } = useParams();
  const esEdicion = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const { tienePermiso } = useAuth();
  const puedeAsignarPermisos = tienePermiso('roles.asignar_permisos');

  const [form, setForm] = useState({ nombre: '', descripcion: '', estado: 'activo' });
  const [catalogo, setCatalogo] = useState([]);
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const cargarCatalogo = permisoService.listar();
    const cargarRol = esEdicion ? rolService.obtener(id) : Promise.resolve(null);

    Promise.all([cargarCatalogo, cargarRol])
      .then(([permisos, rol]) => {
        setCatalogo(permisos);
        if (rol) {
          setForm({ nombre: rol.nombre, descripcion: rol.descripcion || '', estado: rol.estado });
          setSeleccionados(new Set(rol.permisos.map((p) => p.id)));
        }
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const grupos = useMemo(() => {
    const porModulo = {};
    for (const permiso of catalogo) {
      if (!porModulo[permiso.modulo]) porModulo[permiso.modulo] = [];
      porModulo[permiso.modulo].push(permiso);
    }
    return Object.entries(porModulo);
  }, [catalogo]);

  const alternarPermiso = (permisoId) => {
    setSeleccionados((actuales) => {
      const nuevo = new Set(actuales);
      if (nuevo.has(permisoId)) nuevo.delete(permisoId);
      else nuevo.add(permisoId);
      return nuevo;
    });
  };

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      let rolId = id;
      if (esEdicion) {
        await rolService.editar(id, { nombre: form.nombre, descripcion: form.descripcion });
      } else {
        const creado = await rolService.crear(form);
        rolId = creado.id;
      }

      if (puedeAsignarPermisos) {
        await rolService.asignarPermisos(rolId, Array.from(seleccionados));
      }

      toast.exito(esEdicion ? 'Rol actualizado correctamente' : 'Rol creado correctamente');
      navigate('/roles');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <Spinner />;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 text-xl font-bold text-slate-800 dark:text-slate-100">{esEdicion ? 'Editar rol' : 'Nuevo rol'}</h1>
      <form onSubmit={guardar} className="flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
              Nombre del rol <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <input
              required
              minLength={2}
              value={form.nombre}
              onChange={cambiar('nombre')}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          {!esEdicion && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Estado inicial</label>
              <select
                value={form.estado}
                onChange={cambiar('estado')}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Descripción</label>
          <textarea
            value={form.descripcion}
            onChange={cambiar('descripcion')}
            rows={2}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        {puedeAsignarPermisos ? (
          <div>
            <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Permisos</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {grupos.map(([modulo, permisos]) => (
                <div key={modulo} className="rounded-lg border border-slate-200 p-3 dark:border-slate-600 dark:bg-slate-900/40">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {ETIQUETAS_MODULO[modulo] || modulo}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {permisos.map((permiso) => (
                      <label key={permiso.id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={seleccionados.has(permiso.id)}
                          onChange={() => alternarPermiso(permiso.id)}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-500 dark:bg-slate-800 dark:checked:bg-emerald-600"
                        />
                        {permiso.nombre}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No tienes permiso para asignar permisos a este rol; solo puedes editar su nombre y descripción.
          </p>
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

export default RolForm;
