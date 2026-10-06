import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ClientesList from './pages/clientes/ClientesList';
import ClienteForm from './pages/clientes/ClienteForm';
import ClienteDetalle from './pages/clientes/ClienteDetalle';
import ProveedoresList from './pages/proveedores/ProveedoresList';
import ProveedorForm from './pages/proveedores/ProveedorForm';
import ProductosList from './pages/productos/ProductosList';
import ProductoForm from './pages/productos/ProductoForm';
import Inventario from './pages/inventario/Inventario';
import MovimientosInventario from './pages/inventario/MovimientosInventario';
import PedidosList from './pages/pedidos/PedidosList';
import PedidoForm from './pages/pedidos/PedidoForm';
import PedidoDetalle from './pages/pedidos/PedidoDetalle';
import ComprobantePreview from './pages/pedidos/ComprobantePreview';
import Reportes from './pages/reportes/Reportes';
import UsuariosList from './pages/usuarios/UsuariosList';
import UsuarioForm from './pages/usuarios/UsuarioForm';
import RolesList from './pages/roles/RolesList';
import RolForm from './pages/roles/RolForm';
import NoAutorizado from './pages/NoAutorizado';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              {/* Fuera del Layout: el comprobante no debe mostrar sidebar ni navegación */}
              <Route path="/pedidos/:id/comprobante" element={<ComprobantePreview />} />

              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />

                <Route path="/clientes" element={<ClientesList />} />
                <Route path="/clientes/nuevo" element={<ClienteForm />} />
                <Route path="/clientes/:id/editar" element={<ClienteForm />} />
                <Route path="/clientes/:id" element={<ClienteDetalle />} />

                <Route path="/productos" element={<ProductosList />} />
                <Route path="/inventario" element={<Inventario />} />
                <Route path="/inventario/movimientos" element={<MovimientosInventario />} />

                <Route path="/pedidos" element={<PedidosList />} />
                <Route path="/pedidos/nuevo" element={<PedidoForm />} />
                <Route path="/pedidos/:id" element={<PedidoDetalle />} />

                <Route element={<ProtectedRoute permiso="productos.crear" />}>
                  <Route path="/productos/nuevo" element={<ProductoForm />} />
                  <Route path="/productos/:id/editar" element={<ProductoForm />} />
                </Route>

                <Route element={<ProtectedRoute permiso="proveedores.ver" />}>
                  <Route path="/proveedores" element={<ProveedoresList />} />
                </Route>
                <Route element={<ProtectedRoute permiso="proveedores.crear" />}>
                  <Route path="/proveedores/nuevo" element={<ProveedorForm />} />
                </Route>
                <Route element={<ProtectedRoute permiso="proveedores.editar" />}>
                  <Route path="/proveedores/:id/editar" element={<ProveedorForm />} />
                </Route>

                <Route element={<ProtectedRoute permiso="reportes.ver" />}>
                  <Route path="/reportes" element={<Reportes />} />
                </Route>

                <Route element={<ProtectedRoute permiso="usuarios.ver" />}>
                  <Route path="/usuarios" element={<UsuariosList />} />
                </Route>
                <Route element={<ProtectedRoute permiso="usuarios.crear" />}>
                  <Route path="/usuarios/nuevo" element={<UsuarioForm />} />
                </Route>
                <Route element={<ProtectedRoute permiso="usuarios.editar" />}>
                  <Route path="/usuarios/:id/editar" element={<UsuarioForm />} />
                </Route>

                <Route element={<ProtectedRoute permiso="roles.ver" />}>
                  <Route path="/roles" element={<RolesList />} />
                </Route>
                <Route element={<ProtectedRoute permiso="roles.crear" />}>
                  <Route path="/roles/nuevo" element={<RolForm />} />
                </Route>
                <Route element={<ProtectedRoute permiso="roles.editar" />}>
                  <Route path="/roles/:id/editar" element={<RolForm />} />
                </Route>
              </Route>
            </Route>

            <Route path="/no-autorizado" element={<NoAutorizado />} />

            {/* Cualquier ruta no definida cae aquí en vez de dejar la página en
                blanco; "/" ya resuelve por su cuenta a login o al dashboard
                según haya o no sesión iniciada. */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
