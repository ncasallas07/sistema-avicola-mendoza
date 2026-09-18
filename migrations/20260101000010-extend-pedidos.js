'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('pedidos', 'estado', {
      type: Sequelize.ENUM('Pendiente', 'Confirmado', 'En preparación', 'Enviado', 'Entregado', 'Cancelado'),
      allowNull: false,
      defaultValue: 'Pendiente'
    });
    await queryInterface.addColumn('pedidos', 'observaciones', {
      type: Sequelize.STRING(500),
      allowNull: true
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('pedidos', 'observaciones');
    await queryInterface.changeColumn('pedidos', 'estado', {
      type: Sequelize.ENUM('Pendiente', 'En proceso', 'Entregado', 'Cancelado'),
      allowNull: false,
      defaultValue: 'Pendiente'
    });
  }
};
