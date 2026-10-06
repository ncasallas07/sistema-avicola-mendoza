'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('roles', 'descripcion', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
    await queryInterface.addColumn('roles', 'estado', {
      type: Sequelize.ENUM('activo', 'inactivo'),
      allowNull: false,
      defaultValue: 'activo'
    });
    await queryInterface.addColumn('roles', 'fecha_creacion', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('roles', 'fecha_creacion');
    await queryInterface.removeColumn('roles', 'estado');
    await queryInterface.removeColumn('roles', 'descripcion');
  }
};
