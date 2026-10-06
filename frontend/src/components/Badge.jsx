const ESTILOS = {
  activo: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  inactivo: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  Pendiente: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  Confirmado: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  'En preparación': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400',
  Enviado: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
  Entregado: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  Cancelado: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  normal: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  bajo: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  agotado: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  Entrada: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  Salida: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
};

const Badge = ({ valor }) => (
  <span
    className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
      ESTILOS[valor] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
    }`}
  >
    {valor}
  </span>
);

export default Badge;
