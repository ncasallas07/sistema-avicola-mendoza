import { useCallback, useState } from 'react';

// Envuelve ConfirmDialog en un hook tipo Promise, para no repetir el manejo
// de estado del modal en cada página que necesita confirmar una acción.
export const useConfirm = () => {
  const [estado, setEstado] = useState({ abierto: false, resolve: null, opciones: {} });

  const confirmar = useCallback((opciones) => {
    return new Promise((resolve) => {
      setEstado({ abierto: true, resolve, opciones });
    });
  }, []);

  const manejarConfirmar = () => {
    estado.resolve?.(true);
    setEstado((e) => ({ ...e, abierto: false }));
  };

  const manejarCancelar = () => {
    estado.resolve?.(false);
    setEstado((e) => ({ ...e, abierto: false }));
  };

  return {
    confirmar,
    dialogProps: {
      abierto: estado.abierto,
      ...estado.opciones,
      onConfirmar: manejarConfirmar,
      onCancelar: manejarCancelar
    }
  };
};
