const { Op } = require('sequelize');
const db = require('../models');
const { sequelize, Pedido, DetallePedido, Producto, Cliente, MovimientoInventario, Usuario } = db;

const TRANSICIONES_VALIDAS = {
  Pendiente: ['Confirmado', 'Cancelado'],
  Confirmado: ['En preparación', 'Cancelado'],
  'En preparación': ['Enviado', 'Cancelado'],
  Enviado: ['Entregado', 'Cancelado'],
  Entregado: [],
  Cancelado: []
};

const generarNumeroPedido = async (t) => {
  const ultimo = await Pedido.findOne({ order: [['id', 'DESC']], transaction: t });
  const siguiente = (ultimo ? ultimo.id : 0) + 1;
  return `PED-${String(siguiente).padStart(6, '0')}`;
};

const aplicarScopeVendedor = (where, usuarioAutenticado) => {
  if (usuarioAutenticado.rol === 'Vendedor') {
    return { ...where, usuario_id: usuarioAutenticado.id };
  }
  return where;
};

const asegurarPropiedadOAdmin = (pedido, usuarioAutenticado) => {
  if (usuarioAutenticado.rol === 'Vendedor' && pedido.usuario_id !== usuarioAutenticado.id) {
    const error = new Error('No tienes permiso para acceder a este pedido');
    error.status = 403;
    throw error;
  }
};

// Crear un pedido NO toca el inventario: solo registra la intención de venta
// en estado "Pendiente" con el precio vigente de cada producto. La existencia
// se valida y se descuenta recién al confirmar (ver cambiarEstado), que es
// donde el negocio considera que el pedido queda comprometido de verdad.
const crear = async ({ cliente_id, items, observaciones }, usuarioAutenticado) => {
  const pedidoCreado = await sequelize.transaction(async (t) => {
    const cliente = await Cliente.findByPk(cliente_id, { transaction: t });
    if (!cliente || cliente.estado !== 'activo') {
      const error = new Error('Cliente no válido o inactivo');
      error.status = 400;
      throw error;
    }

    let subtotal = 0;
    const detalles = [];

    for (const item of items) {
      const producto = await Producto.findByPk(item.producto_id, { transaction: t });

      if (!producto || producto.estado !== 'activo') {
        const error = new Error(`El producto ${item.producto_id} no existe o está inactivo`);
        error.status = 400;
        throw error;
      }

      const subtotalLinea = Number(producto.precio) * item.cantidad;
      subtotal += subtotalLinea;

      detalles.push({
        producto_id: producto.id,
        cantidad: item.cantidad,
        precio_unitario: producto.precio,
        subtotal_linea: subtotalLinea
      });
    }

    const numero_pedido = await generarNumeroPedido(t);

    const pedido = await Pedido.create(
      {
        numero_pedido,
        cliente_id,
        usuario_id: usuarioAutenticado.id,
        estado: 'Pendiente',
        subtotal,
        total: subtotal,
        observaciones: observaciones || null
      },
      { transaction: t }
    );

    await DetallePedido.bulkCreate(
      detalles.map((d) => ({ ...d, pedido_id: pedido.id })),
      { transaction: t }
    );

    return pedido.id;
  });

  return obtenerPorId(pedidoCreado, usuarioAutenticado);
};

const listar = async (filtros, usuarioAutenticado) => {
  const where = aplicarScopeVendedor({}, usuarioAutenticado);
  if (filtros.estado) where.estado = filtros.estado;
  if (filtros.cliente_id) where.cliente_id = filtros.cliente_id;
  // Filtrar por vendedor solo tiene efecto para Admin: a un Vendedor ya se le
  // restringió el "where" a sus propios pedidos en aplicarScopeVendedor.
  if (filtros.vendedor_id && usuarioAutenticado.rol === 'Admin') {
    where.usuario_id = filtros.vendedor_id;
  }
  if (filtros.desde || filtros.hasta) {
    where.fecha_creacion = {};
    if (filtros.desde) where.fecha_creacion[Op.gte] = filtros.desde;
    if (filtros.hasta) where.fecha_creacion[Op.lte] = filtros.hasta;
  }

  return Pedido.findAll({
    where,
    include: [
      { model: Cliente, as: 'cliente', attributes: ['id', 'nombre_razon_social'] },
      { model: Usuario, as: 'creadoPor', attributes: ['id', 'nombre'] }
    ],
    order: [['fecha_creacion', 'DESC']]
  });
};

