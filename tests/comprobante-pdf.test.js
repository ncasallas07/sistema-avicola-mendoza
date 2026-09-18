const request = require('supertest');
const app = require('../app');
const { limpiarBaseDatos, sembrarBase, crearCliente, crearProducto, PASSWORD_PRUEBA, db } = require('./helpers/db');
const { login } = require('./helpers/auth');

describe('Comprobante comercial de pedido (PDF)', () => {
  let tokenAdmin;
  let tokenVendedor1;
  let tokenVendedor2;
  let pedido;

  beforeAll(async () => {
    await limpiarBaseDatos();
    const semilla = await sembrarBase();
    tokenAdmin = (await login(semilla.usuarioAdmin.email, PASSWORD_PRUEBA)).token;
    tokenVendedor1 = (await login(semilla.usuarioVendedor1.email, PASSWORD_PRUEBA)).token;
    tokenVendedor2 = (await login(semilla.usuarioVendedor2.email, PASSWORD_PRUEBA)).token;

    const cliente = await crearCliente({ nombre_razon_social: 'Cliente Comprobante' });
    const producto = await crearProducto(semilla.categoria.id, { nombre: 'Producto Comprobante', cantidad_disponible: 20 });

    const crear = await request(app)
      .post('/api/pedidos')
      .set('Authorization', `Bearer ${tokenVendedor1}`)
      .send({ cliente_id: cliente.id, items: [{ producto_id: producto.id, cantidad: 3 }] });
    pedido = crear.body.data;
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  it('el dueño del pedido puede generar y descargar el PDF', async () => {
    const res = await request(app)
      .get(`/api/pedidos/${pedido.id}/comprobante`)
      .set('Authorization', `Bearer ${tokenVendedor1}`)
      // application/pdf no tiene parser por defecto en superagent; se fuerza
      // a recibir los bytes crudos como Buffer para poder verificarlos.
      .buffer(true)
      .parse((response, callback) => {
        const trozos = [];
        response.on('data', (trozo) => trozos.push(trozo));
        response.on('end', () => callback(null, Buffer.concat(trozos)));
      });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toContain(`Comprobante-Pedido-${pedido.numero_pedido.replace('PED-', '')}.pdf`);

    // Verifica que sea un PDF real (encabezado %PDF), no HTML disfrazado.
    expect(Buffer.isBuffer(res.body)).toBe(true);
    expect(res.body.slice(0, 4).toString('utf-8')).toBe('%PDF');
    expect(res.body.length).toBeGreaterThan(500);
  });

  it('Admin puede ver el comprobante de cualquier pedido', async () => {
    const res = await request(app)
      .get(`/api/pedidos/${pedido.id}/comprobante`)
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
  });

  it('otro vendedor NO puede generar el comprobante de un pedido ajeno', async () => {
    const res = await request(app)
      .get(`/api/pedidos/${pedido.id}/comprobante`)
      .set('Authorization', `Bearer ${tokenVendedor2}`);
    expect(res.status).toBe(403);
  });

  it('devuelve 404 al pedir el comprobante de un pedido inexistente', async () => {
    const res = await request(app)
      .get('/api/pedidos/999999/comprobante')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(404);
  });
});
