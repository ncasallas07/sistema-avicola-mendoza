import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);

let idSiguiente = 1;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const quitar = useCallback((id) => {
    setToasts((actuales) => actuales.filter((t) => t.id !== id));
  }, []);

  const notificar = useCallback(
    (mensaje, tipo = 'info') => {
      const id = idSiguiente++;
      setToasts((actuales) => [...actuales, { id, mensaje, tipo }]);
      setTimeout(() => quitar(id), 4500);
    },
    [quitar]
  );

  const exito = (mensaje) => notificar(mensaje, 'exito');
  const error = (mensaje) => notificar(mensaje, 'error');

  return (
    <ToastContext.Provider value={{ exito, error, notificar }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80 max-w-[90vw]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-lg px-4 py-3 text-sm shadow-lg border ${
              t.tipo === 'exito'
                ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/40 dark:border-green-800 dark:text-green-300'
                : t.tipo === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/40 dark:border-red-800 dark:text-red-300'
                  : 'bg-slate-50 border-slate-200 text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100'
            }`}
          >
            {t.mensaje}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const contexto = useContext(ToastContext);
  if (!contexto) throw new Error('useToast debe usarse dentro de ToastProvider');
  return contexto;
};
