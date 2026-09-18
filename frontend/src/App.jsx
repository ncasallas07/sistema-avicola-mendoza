import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import NoAutorizado from './pages/NoAutorizado';

function App() {
  return (
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

                <Route element={<ProtectedRoute roles={['Admin']} />}>
                  <Route path="/productos/nuevo" element={<ProductoForm />} />
                  <Route path="/productos/:id/editar" element={<ProductoForm />} />
                  <Route path="/proveedores" element={<ProveedoresList />} />
                  <Route path="/proveedores/nuevo" element={<ProveedorForm />} />
                  <Route path="/proveedores/:id/editar" element={<ProveedorForm />} />
                  <Route path="/reportes" element={<Reportes />} />
                  <Route path="/usuarios" element={<UsuariosList />} />
                  <Route path="/usuarios/nuevo" element={<UsuarioForm />} />
                  <Route path="/usuarios/:id/editar" element={<UsuarioForm />} />
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
  );
}

export default App;
