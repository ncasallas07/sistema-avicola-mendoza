'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('pedidos', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      numero_pedido: { type: Sequelize.STRING(20), allowNull: false, unique: true },
      cliente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'clientes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      estado: {
        type: Sequelize.ENUM('Pendiente', 'En proceso', 'Entregado', 'Cancelado'),
        allowNull: false,
        defaultValue: 'Pendiente'
      },
      subtotal: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      total: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      fecha_creacion: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      fecha_actualizacion: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW }
    });
    await queryInterface.addIndex('pedidos', ['cliente_id']);
    await queryInterface.addIndex('pedidos', ['usuario_id']);
    await queryInterface.addIndex('pedidos', ['estado']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('pedidos');
  }
};
