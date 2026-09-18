// Jerarquía visual de botones consistente en toda la app:
// primary = acción principal, secondary = neutra, danger = destructiva/cancelar,
// ghost = terciaria (ej. "Limpiar filtros").
const VARIANTES = {
  primary:
    'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500 disabled:bg-emerald-300',
  secondary:
    'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus-visible:ring-slate-400 disabled:text-slate-300',
  danger:
    'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 focus-visible:ring-red-400 disabled:opacity-50',
  ghost: 'text-slate-500 hover:bg-slate-100 focus-visible:ring-slate-400 disabled:opacity-50'
};

const TAMANOS = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm'
};

const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icono,
  className = '',
  children,
  ...props
}) => (
  <button
    disabled={disabled || loading}
    className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed ${VARIANTES[variant]} ${TAMANOS[size]} ${className}`}
    {...props}
  >
    {loading ? (
      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
    ) : (
      Icono && <Icono className="h-4 w-4" strokeWidth={2} />
    )}
    {children}
  </button>
);

export default Button;
