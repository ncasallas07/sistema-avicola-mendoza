import { createContext, useContext, useEffect, useState } from 'react';
import * as authService from '../services/auth.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(() => {
    const guardado = localStorage.getItem('usuario');
    return guardado ? JSON.parse(guardado) : null;
  });
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (usuario) {
      localStorage.setItem('usuario', JSON.stringify(usuario));
    } else {
      localStorage.removeItem('usuario');
    }
  }, [usuario]);

  const iniciarSesion = async (email, password) => {
    setCargando(true);
    try {
      const { token, usuario: datosUsuario } = await authService.login(email, password);
      localStorage.setItem('token', token);
      setUsuario(datosUsuario);
      return datosUsuario;
    } finally {
      setCargando(false);
    }
  };

  const cerrarSesion = async () => {
    await authService.logout();
    localStorage.removeItem('token');
    setUsuario(null);
  };

  // Vuelve a consultar al backend los permisos vigentes del usuario (p. ej.
  // después de que un administrador le retire un permiso a su rol mientras
  // sigue con la sesión abierta en otra pestaña).
  const refrescarPermisos = async () => {
    const datos = await authService.obtenerPerfil();
    setUsuario((actual) => (actual ? { ...actual, permisos: datos.permisos } : actual));
  };

  const esAdmin = usuario?.rol === 'Admin';
  const esVendedor = usuario?.rol === 'Vendedor';
  const tienePermiso = (codigo) => Boolean(usuario?.permisos?.includes(codigo));

  return (
    <AuthContext.Provider
      value={{ usuario, cargando, iniciarSesion, cerrarSesion, refrescarPermisos, esAdmin, esVendedor, tienePermiso }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return contexto;
};
