import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  UserX,
  UserCheck,
  Phone,
  Mail,
  MapPin,
  Tag,
  Building2,
  Calendar,
  ClipboardList
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import clienteService from '../../services/cliente.service';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import ConfirmDialog from '../../components/ConfirmDialog';
import EstadoError from '../../components/EstadoError';
import { useConfirm } from '../../hooks/useConfirm';

const formatoFecha = (fecha) =>
  fecha ? new Date(fecha).toLocaleDateString('es-CO', { dateStyle: 'medium' }) : '—';

const ClienteDetalle = () => {
  const { id } = useParams();
  const { tienePermiso } = useAuth();
  const toast = useToast();
  const { confirmar, dialogProps } = useConfirm();
  const [cliente, setCliente] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [error, setError] = useState('');

  const cargar = () => {
    setCargando(true);
    setError('');
    clienteService
      .obtener(id)
      .then(setCliente)
      .catch((err) => {
        setError(err.message);
        toast.error(err.message);
      })
      .finally(() => setCargando(false));
  };

  useEffect(cargar, [id]);

  const toggleEstado = async () => {
    const nuevoEstado = cliente.estado === 'activo' ? 'inactivo' : 'activo';
    const ok = await confirmar({
      titulo: nuevoEstado === 'activo' ? 'Activar cliente' : 'Desactivar cliente',
      mensaje: `¿${nuevoEstado === 'activo' ? 'Activar' : 'Desactivar'} a "${cliente.nombre_razon_social}"?`,
      variante: nuevoEstado === 'activo' ? 'primary' : 'danger',
      textoConfirmar: nuevoEstado === 'activo' ? 'Activar' : 'Desactivar'
    });
    if (!ok) return;

    setCambiandoEstado(true);
    try {
      await clienteService.cambiarEstado(cliente.id, nuevoEstado);
      toast.exito('Estado del cliente actualizado');
      cargar();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCambiandoEstado(false);
    }
  };

  if (cargando) return <Spinner texto="Cargando cliente..." />;
  if (!cliente) {
    return (
      <EstadoError
        titulo="No se pudo cargar el cliente"
        mensaje={error}
        textoVolver="Volver a clientes"
        rutaVolver="/clientes"
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <ConfirmDialog {...dialogProps} cargando={cambiandoEstado} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/clientes" className="flex items-center gap-1 text-sm text-emerald-700 hover:underline dark:text-emerald-400">
            <ArrowLeft size={14} /> Volver a clientes
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-slate-800 dark:text-slate-100">{cliente.nombre_razon_social}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Doc: {cliente.documento}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge valor={cliente.estado} />
          <Link to={`/clientes/${id}/editar`}>
            <Button variant="secondary" size="sm" icon={Pencil}>Editar</Button>
          </Link>
          {tienePermiso('clientes.eliminar') && (
            <Button
              variant={cliente.estado === 'activo' ? 'danger' : 'primary'}
              size="sm"
              icon={cliente.estado === 'activo' ? UserX : UserCheck}
              onClick={toggleEstado}
            >
              {cliente.estado === 'activo' ? 'Desactivar' : 'Activar'}
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h2 className="mb-4 font-semibold text-slate-700 dark:text-slate-200">Información del cliente</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Dato icon={Building2} etiqueta="Nombre / Razón social" valor={cliente.nombre_razon_social} />
          <Dato icon={Tag} etiqueta="Identificación" valor={cliente.documento} />
          <Dato icon={Phone} etiqueta="Teléfono" valor={cliente.telefono || '—'} />
          <Dato icon={Mail} etiqueta="Correo" valor={cliente.correo || '—'} />
          <Dato icon={MapPin} etiqueta="Dirección" valor={cliente.direccion || '—'} />
          <Dato icon={MapPin} etiqueta="Zona" valor={cliente.zona || '—'} />
          <Dato icon={MapPin} etiqueta="Ciudad" valor={cliente.ciudad || '—'} />
          <Dato icon={Calendar} etiqueta="Fecha de registro" valor={formatoFecha(cliente.fecha_registro)} />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
          <ClipboardList size={18} className="text-emerald-600 dark:text-emerald-400" />
          Historial de pedidos
        </h2>
        {(cliente.pedidos || []).length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-slate-400 dark:text-slate-500">
            <ClipboardList size={28} />
            <p className="text-sm">Este cliente todavía no tiene pedidos registrados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-700/40 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">N° Pedido</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {cliente.pedidos.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40">
                    <td className="px-4 py-3">
                      <Link to={`/pedidos/${p.id}`} className="font-medium text-emerald-700 hover:underline dark:text-emerald-400">
                        {p.numero_pedido}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatoFecha(p.fecha_creacion)}</td>
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">${Number(p.total).toLocaleString('es-CO')}</td>
                    <td className="px-4 py-3"><Badge valor={p.estado} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const Dato = ({ icon: Icono, etiqueta, valor }) => (
  <div className="flex items-start gap-2.5">
    <Icono size={16} className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500" />
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">{etiqueta}</p>
      <p className="text-sm text-slate-700 dark:text-slate-200">{valor}</p>
    </div>
  </div>
);

export default ClienteDetalle;
