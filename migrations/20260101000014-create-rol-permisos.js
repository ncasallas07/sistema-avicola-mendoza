'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('rol_permisos', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      rol_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'roles', key: 'id' },
        onDelete: 'CASCADE'
      },
      permiso_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'permisos', key: 'id' },
        onDelete: 'CASCADE'
      }
    });
    await queryInterface.addIndex('rol_permisos', ['rol_id', 'permiso_id'], {
      unique: true,
      name: 'rol_permisos_rol_id_permiso_id_unique'
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('rol_permisos');
  }
};
