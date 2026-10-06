import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// Control único y reutilizable de cambio de tema (Navbar y Login lo usan).
// No crea su propio estado: todo vive en ThemeContext.
const ThemeToggle = ({ className = '' }) => {
  const { tema, alternarTema } = useTheme();
  const esOscuro = tema === 'dark';

  return (
    <button
      type="button"
      onClick={alternarTema}
      aria-label={esOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={esOscuro ? 'Modo claro' : 'Modo oscuro'}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-slate-400 dark:hover:bg-slate-800 ${className}`}
    >
      {esOscuro ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};

export default ThemeToggle;
