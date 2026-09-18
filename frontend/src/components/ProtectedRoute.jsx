import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// roles: lista opcional de roles permitidos. Sin ella, solo exige estar autenticado.
const ProtectedRoute = ({ roles }) => {
  const { usuario } = useAuth();

  if (!usuario) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(usuario.rol)) return <Navigate to="/no-autorizado" replace />;

  return <Outlet />;
};

export default ProtectedRoute;
