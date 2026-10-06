// Tailwind necesita ver las clases completas en el código fuente para
// generarlas (no puede construirlas dinámicamente con `text-${color}-700`).
const ACENTOS = {
  emerald: { texto: 'text-emerald-700 dark:text-emerald-400', fondo: 'bg-emerald-50 dark:bg-emerald-900/30', icono: 'text-emerald-600 dark:text-emerald-400' },
  amber: { texto: 'text-amber-700 dark:text-amber-400', fondo: 'bg-amber-50 dark:bg-amber-900/30', icono: 'text-amber-600 dark:text-amber-400' },
  red: { texto: 'text-red-700 dark:text-red-400', fondo: 'bg-red-50 dark:bg-red-900/30', icono: 'text-red-600 dark:text-red-400' },
  blue: { texto: 'text-blue-700 dark:text-blue-400', fondo: 'bg-blue-50 dark:bg-blue-900/30', icono: 'text-blue-600 dark:text-blue-400' },
  slate: { texto: 'text-slate-700 dark:text-slate-200', fondo: 'bg-slate-100 dark:bg-slate-700', icono: 'text-slate-600 dark:text-slate-300' }
};

const StatCard = ({ etiqueta, valor, descripcion, acento = 'emerald', icon: Icono }) => {
  const a = ACENTOS[acento] || ACENTOS.emerald;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">{etiqueta}</p>
        {Icono && (
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${a.fondo}`}>
            <Icono size={16} className={a.icono} strokeWidth={2} />
          </div>
        )}
      </div>
      <p className={`mt-2 text-2xl font-bold ${a.texto}`}>{valor}</p>
      {descripcion && <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{descripcion}</p>}
    </div>
  );
};

export default StatCard;
