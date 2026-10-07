import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react';
import * as authService from '../services/auth.service';
import Logo from '../components/Logo';
import Button from '../components/Button';
import ThemeToggle from '../components/ThemeToggle';

const OlvideContrasena = () => {
  const [email, setEmail] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      // El backend siempre responde igual exista o no el correo (ver
      // controllers/auth.controller.js): aquí solo se muestra esa misma
      // respuesta genérica, nunca se infiere si el correo existe.
      await authService.solicitarRecuperacion(email);
      setEnviado(true);
    } catch (err) {
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
          {enviado ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/40">
                <CheckCircle2 size={24} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Revisa tu correo</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña en los próximos
                minutos.
              </p>
              <Link to="/login" className="mt-2 flex items-center gap-1 text-sm text-emerald-700 hover:underline dark:text-emerald-400">
                <ArrowLeft size={14} /> Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">¿Olvidaste tu contraseña?</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Ingresa tu correo y te enviaremos un enlace para restablecerla.
                </p>
              </div>

              <form onSubmit={manejarSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Correo</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
                      placeholder="tu@correo.com"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
                    {error}
                  </div>
                )}

                <Button type="submit" loading={enviando} className="mt-1 w-full" size="lg">
                  {enviando ? 'Enviando...' : 'Enviar instrucciones'}
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

export default OlvideContrasena;
