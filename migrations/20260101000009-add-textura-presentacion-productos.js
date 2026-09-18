'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('productos', 'textura_presentacion', {
      type: Sequelize.STRING(100),
      allowNull: true
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('productos', 'textura_presentacion');
  }
};
