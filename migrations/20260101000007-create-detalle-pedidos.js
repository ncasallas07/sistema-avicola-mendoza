'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('detalle_pedidos', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      pedido_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'pedidos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      producto_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'productos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      cantidad: { type: Sequelize.INTEGER, allowNull: false },
      precio_unitario: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      subtotal_linea: { type: Sequelize.DECIMAL(12, 2), allowNull: false }
    });
    await queryInterface.addIndex('detalle_pedidos', ['pedido_id']);
    await queryInterface.addIndex('detalle_pedidos', ['producto_id']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('detalle_pedidos');
  }
};
