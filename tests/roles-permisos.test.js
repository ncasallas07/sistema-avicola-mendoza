const request = require('supertest');
const app = require('../app');
const { limpiarBaseDatos, sembrarBase, crearCliente, crearProducto, PASSWORD_PRUEBA, db } = require('./helpers/db');
const { login } = require('./helpers/auth');

describe('Roles y permisos', () => {
  let tokenAdmin;
  let tokenVendedor1;
  let tokenVendedor2;
  let usuarioVendedor1;
  let pedidoDeVendedor1;
  let categoriaId;

  beforeAll(async () => {
    await limpiarBaseDatos();
    const semilla = await sembrarBase();
    usuarioVendedor1 = semilla.usuarioVendedor1;
    categoriaId = semilla.categoria.id;

    tokenAdmin = (await login(semilla.usuarioAdmin.email, PASSWORD_PRUEBA)).token;
    tokenVendedor1 = (await login(semilla.usuarioVendedor1.email, PASSWORD_PRUEBA)).token;
    tokenVendedor2 = (await login(semilla.usuarioVendedor2.email, PASSWORD_PRUEBA)).token;

    const cliente = await crearCliente();
    const producto = await crearProducto(semilla.categoria.id, { cantidad_disponible: 100 });

    const resPedido = await request(app)
      .post('/api/pedidos')
      .set('Authorization', `Bearer ${tokenVendedor1}`)
      .send({ cliente_id: cliente.id, items: [{ producto_id: producto.id, cantidad: 2 }] });
    pedidoDeVendedor1 = resPedido.body.data;
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe('Endpoints exclusivos de Administrador', () => {
    it('Admin puede listar usuarios', async () => {
      const res = await request(app).get('/api/usuarios').set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.status).toBe(200);
    });

    it('Vendedor NO puede listar usuarios', async () => {
      const res = await request(app).get('/api/usuarios').set('Authorization', `Bearer ${tokenVendedor1}`);
      expect(res.status).toBe(403);
    });

    it('Vendedor NO puede crear proveedores', async () => {
      const res = await request(app)
        .post('/api/proveedores')
        .set('Authorization', `Bearer ${tokenVendedor1}`)
        .send({ nombre_razon_social: 'Proveedor X', identificacion: '900123456' });
      expect(res.status).toBe(403);
    });

    it('Admin sí puede crear proveedores', async () => {
      const res = await request(app)
        .post('/api/proveedores')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ nombre_razon_social: 'Proveedor X', identificacion: '900123456' });
      expect(res.status).toBe(201);
    });

    it('Vendedor NO puede activar/desactivar productos', async () => {
      const producto = await crearProducto(categoriaId);
      const res = await request(app)
        .patch(`/api/productos/${producto.id}/estado`)
        .set('Authorization', `Bearer ${tokenVendedor1}`)
        .send({ estado: 'inactivo' });
      expect(res.status).toBe(403);
    });

    it('Vendedor NO puede registrar movimientos de inventario manuales', async () => {
      const producto = await crearProducto(categoriaId);
      const res = await request(app)
        .post('/api/inventario/entrada')
        .set('Authorization', `Bearer ${tokenVendedor1}`)
        .send({ producto_id: producto.id, cantidad: 10, motivo: 'Compra' });
      expect(res.status).toBe(403);
    });
  });

  describe('Aislamiento de pedidos entre vendedores', () => {
    it('el vendedor dueño puede ver su propio pedido', async () => {
      const res = await request(app)
        .get(`/api/pedidos/${pedidoDeVendedor1.id}`)
        .set('Authorization', `Bearer ${tokenVendedor1}`);
      expect(res.status).toBe(200);
    });

    it('otro vendedor NO puede ver el pedido por su ID aunque lo conozca', async () => {
      const res = await request(app)
        .get(`/api/pedidos/${pedidoDeVendedor1.id}`)
        .set('Authorization', `Bearer ${tokenVendedor2}`);
      expect(res.status).toBe(403);
    });

    it('otro vendedor NO puede cambiar el estado del pedido ajeno', async () => {
      const res = await request(app)
        .patch(`/api/pedidos/${pedidoDeVendedor1.id}/estado`)
        .set('Authorization', `Bearer ${tokenVendedor2}`)
        .send({ estado: 'Confirmado' });
      expect(res.status).toBe(403);
    });

    it('otro vendedor NO puede descargar el comprobante del pedido ajeno', async () => {
      const res = await request(app)
        .get(`/api/pedidos/${pedidoDeVendedor1.id}/comprobante`)
        .set('Authorization', `Bearer ${tokenVendedor2}`);
      expect(res.status).toBe(403);
    });

    it('el listado de pedidos de un vendedor NO incluye pedidos de otro vendedor', async () => {
      const res = await request(app).get('/api/pedidos').set('Authorization', `Bearer ${tokenVendedor2}`);
      expect(res.status).toBe(200);
      const idsAjenos = res.body.data.map((p) => p.id);
      expect(idsAjenos).not.toContain(pedidoDeVendedor1.id);
    });

    it('Admin sí ve todos los pedidos, incluido el del vendedor', async () => {
      const res = await request(app).get('/api/pedidos').set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.status).toBe(200);
      const ids = res.body.data.map((p) => p.id);
      expect(ids).toContain(pedidoDeVendedor1.id);
    });
  });
});
