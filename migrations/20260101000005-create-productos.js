'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('productos', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: Sequelize.STRING(150), allowNull: false },
      descripcion: { type: Sequelize.STRING(255), allowNull: true },
      categoria_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'categorias', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      unidad_medida: { type: Sequelize.STRING(30), allowNull: false },
      precio: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      cantidad_disponible: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      stock_minimo: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      estado: { type: Sequelize.ENUM('activo', 'inactivo'), allowNull: false, defaultValue: 'activo' },
      fecha_creacion: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW }
    });
    await queryInterface.addIndex('productos', ['nombre']);
    await queryInterface.addIndex('productos', ['categoria_id']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('productos');
  }
};
