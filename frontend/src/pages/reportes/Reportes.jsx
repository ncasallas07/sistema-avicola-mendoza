import { useEffect, useState } from 'react';
import { BarChart3, Boxes, Users, Download, FileBarChart2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import reporteService from '../../services/reporte.service';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';
import Button from '../../components/Button';

const GRUPOS_REPORTES = [
  {
    etiqueta: 'Ventas y pedidos',
    icono: BarChart3,
    reportes: [
      { clave: 'ventas', etiqueta: 'Ventas por período', usaFechas: true },
      { clave: 'pedidos', etiqueta: 'Pedidos por período', usaFechas: true, usaEstado: true },
      { clave: 'ventasPorVendedor', etiqueta: 'Ventas por vendedor', usaFechas: true },
      { clave: 'productosMasVendidos', etiqueta: 'Productos más vendidos', usaFechas: true }
    ]
  },
  {
    etiqueta: 'Inventario',
    icono: Boxes,
    reportes: [
      { clave: 'inventario', etiqueta: 'Estado del inventario', usaFechas: false },
      { clave: 'stockBajo', etiqueta: 'Productos con stock bajo', usaFechas: false }
    ]
  },
  {
    etiqueta: 'Clientes',
    icono: Users,
    reportes: [{ clave: 'clientesPorZona', etiqueta: 'Clientes registrados por zona', usaFechas: false }]
  }
];

const TODOS_LOS_REPORTES = GRUPOS_REPORTES.flatMap((g) => g.reportes);
const ESTADOS_PEDIDO = ['Pendiente', 'Confirmado', 'En preparación', 'Enviado', 'Entregado', 'Cancelado'];

const formatoMoneda = (v) => `$${Number(v || 0).toLocaleString('es-CO')}`;

const Reportes = () => {
  const toast = useToast();
  const [clave, setClave] = useState('ventas');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [estado, setEstado] = useState('');
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [exportando, setExportando] = useState(false);

  const reporteActivo = TODOS_LOS_REPORTES.find((r) => r.clave === clave);
  const grupoActivo = GRUPOS_REPORTES.find((g) => g.reportes.some((r) => r.clave === clave));
  const IconoGrupo = grupoActivo?.icono || FileBarChart2;

  const armarParams = () => ({
    desde: reporteActivo.usaFechas ? desde || undefined : undefined,
    hasta: reporteActivo.usaFechas ? hasta || undefined : undefined,
    estado: reporteActivo.usaEstado ? estado || undefined : undefined
  });

  const cargar = async () => {
    setCargando(true);
    try {
      setDatos(await reporteService.obtener(clave, armarParams()));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);

  const exportarCSV = async () => {
    setExportando(true);
    try {
      await reporteService.descargarCSV(clave, armarParams(), clave);
      toast.exito('Reporte exportado correctamente');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
          <IconoGrupo size={24} className="text-emerald-600" />
          Reportes
        </h1>
        <p className="text-sm text-slate-500">{reporteActivo.etiqueta}</p>
      </div>

      <div className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div>
          <label className="block text-xs font-medium text-slate-400">Reporte</label>
          <select value={clave} onChange={(e) => setClave(e.target.value)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm">
            {GRUPOS_REPORTES.map((grupo) => (
              <optgroup key={grupo.etiqueta} label={grupo.etiqueta}>
                {grupo.reportes.map((r) => (
                  <option key={r.clave} value={r.clave}>{r.etiqueta}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        {reporteActivo.usaFechas && (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-400">Fecha inicial</label>
              <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400">Fecha final</label>
              <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
            </div>
          </>
        )}
        {reporteActivo.usaEstado && (
          <div>
            <label className="block text-xs font-medium text-slate-400">Estado</label>
            <select value={estado} onChange={(e) => setEstado(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
              <option value="">Todos</option>
              {ESTADOS_PEDIDO.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>
        )}
        <Button variant="secondary" size="sm" onClick={cargar}>Aplicar</Button>
        <Button variant="secondary" size="sm" icon={Download} loading={exportando} onClick={exportarCSV}>
          Exportar CSV
        </Button>
      </div>

      {cargando ? <Spinner texto="Cargando reporte..." /> : <TablaReporte clave={clave} datos={datos} />}
    </div>
  );
};

const Envoltorio = ({ children, datos }) => {
  if (datos.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col items-center gap-2 px-4 py-12 text-slate-400">
          <FileBarChart2 size={28} />
          <p className="text-sm">No se encontraron resultados para este filtro.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
};

const TablaReporte = ({ clave, datos }) => {
  if (clave === 'ventas' || clave === 'pedidos') {
    return (
      <Envoltorio datos={datos}>
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">N° Pedido</th>
            <th className="px-4 py-3">Cliente</th>
            {clave === 'pedidos' && <th className="px-4 py-3">Vendedor</th>}
            <th className="px-4 py-3">Fecha</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {datos.map((p) => (
            <tr key={p.id} className="transition-colors hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-700">{p.numero_pedido}</td>
              <td className="px-4 py-3 text-slate-600">{p.cliente?.nombre_razon_social}</td>
              {clave === 'pedidos' && <td className="px-4 py-3 text-slate-600">{p.creadoPor?.nombre}</td>}
              <td className="px-4 py-3 text-slate-600">{new Date(p.fecha_creacion).toLocaleDateString('es-CO')}</td>
              <td className="px-4 py-3 font-medium text-slate-700">{formatoMoneda(p.total)}</td>
              <td className="px-4 py-3"><Badge valor={p.estado} /></td>
            </tr>
          ))}
        </tbody>
      </Envoltorio>
    );
  }

  if (clave === 'ventasPorVendedor') {
    return (
      <Envoltorio datos={datos}>
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Vendedor</th>
            <th className="px-4 py-3">Pedidos</th>
            <th className="px-4 py-3">Total vendido</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {datos.map((d, i) => (
            <tr key={i} className="transition-colors hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-700">{d.creadoPor?.nombre}</td>
              <td className="px-4 py-3 text-slate-600">{d.total_pedidos}</td>
              <td className="px-4 py-3 font-medium text-slate-700">{formatoMoneda(d.total_vendido)}</td>
            </tr>
          ))}
        </tbody>
      </Envoltorio>
    );
  }

  if (clave === 'productosMasVendidos') {
    return (
      <Envoltorio datos={datos}>
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Producto</th>
            <th className="px-4 py-3">Cantidad vendida</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {datos.map((d, i) => (
            <tr key={i} className="transition-colors hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-700">{d.producto?.nombre}</td>
              <td className="px-4 py-3 text-slate-600">{d.cantidad_vendida}</td>
            </tr>
          ))}
        </tbody>
      </Envoltorio>
    );
  }

  if (clave === 'inventario' || clave === 'stockBajo') {
    return (
      <Envoltorio datos={datos}>
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Producto</th>
            <th className="px-4 py-3">Disponible</th>
            <th className="px-4 py-3">Stock mínimo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {datos.map((p) => (
            <tr key={p.id} className="transition-colors hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-700">{p.nombre}</td>
              <td className="px-4 py-3 text-slate-600">{p.cantidad_disponible}</td>
              <td className="px-4 py-3 text-slate-600">{p.stock_minimo}</td>
            </tr>
          ))}
        </tbody>
      </Envoltorio>
    );
  }

  if (clave === 'clientesPorZona') {
    return (
      <Envoltorio datos={datos}>
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Zona</th>
            <th className="px-4 py-3">Total clientes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {datos.map((d, i) => (
            <tr key={i} className="transition-colors hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-700">{d.zona || 'Sin zona'}</td>
              <td className="px-4 py-3 text-slate-600">{d.total_clientes}</td>
            </tr>
          ))}
        </tbody>
      </Envoltorio>
    );
  }

  return null;
};

export default Reportes;
