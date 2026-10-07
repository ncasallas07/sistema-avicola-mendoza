import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Lock, ShieldAlert } from 'lucide-react';
import * as authService from '../services/auth.service';
import Logo from '../components/Logo';
import Button from '../components/Button';
import ThemeToggle from '../components/ThemeToggle';

const RestablecerContrasena = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState('');

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setEnviando(true);
    try {
      await authService.restablecerPassword(token, password);
      setListo(true);
    } catch (err) {
      // El backend responde el mismo mensaje para token inválido, expirado o
      // ya usado (ver services/passwordReset.service.js): no hace falta
      // distinguir casos en el frontend, solo mostrarlo y ofrecer pedir uno nuevo.
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 px-4">
      <ThemeToggle className="absolute right-4 top-4 !text-white/80 hover:!bg-white/10" />
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo tamano="lg" claro />
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-2xl dark:bg-slate-800">
          {!token ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/40">
                <ShieldAlert size={24} className="text-red-500 dark:text-red-400" />
              </div>
              <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Enlace inválido</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Este enlace no incluye un token de recuperación válido. Solicita uno nuevo.
              </p>
              <Link
                to="/olvide-contrasena"
                className="mt-2 flex items-center gap-1 text-sm text-emerald-700 hover:underline dark:text-emerald-400"
              >
                <ArrowLeft size={14} /> Solicitar un nuevo enlace
              </Link>
            </div>
          ) : listo ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/40">
                <CheckCircle2 size={24} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Contraseña restablecida</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Tu contraseña se actualizó correctamente. Ya puedes iniciar sesión con ella.
              </p>
              <Link to="/login" className="mt-2 w-full">
                <Button className="w-full">Ir a iniciar sesión</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Restablecer contraseña</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Elige una nueva contraseña para tu cuenta.</p>
              </div>

              <form onSubmit={manejarSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Nueva contraseña</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
                      placeholder="••••••••"
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Mínimo 8 caracteres.</p>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Confirmar contraseña</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={confirmar}
                      onChange={(e) => setConfirmar(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
                    <AlertCircle size={16} className="shrink-0" />
                    {error}
                  </div>
                )}

                <Button type="submit" loading={enviando} className="mt-1 w-full" size="lg">
                  {enviando ? 'Guardando...' : 'Restablecer contraseña'}
                </Button>

                <Link to="/login" className="flex items-center justify-center gap-1 text-sm text-emerald-700 hover:underline dark:text-emerald-400">
                  <ArrowLeft size={14} /> Volver al inicio de sesión
                </Link>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestablecerContrasena;
