import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import productoService from '../../services/producto.service';
import categoriaService from '../../services/categoria.service';
import Spinner from '../../components/Spinner';
import Button from '../../components/Button';

const VACIO = {
  nombre: '',
  descripcion: '',
  categoria_id: '',
  textura_presentacion: '',
  unidad_medida: '',
  precio: '',
  cantidad_disponible: '0',
  stock_minimo: '0'
};

const ProductoForm = () => {
  const { id } = useParams();
  const esEdicion = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(VACIO);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(esEdicion);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    categoriaService.listar().then(setCategorias).catch(() => {});
    if (!esEdicion) return;
    productoService
      .obtener(id)
      .then((p) =>
        setForm({
          nombre: p.nombre || '',
          descripcion: p.descripcion || '',
          categoria_id: p.categoria_id || '',
          textura_presentacion: p.textura_presentacion || '',
          unidad_medida: p.unidad_medida || '',
          precio: p.precio || '',
          cantidad_disponible: String(p.cantidad_disponible ?? 0),
          stock_minimo: String(p.stock_minimo ?? 0)
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
      const payload = {
        ...form,
        categoria_id: Number(form.categoria_id),
        precio: Number(form.precio),
        stock_minimo: Number(form.stock_minimo)
      };
      if (esEdicion) {
        delete payload.cantidad_disponible; // el stock solo se ajusta desde Inventario
        await productoService.editar(id, payload);
        toast.exito('Producto actualizado correctamente');
      } else {
        payload.cantidad_disponible = Number(form.cantidad_disponible);
        await productoService.crear(payload);
        toast.exito('Producto creado correctamente');
      }
      navigate('/productos');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <Spinner />;

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-4 text-xl font-bold text-slate-800 dark:text-slate-100">{esEdicion ? 'Editar producto' : 'Nuevo producto'}</h1>
      <form onSubmit={guardar} className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <Campo label="Nombre" required value={form.nombre} onChange={cambiar('nombre')} />
        <Campo label="Descripción" value={form.descripcion} onChange={cambiar('descripcion')} />

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
            Categoría <span className="text-red-500 dark:text-red-400">*</span>
          </label>
          <select
            required
            value={form.categoria_id}
            onChange={cambiar('categoria_id')}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="">Selecciona una categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Campo label="Textura / presentación" value={form.textura_presentacion} onChange={cambiar('textura_presentacion')} />
          <Campo label="Unidad de medida" required placeholder="kg, unidad, cubeta..." value={form.unidad_medida} onChange={cambiar('unidad_medida')} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Campo label="Precio de venta" type="number" min="0.01" step="0.01" required value={form.precio} onChange={cambiar('precio')} />
          <Campo label="Stock mínimo" type="number" min="0" required value={form.stock_minimo} onChange={cambiar('stock_minimo')} />
        </div>

        {!esEdicion && (
          <Campo
            label="Cantidad disponible inicial"
            type="number"
            min="0"
            required
            value={form.cantidad_disponible}
            onChange={cambiar('cantidad_disponible')}
          />
        )}
        {esEdicion && (
          <p className="text-xs text-slate-400 dark:text-slate-500">
            El stock actual se ajusta desde el módulo de Inventario (entradas/salidas), no aquí.
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

export default ProductoForm;
