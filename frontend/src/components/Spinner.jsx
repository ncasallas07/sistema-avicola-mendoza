const Spinner = ({ texto = 'Cargando...' }) => (
  <div className="flex items-center justify-center gap-3 py-10 text-slate-500 dark:text-slate-400">
    <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600 dark:border-slate-600 dark:border-t-emerald-500" />
    <span className="text-sm">{texto}</span>
  </div>
);

export default Spinner;
