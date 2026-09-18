const GRUPOS = [
  { clave: 'pendiente', etiqueta: 'Pendiente', color: 'bg-amber-400' },
  { clave: 'en_proceso', etiqueta: 'En proceso', color: 'bg-blue-400' },
  { clave: 'entregado', etiqueta: 'Entregado', color: 'bg-emerald-500' },
  { clave: 'cancelado', etiqueta: 'Cancelado', color: 'bg-red-400' }
];

// Barras horizontales simples (sin librería externa) para no sobrecargar el
// dashboard: solo aporta lo que el usuario necesita ver de un vistazo.
const EstadoBarChart = ({ datos }) => {
  const maximo = Math.max(1, ...GRUPOS.map((g) => datos?.[g.clave] || 0));

  return (
    <div className="flex flex-col gap-3">
      {GRUPOS.map((g) => {
        const valor = datos?.[g.clave] || 0;
        const porcentaje = Math.round((valor / maximo) * 100);
        return (
          <div key={g.clave} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-xs font-medium text-slate-500">{g.etiqueta}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${g.color} transition-all duration-500`}
                style={{ width: `${porcentaje}%` }}
              />
            </div>
            <span className="w-6 shrink-0 text-right text-sm font-semibold text-slate-700">{valor}</span>
          </div>
        );
      })}
    </div>
  );
};

export default EstadoBarChart;
