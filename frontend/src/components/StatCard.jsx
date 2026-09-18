// Tailwind necesita ver las clases completas en el código fuente para
// generarlas (no puede construirlas dinámicamente con `text-${color}-700`).
const ACENTOS = {
  emerald: { texto: 'text-emerald-700', fondo: 'bg-emerald-50', icono: 'text-emerald-600' },
  amber: { texto: 'text-amber-700', fondo: 'bg-amber-50', icono: 'text-amber-600' },
  red: { texto: 'text-red-700', fondo: 'bg-red-50', icono: 'text-red-600' },
  blue: { texto: 'text-blue-700', fondo: 'bg-blue-50', icono: 'text-blue-600' },
  slate: { texto: 'text-slate-700', fondo: 'bg-slate-100', icono: 'text-slate-600' }
};

const StatCard = ({ etiqueta, valor, descripcion, acento = 'emerald', icon: Icono }) => {
  const a = ACENTOS[acento] || ACENTOS.emerald;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{etiqueta}</p>
        {Icono && (
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${a.fondo}`}>
            <Icono size={16} className={a.icono} strokeWidth={2} />
          </div>
        )}
      </div>
      <p className={`mt-2 text-2xl font-bold ${a.texto}`}>{valor}</p>
      {descripcion && <p className="mt-0.5 text-xs text-slate-400">{descripcion}</p>}
    </div>
  );
};

export default StatCard;
