'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('movimientos_inventario', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      producto_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'productos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      tipo: { type: Sequelize.ENUM('Entrada', 'Salida'), allowNull: false },
      cantidad: { type: Sequelize.INTEGER, allowNull: false },
      motivo: {
        type: Sequelize.ENUM('Compra', 'Ajuste', 'Pedido', 'Devolución por cancelación'),
        allowNull: false
      },
      pedido_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'pedidos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      fecha: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW }
    });
    await queryInterface.addIndex('movimientos_inventario', ['producto_id']);
    await queryInterface.addIndex('movimientos_inventario', ['fecha']);
    await queryInterface.addIndex('movimientos_inventario', ['pedido_id']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('movimientos_inventario');
  }
};
