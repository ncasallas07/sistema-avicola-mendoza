import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import clienteService from '../../services/cliente.service';
import Spinner from '../../components/Spinner';
import Button from '../../components/Button';

const VACIO = {
  nombre_razon_social: '',
  documento: '',
  telefono: '',
  correo: '',
  direccion: '',
  zona: '',
  ciudad: ''
};

const ClienteForm = () => {
  const { id } = useParams();
  const esEdicion = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(VACIO);
  const [cargando, setCargando] = useState(esEdicion);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!esEdicion) return;
    clienteService
      .obtener(id)
      .then((c) =>
        setForm({
          nombre_razon_social: c.nombre_razon_social || '',
          documento: c.documento || '',
          telefono: c.telefono || '',
          correo: c.correo || '',
          direccion: c.direccion || '',
          zona: c.zona || '',
          ciudad: c.ciudad || ''
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
        await clienteService.editar(id, form);
        toast.exito('Cliente actualizado correctamente');
      } else {
        await clienteService.crear(form);
        toast.exito('Cliente creado correctamente');
      }
      navigate('/clientes');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <Spinner />;

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-4 text-xl font-bold text-slate-800">
        {esEdicion ? 'Editar cliente' : 'Nuevo cliente'}
      </h1>
      <form onSubmit={guardar} className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <Campo label="Nombre completo o razón social" required value={form.nombre_razon_social} onChange={cambiar('nombre_razon_social')} />
        <Campo label="Documento" required value={form.documento} onChange={cambiar('documento')} />
        <div className="grid grid-cols-2 gap-4">
          <Campo label="Teléfono" value={form.telefono} onChange={cambiar('telefono')} />
          <Campo label="Correo" type="email" value={form.correo} onChange={cambiar('correo')} />
        </div>
        <Campo label="Dirección" value={form.direccion} onChange={cambiar('direccion')} />
        <div className="grid grid-cols-2 gap-4">
          <Campo label="Zona" value={form.zona} onChange={cambiar('zona')} />
          <Campo label="Ciudad" value={form.ciudad} onChange={cambiar('ciudad')} />
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

export default ClienteForm;
