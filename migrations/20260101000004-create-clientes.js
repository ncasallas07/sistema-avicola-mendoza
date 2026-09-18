'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('clientes', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nombre_razon_social: { type: Sequelize.STRING(200), allowNull: false },
      documento: { type: Sequelize.STRING(30), allowNull: false, unique: true },
      telefono: { type: Sequelize.STRING(20), allowNull: true },
      correo: { type: Sequelize.STRING(150), allowNull: true },
      direccion: { type: Sequelize.STRING(255), allowNull: true },
      zona: { type: Sequelize.STRING(100), allowNull: true },
      ciudad: { type: Sequelize.STRING(100), allowNull: true },
      estado: { type: Sequelize.ENUM('activo', 'inactivo'), allowNull: false, defaultValue: 'activo' },
      fecha_registro: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW }
    });
    await queryInterface.addIndex('clientes', ['zona']);
    await queryInterface.addIndex('clientes', ['estado']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('clientes');
  }
};
