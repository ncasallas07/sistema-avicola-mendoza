import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import Logo from '../components/Logo';
import Button from '../components/Button';

const NoAutorizado = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-slate-100 px-4 text-center">
      <Logo tamano="md" />

      <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white px-8 py-10 shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <ShieldAlert size={32} className="text-red-500" strokeWidth={2} />
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-red-400">Error 403</p>
          <h1 className="mt-1 text-xl font-bold text-slate-800">Acceso no autorizado</h1>
        </div>

        <p className="max-w-xs text-sm text-slate-500">
          No tienes permisos suficientes para acceder a esta sección. Si crees que esto es un error,
          contacta a un administrador.
        </p>

        <div className="mt-2 flex gap-3">
          <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate(-1)}>
            Volver
          </Button>
          <Link to="/">
            <Button icon={Home}>Ir al inicio</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NoAutorizado;
