'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('roles', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: Sequelize.STRING(50), allowNull: false, unique: true }
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('roles');
  }
};
