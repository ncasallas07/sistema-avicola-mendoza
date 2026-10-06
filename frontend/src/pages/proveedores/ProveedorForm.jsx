import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import proveedorService from '../../services/proveedor.service';
import Spinner from '../../components/Spinner';
import Button from '../../components/Button';

const VACIO = { nombre_razon_social: '', identificacion: '', telefono: '', correo: '', direccion: '' };

const ProveedorForm = () => {
  const { id } = useParams();
  const esEdicion = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(VACIO);
  const [cargando, setCargando] = useState(esEdicion);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!esEdicion) return;
    proveedorService
      .obtener(id)
      .then((p) =>
        setForm({
          nombre_razon_social: p.nombre_razon_social || '',
          identificacion: p.identificacion || '',
          telefono: p.telefono || '',
          correo: p.correo || '',
          direccion: p.direccion || ''
        })
      )
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
        await proveedorService.editar(id, form);
        toast.exito('Proveedor actualizado correctamente');
      } else {
        await proveedorService.crear(form);
        toast.exito('Proveedor creado correctamente');
      }
      navigate('/proveedores');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <Spinner />;

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-4 text-xl font-bold text-slate-800 dark:text-slate-100">{esEdicion ? 'Editar proveedor' : 'Nuevo proveedor'}</h1>
      <form onSubmit={guardar} className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <Campo label="Nombre o razón social" required value={form.nombre_razon_social} onChange={cambiar('nombre_razon_social')} />
        <Campo label="NIT / Identificación" required value={form.identificacion} onChange={cambiar('identificacion')} />
        <div className="grid grid-cols-2 gap-4">
          <Campo label="Teléfono" value={form.telefono} onChange={cambiar('telefono')} />
          <Campo label="Correo" type="email" value={form.correo} onChange={cambiar('correo')} />
        </div>
        <Campo label="Dirección" value={form.direccion} onChange={cambiar('direccion')} />

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

export default ProveedorForm;
