import { Bird } from 'lucide-react';

// No existe un logo de marca cargado en el proyecto todavía; este es un
// distintivo simple (no un logo ilustrado) para dar identidad visual mientras
// tanto. Si más adelante se define un logo real, basta reemplazar este archivo.
const Logo = ({ tamano = 'md', claro = false }) => {
  const tamanos = {
    sm: { caja: 'h-7 w-7', icono: 14, texto: 'text-sm' },
    md: { caja: 'h-9 w-9', icono: 18, texto: 'text-base' },
    lg: { caja: 'h-12 w-12', icono: 24, texto: 'text-xl' }
  };
  const t = tamanos[tamano];

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`flex ${t.caja} items-center justify-center rounded-lg ${
          claro ? 'bg-white/15' : 'bg-emerald-700'
        }`}
      >
        <Bird size={t.icono} className={claro ? 'text-amber-300' : 'text-amber-400'} strokeWidth={2} />
      </div>
      <span className={`${t.texto} font-bold tracking-tight ${claro ? 'text-white' : 'text-emerald-800 dark:text-emerald-400'}`}>
        AVÍCOLA MENDOZA
      </span>
    </div>
  );
};

export default Logo;