const obtenerPorId = async (id, usuarioAutenticado) => {
  const pedido = await Pedido.findByPk(id, {
    include: [
      { model: Cliente, as: 'cliente' },
      { model: Usuario, as: 'creadoPor', attributes: ['id', 'nombre'] },
      { model: DetallePedido, as: 'detalles', include: [{ model: Producto, as: 'producto' }] }
    ]
  });

  if (!pedido) {
    const error = new Error('Pedido no encontrado');
    error.status = 404;
    throw error;
  }

  asegurarPropiedadOAdmin(pedido, usuarioAutenticado);
  return pedido;
};

// Descuenta inventario de cada línea del pedido dentro de la transacción activa.
// Primero valida TODAS las líneas (con bloqueo de fila) y solo si hay stock
// suficiente para todas procede a descontar — así nunca queda un pedido con
// descuento parcial si un producto más adelante en la lista no alcanza.
const descontarInventarioPedido = async (pedido, usuarioAutenticado, t) => {
  const detalles = await DetallePedido.findAll({ where: { pedido_id: pedido.id }, transaction: t });

  const productosBloqueados = [];
  for (const detalle of detalles) {
    const producto = await Producto.findByPk(detalle.producto_id, { transaction: t, lock: t.LOCK.UPDATE });

    if (!producto || producto.estado !== 'activo') {
      const error = new Error(`El producto "${detalle.producto_id}" ya no está disponible`);
      error.status = 400;
      throw error;
    }

    if (producto.cantidad_disponible < detalle.cantidad) {
      const error = new Error(
        `No hay inventario suficiente para completar este pedido. Disponible: ${producto.cantidad_disponible} unidades de "${producto.nombre}" (se requieren ${detalle.cantidad}).`
      );
      error.status = 400;
      throw error;
    }

    productosBloqueados.push({ producto, cantidad: detalle.cantidad });
  }

  for (const { producto, cantidad } of productosBloqueados) {
    producto.cantidad_disponible -= cantidad;
    await producto.save({ transaction: t });

    await MovimientoInventario.create(
      {
        producto_id: producto.id,
        tipo: 'Salida',
        cantidad,
        motivo: 'Pedido',
        pedido_id: pedido.id,
        usuario_id: usuarioAutenticado.id
      },
      { transaction: t }
    );
  }
};

// Revierte exactamente el inventario descontado al confirmar. Solo se llama
// cuando el pedido cancelado venía de un estado distinto de "Pendiente"
// (es decir, ya había pasado por descontarInventarioPedido).
const revertirInventarioPedido = async (pedido, usuarioAutenticado, t) => {
  const detalles = await DetallePedido.findAll({ where: { pedido_id: pedido.id }, transaction: t });

  for (const detalle of detalles) {
    const producto = await Producto.findByPk(detalle.producto_id, { transaction: t, lock: t.LOCK.UPDATE });

    producto.cantidad_disponible += detalle.cantidad;
    await producto.save({ transaction: t });

    await MovimientoInventario.create(
      {
        producto_id: producto.id,
        tipo: 'Entrada',
        cantidad: detalle.cantidad,
        motivo: 'Devolución por cancelación',
        pedido_id: pedido.id,
        usuario_id: usuarioAutenticado.id
      },
      { transaction: t }
    );
  }
};

const cambiarEstado = async (id, nuevoEstado, usuarioAutenticado) => {
  return sequelize.transaction(async (t) => {
    const pedido = await Pedido.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!pedido) {
      const error = new Error('Pedido no encontrado');
      error.status = 404;
      throw error;
    }

    asegurarPropiedadOAdmin(pedido, usuarioAutenticado);

    const estadoAnterior = pedido.estado;
    const permitidas = TRANSICIONES_VALIDAS[estadoAnterior] || [];
    if (!permitidas.includes(nuevoEstado)) {
      const error = new Error(`No se puede pasar de "${estadoAnterior}" a "${nuevoEstado}"`);
      error.status = 400;
      throw error;
    }

    // "Confirmado" solo es alcanzable desde "Pendiente" (ver TRANSICIONES_VALIDAS),
    // así que este bloque se ejecuta como máximo una vez por pedido: no existe
    // manera de volver a confirmarlo y descontar el inventario dos veces.
    if (nuevoEstado === 'Confirmado') {
      await descontarInventarioPedido(pedido, usuarioAutenticado, t);
    }

    // Si se cancela un pedido que ya había sido confirmado (o más adelante en el
    // flujo), su inventario ya fue descontado y debe devolverse. Si se cancela
    // estando aún "Pendiente", nunca se tocó el inventario y no hay nada que revertir.
    if (nuevoEstado === 'Cancelado' && estadoAnterior !== 'Pendiente') {
      await revertirInventarioPedido(pedido, usuarioAutenticado, t);
    }

    pedido.estado = nuevoEstado;
    await pedido.save({ transaction: t });
    return pedido;
  });
};

module.exports = { crear, listar, obtenerPorId, cambiarEstado };
