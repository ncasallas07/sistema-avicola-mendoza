import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  AlertTriangle,
  XCircle,
  Users,
  ClipboardList,
  Clock,
  Truck,
  CheckCircle2,
  DollarSign,
  Boxes
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import dashboardService from '../services/dashboard.service';
import StatCard from '../components/StatCard';
import Spinner from '../components/Spinner';
import Badge from '../components/Badge';
import EstadoBarChart from '../components/EstadoBarChart';
import Button from '../components/Button';

const formatoMoneda = (valor) => `$${Number(valor || 0).toLocaleString('es-CO')}`;

const Dashboard = () => {
  const { usuario, esAdmin } = useAuth();
  const toast = useToast();
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  const cargar = async () => {
    setCargando(true);
    try {
      const respuesta = await dashboardService.obtener({ desde: desde || undefined, hasta: hasta || undefined });
      setDatos(respuesta);
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

  if (cargando) return <Spinner texto="Cargando dashboard..." />;
  if (!datos) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle size={22} className="text-red-500" />
        </div>
        <h2 className="font-semibold text-slate-800">No se pudo cargar el dashboard</h2>
        <p className="max-w-xs text-sm text-slate-500">
          Ocurrió un problema al cargar la información. Intenta nuevamente.
        </p>
        <Button size="sm" onClick={cargar}>Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Hola, {usuario?.nombre.split(' ')[0]}</h1>
          <p className="text-sm text-slate-500">Resumen de {esAdmin ? 'AVÍCOLA MENDOZA' : 'tus pedidos'}</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            cargar();
          }}
          className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm"
        >
          <div>
            <label className="block text-[11px] font-medium text-slate-400">Desde</label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-400">Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm"
            />
          </div>
          <Button type="submit" size="sm">Filtrar</Button>
        </form>
      </div>

      {esAdmin ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <StatCard etiqueta="Total clientes" valor={datos.total_clientes} icon={Users} acento="emerald" />
            <StatCard etiqueta="Total productos" valor={datos.total_productos} icon={Package} acento="emerald" />
            <StatCard etiqueta="Stock bajo" valor={datos.productos_stock_bajo} icon={AlertTriangle} acento="amber" />
            <StatCard etiqueta="Agotados" valor={datos.productos_agotados} icon={XCircle} acento="red" />
            <StatCard etiqueta="Total pedidos" valor={datos.total_pedidos} icon={ClipboardList} acento="slate" />
            <StatCard etiqueta="Pedidos entregados" valor={datos.pedidos_por_estado.entregado} icon={CheckCircle2} acento="emerald" />
            <StatCard etiqueta="Ventas del período" valor={formatoMoneda(datos.ventas_periodo)} icon={DollarSign} acento="emerald" />
            <StatCard etiqueta="Valor total de pedidos" valor={formatoMoneda(datos.valor_total_pedidos)} icon={Boxes} acento="blue" descripcion="Histórico, no cancelados" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
              <h2 className="mb-4 font-semibold text-slate-700">Pedidos por estado</h2>
              <EstadoBarChart datos={datos.pedidos_por_estado} />
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-3">
              <h2 className="mb-3 font-semibold text-slate-700">Productos más vendidos</h2>
              {datos.productos_mas_vendidos.length === 0 ? (
                <p className="text-sm text-slate-400">Sin ventas registradas todavía.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {datos.productos_mas_vendidos.map((p, i) => (
                    <li key={i} className="flex items-center justify-between py-2.5 text-sm">
                      <span className="text-slate-600">{p.producto}</span>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-medium text-emerald-700">
                        {p.cantidad_vendida} unidades
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard etiqueta="Mis pedidos" valor={datos.total_pedidos} icon={ClipboardList} acento="slate" />
            <StatCard etiqueta="Pendientes" valor={datos.pedidos_por_estado.pendiente} icon={Clock} acento="amber" />
            <StatCard etiqueta="En proceso" valor={datos.pedidos_por_estado.en_proceso} icon={Truck} acento="blue" />
            <StatCard etiqueta="Entregados" valor={datos.pedidos_por_estado.entregado} icon={CheckCircle2} acento="emerald" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
              <h2 className="mb-4 font-semibold text-slate-700">Mis pedidos por estado</h2>
              <EstadoBarChart datos={datos.pedidos_por_estado} />
              <p className="mt-4 text-sm text-slate-500">
                Vendido en el período: <span className="font-semibold text-slate-800">{formatoMoneda(datos.total_vendido_periodo)}</span>
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-3">
              <h2 className="mb-3 font-semibold text-slate-700">Mis pedidos recientes</h2>
              {datos.pedidos_recientes.length === 0 ? (
                <p className="text-sm text-slate-400">Aún no has registrado pedidos.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {datos.pedidos_recientes.map((p) => (
                    <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                      <Link to={`/pedidos/${p.id}`} className="font-medium text-emerald-700 hover:underline">
                        {p.numero_pedido} — {p.cliente?.nombre_razon_social}
                      </Link>
                      <Badge valor={p.estado} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
            <StatCard etiqueta="Clientes registrados" valor={datos.total_clientes} icon={Users} acento="slate" />
            <StatCard etiqueta="Productos disponibles" valor={datos.total_productos} icon={Package} acento="slate" />
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
