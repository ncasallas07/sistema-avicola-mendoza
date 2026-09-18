'use strict';

module.exports = {
  up: async (queryInterface) => {
    const productos = [
      { id: 1, cantidad: 80 },
      { id: 2, cantidad: 50 },
      { id: 3, cantidad: 40 },
      { id: 4, cantidad: 60 },
      { id: 5, cantidad: 8 },
      { id: 6, cantidad: 25 }
    ];

    await queryInterface.bulkInsert(
      'movimientos_inventario',
      productos.map((p) => ({
        producto_id: p.id,
        tipo: 'Entrada',
        cantidad: p.cantidad,
        motivo: 'Compra',
        pedido_id: null,
        usuario_id: 1,
        fecha: new Date()
      }))
    );
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('movimientos_inventario', { motivo: 'Compra' }, {});
  }
};
