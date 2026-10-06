import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// roles: lista opcional de roles permitidos (legado).
// permiso: código opcional de permiso requerido (p. ej. "usuarios.ver").
// Sin ninguno de los dos, solo exige estar autenticado.
const ProtectedRoute = ({ roles, permiso }) => {
  const { usuario, tienePermiso } = useAuth();

  if (!usuario) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(usuario.rol)) return <Navigate to="/no-autorizado" replace />;
  if (permiso && !tienePermiso(permiso)) return <Navigate to="/no-autorizado" replace />;

  return <Outlet />;
};

export default ProtectedRoute;
