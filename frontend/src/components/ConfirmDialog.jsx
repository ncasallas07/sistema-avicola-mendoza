import { AlertTriangle } from 'lucide-react';
import Button from './Button';

// Modal de confirmación reutilizable, para no depender de window.confirm en
// acciones sensibles (cambiar estado, cancelar, activar/desactivar).
const ConfirmDialog = ({
  abierto,
  titulo = 'Confirmar acción',
  mensaje,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  variante = 'primary', // 'primary' | 'danger'
  cargando = false,
  onConfirmar,
  onCancelar
}) => {
  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 print:hidden">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl dark:bg-slate-800">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              variante === 'danger'
                ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                : 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
            }`}
          >
            <AlertTriangle size={18} />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">{titulo}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{mensaje}</p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onCancelar} disabled={cargando}>
            {textoCancelar}
          </Button>
          <Button
            variant={variante === 'danger' ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirmar}
            loading={cargando}
          >
            {textoConfirmar}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
