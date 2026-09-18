import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Package,
  Boxes,
  Truck,
  BarChart3,
  KeyRound,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

const ITEMS_NAV = [
  { to: '/', etiqueta: 'Dashboard', roles: ['Admin', 'Vendedor'], Icono: LayoutDashboard },
  { to: '/pedidos', etiqueta: 'Pedidos', roles: ['Admin', 'Vendedor'], Icono: ClipboardList },
  { to: '/clientes', etiqueta: 'Clientes', roles: ['Admin', 'Vendedor'], Icono: Users },
  { to: '/productos', etiqueta: 'Productos', roles: ['Admin', 'Vendedor'], Icono: Package },
  { to: '/inventario', etiqueta: 'Inventario', roles: ['Admin', 'Vendedor'], Icono: Boxes },
  { to: '/proveedores', etiqueta: 'Proveedores', roles: ['Admin'], Icono: Truck },
  { to: '/reportes', etiqueta: 'Reportes', roles: ['Admin'], Icono: BarChart3 },
  { to: '/usuarios', etiqueta: 'Usuarios', roles: ['Admin'], Icono: KeyRound }
];

const Layout = () => {
  const { usuario, cerrarSesion } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const navigate = useNavigate();

  const itemsVisibles = ITEMS_NAV.filter((item) => item.roles.includes(usuario?.rol));

  const salir = async () => {
    await cerrarSesion();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Barra superior */}
      <header className="fixed top-0 inset-x-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
        <div className="flex items-center gap-3">
          <button
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
            onClick={() => setMenuAbierto((v) => !v)}
            aria-label="Abrir menú"
          >
            {menuAbierto ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Logo tamano="sm" />
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden text-right text-sm sm:block">
            <p className="font-medium text-slate-700">{usuario?.nombre}</p>
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">{usuario?.rol}</p>
          </div>
          <button
            onClick={salir}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      {/* Menú lateral */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-20 w-64 transform bg-emerald-900 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          menuAbierto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="flex flex-col gap-1 p-3">
          {itemsVisibles.map(({ to, etiqueta, Icono }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setMenuAbierto(false)}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-lg border-l-[3px] px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? 'border-amber-400 bg-emerald-800 text-white'
                    : 'border-transparent text-emerald-100/70 hover:border-amber-400/40 hover:bg-emerald-800/60 hover:text-white'
                }`
              }
            >
              <Icono size={18} strokeWidth={2} />
              {etiqueta}
            </NavLink>
          ))}
        </nav>
      </aside>

      {menuAbierto && (
        <div
          className="fixed inset-0 z-10 bg-slate-900/40 md:hidden"
          onClick={() => setMenuAbierto(false)}
        />
      )}

      {/* Contenido */}
      <main className="pt-16 md:pl-64">
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
