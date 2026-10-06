const request = require('supertest');
const app = require('../app');
const { limpiarBaseDatos, sembrarBase, PASSWORD_PRUEBA, db } = require('./helpers/db');
const { login } = require('./helpers/auth');

// Esta suite ejercita el flujo completo exigido por la observación del
// profesor: crear un rol nuevo desde la API (sin tocar código), asignarle
// permisos puntuales, asignárselo a un usuario, y comprobar que ese usuario
// queda limitado EXACTAMENTE a esos permisos — incluso llamando a los
// endpoints directamente, sin pasar por el frontend.
describe('Roles y permisos dinámicos', () => {
  let tokenAdmin;
  let usuarioAdmin;
  let categoriaId;
  let productoId;

  beforeEach(async () => {
    await limpiarBaseDatos();
    const semilla = await sembrarBase();
    usuarioAdmin = semilla.usuarioAdmin;
    categoriaId = semilla.categoria.id;
    tokenAdmin = (await login(usuarioAdmin.email, PASSWORD_PRUEBA)).token;

    const producto = await db.Producto.create({
      nombre: 'Producto para inventario',
      categoria_id: categoriaId,
      unidad_medida: 'kg',
      precio: 5000,
      cantidad_disponible: 100,
      stock_minimo: 10,
      estado: 'activo'
    });
    productoId = producto.id;
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  const obtenerIdPermiso = async (codigo) => {
    const res = await request(app)
      .get('/api/permisos')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    return res.body.data.find((p) => p.codigo === codigo).id;
  };

  it('el catálogo de permisos no está vacío e incluye los módulos reales del sistema', async () => {
    const res = await request(app).get('/api/permisos').set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    const codigos = res.body.data.map((p) => p.codigo);
    expect(codigos).toContain('inventario.ver');
    expect(codigos).toContain('inventario.registrar_movimiento');
    expect(codigos).toContain('roles.asignar_permisos');
  });

  it('flujo completo: crear rol personalizado -> asignar permisos -> asignar a usuario -> acceso real -> retirar permiso -> bloqueo real', async () => {
    // PASO 3-6: Admin crea el rol "Auxiliar de inventario"
    const crearRol = await request(app)
      .post('/api/roles')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Auxiliar de inventario', descripcion: 'Consulta productos e inventario' });
    expect(crearRol.status).toBe(201);
    const rolId = crearRol.body.data.id;

    const idInventarioVer = await obtenerIdPermiso('inventario.ver');
    const idInventarioRegistrar = await obtenerIdPermiso('inventario.registrar_movimiento');
    const idProductosVer = await obtenerIdPermiso('productos.ver');

    const asignar = await request(app)
      .put(`/api/roles/${rolId}/permisos`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ permisos: [idInventarioVer, idInventarioRegistrar, idProductosVer] });
    expect(asignar.status).toBe(200);

    // PASO 7-8: Admin crea un usuario con ese rol
    const crearUsuario = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        nombre: 'Auxiliar Uno',
        email: 'auxiliar.inventario@avicolamendoza.com',
        password: 'Auxiliar123!',
        rol_id: rolId
      });
    expect(crearUsuario.status).toBe(201);

    // PASO 9: el usuario inicia sesión
    const sesionAuxiliar = await login('auxiliar.inventario@avicolamendoza.com', 'Auxiliar123!');
    const tokenAuxiliar = sesionAuxiliar.token;
    expect(sesionAuxiliar.usuario.permisos).toEqual(
      expect.arrayContaining(['inventario.ver', 'inventario.registrar_movimiento', 'productos.ver'])
    );

    // PASO 10: puede ver productos, ver inventario y registrar movimientos
    const verProductos = await request(app).get('/api/productos').set('Authorization', `Bearer ${tokenAuxiliar}`);
    expect(verProductos.status).toBe(200);

    const verInventario = await request(app).get('/api/inventario').set('Authorization', `Bearer ${tokenAuxiliar}`);
    expect(verInventario.status).toBe(200);

    const registrarEntrada = await request(app)
      .post('/api/inventario/entrada')
      .set('Authorization', `Bearer ${tokenAuxiliar}`)
      .send({ producto_id: productoId, cantidad: 10, motivo: 'Compra' });
    expect(registrarEntrada.status).toBe(201);

    // ...pero NO puede gestionar usuarios, roles, ni eliminar productos, ni ver reportes
    expect((await request(app).get('/api/usuarios').set('Authorization', `Bearer ${tokenAuxiliar}`)).status).toBe(403);
    expect((await request(app).get('/api/roles').set('Authorization', `Bearer ${tokenAuxiliar}`)).status).toBe(403);
    expect(
      (
        await request(app)
          .patch(`/api/productos/${productoId}/estado`)
          .set('Authorization', `Bearer ${tokenAuxiliar}`)
          .send({ estado: 'inactivo' })
      ).status
    ).toBe(403);
    expect((await request(app).get('/api/reportes/ventas').set('Authorization', `Bearer ${tokenAuxiliar}`)).status).toBe(403);

    // PASO 11: el administrador retira inventario.registrar_movimiento
    const retirar = await request(app)
      .put(`/api/roles/${rolId}/permisos`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ permisos: [idInventarioVer, idProductosVer] });
    expect(retirar.status).toBe(200);

    // PASO 12-13: con el MISMO token (sin reiniciar sesión), ya no puede registrar movimientos
    const segundoIntento = await request(app)
      .post('/api/inventario/entrada')
      .set('Authorization', `Bearer ${tokenAuxiliar}`)
      .send({ producto_id: productoId, cantidad: 5, motivo: 'Compra' });
    expect(segundoIntento.status).toBe(403);
    expect(segundoIntento.body.message).toMatch(/no tienes permisos/i);

    // pero sigue pudiendo ver inventario, porque ese permiso no se tocó
    const verInventarioDespues = await request(app).get('/api/inventario').set('Authorization', `Bearer ${tokenAuxiliar}`);
    expect(verInventarioDespues.status).toBe(200);
  });

  it('rechaza nombres de rol duplicados', async () => {
    const res = await request(app)
      .post('/api/roles')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Admin' });
    expect(res.status).toBe(409);
  });

  it('no permite eliminar un rol que tiene usuarios asociados', async () => {
    const roles = await request(app).get('/api/roles').set('Authorization', `Bearer ${tokenAdmin}`);
    const rolVendedor = roles.body.data.find((r) => r.nombre === 'Vendedor');

    const res = await request(app).delete(`/api/roles/${rolVendedor.id}`).set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(409);
  });

  it('no permite desactivar el único rol que puede administrar roles y usuarios', async () => {
    const roles = await request(app).get('/api/roles').set('Authorization', `Bearer ${tokenAdmin}`);
    const rolAdmin = roles.body.data.find((r) => r.nombre === 'Admin');

    const res = await request(app)
      .patch(`/api/roles/${rolAdmin.id}/estado`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'inactivo' });
    expect(res.status).toBe(409);
  });

  it('no permite retirarle al único administrador el permiso que le permite seguir administrando', async () => {
    const roles = await request(app).get('/api/roles').set('Authorization', `Bearer ${tokenAdmin}`);
    const rolAdmin = roles.body.data.find((r) => r.nombre === 'Admin');
    const permisos = await request(app).get('/api/permisos').set('Authorization', `Bearer ${tokenAdmin}`);
    const idsSinCambiarRol = permisos.body.data
      .filter((p) => p.codigo !== 'usuarios.cambiar_rol')
      .map((p) => p.id);

    const res = await request(app)
      .put(`/api/roles/${rolAdmin.id}/permisos`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ permisos: idsSinCambiarRol });
    expect(res.status).toBe(409);
  });

  it('no permite desactivar al único usuario administrador activo', async () => {
    const res = await request(app)
      .patch(`/api/usuarios/${usuarioAdmin.id}/estado`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'inactivo' });
    expect(res.status).toBe(409);
  });

  it('cambiar el rol de un usuario exige el permiso usuarios.cambiar_rol, no solo usuarios.editar', async () => {
    // Crear un rol con usuarios.editar pero SIN usuarios.cambiar_rol
    const crearRol = await request(app)
      .post('/api/roles')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Soporte', descripcion: 'Edita datos de usuarios, no su rol' });
    const rolId = crearRol.body.data.id;
    const idUsuariosEditar = await obtenerIdPermiso('usuarios.editar');
    await request(app)
      .put(`/api/roles/${rolId}/permisos`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ permisos: [idUsuariosEditar] });

    const crearUsuarioSoporte = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Soporte Uno', email: 'soporte@avicolamendoza.com', password: 'Soporte123!', rol_id: rolId });
    const tokenSoporte = (await login('soporte@avicolamendoza.com', 'Soporte123!')).token;

    const vendedorRol = (await request(app).get('/api/roles').set('Authorization', `Bearer ${tokenAdmin}`)).body.data.find(
      (r) => r.nombre === 'Vendedor'
    );

    // Puede editar el nombre de otro usuario...
    const editarNombre = await request(app)
      .put(`/api/usuarios/${crearUsuarioSoporte.body.data.id}`)
      .set('Authorization', `Bearer ${tokenSoporte}`)
      .send({ nombre: 'Soporte Editado' });
    expect(editarNombre.status).toBe(200);

    // ...pero no puede cambiarle el rol a nadie
    const cambiarRol = await request(app)
      .put(`/api/usuarios/${crearUsuarioSoporte.body.data.id}`)
      .set('Authorization', `Bearer ${tokenSoporte}`)
      .send({ rol_id: vendedorRol.id });
    expect(cambiarRol.status).toBe(403);
  });
});
