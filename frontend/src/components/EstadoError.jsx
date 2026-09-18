import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import Button from './Button';

// Estado de error reutilizable para pantallas de detalle (pedido, cliente...)
// cuando el recurso no se pudo cargar: evita dejar el área de contenido en
// blanco con nada más que un toast que desaparece a los pocos segundos.
const EstadoError = ({ titulo = 'No se pudo cargar la información', mensaje, textoVolver = 'Volver', rutaVolver = '/' }) => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
      <AlertCircle size={22} className="text-red-500" />
    </div>
    <h2 className="font-semibold text-slate-800">{titulo}</h2>
    {mensaje && <p className="max-w-xs text-sm text-slate-500">{mensaje}</p>}
    <Link to={rutaVolver}>
      <Button variant="secondary" size="sm">{textoVolver}</Button>
    </Link>
  </div>
);

export default EstadoError;
