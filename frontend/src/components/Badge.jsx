const ESTILOS = {
  activo: 'bg-green-100 text-green-700',
  inactivo: 'bg-slate-200 text-slate-600',
  Pendiente: 'bg-amber-100 text-amber-700',
  Confirmado: 'bg-blue-100 text-blue-700',
  'En preparación': 'bg-indigo-100 text-indigo-700',
  Enviado: 'bg-purple-100 text-purple-700',
  Entregado: 'bg-green-100 text-green-700',
  Cancelado: 'bg-red-100 text-red-700',
  normal: 'bg-green-100 text-green-700',
  bajo: 'bg-amber-100 text-amber-700',
  agotado: 'bg-red-100 text-red-700',
  Entrada: 'bg-emerald-100 text-emerald-700',
  Salida: 'bg-amber-100 text-amber-700'
};

const Badge = ({ valor }) => (
  <span
    className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
      ESTILOS[valor] || 'bg-slate-100 text-slate-600'
    }`}
  >
    {valor}
  </span>
);

export default Badge;
