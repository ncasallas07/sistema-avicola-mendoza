'use strict';

// Eliminación lógica de usuarios: se agrega el valor 'eliminado' al ENUM de
// usuarios.estado. No se agregan columnas ni se tocan las llaves foráneas: el
// registro del usuario permanece en la tabla, por lo que sus pedidos,
// movimientos de inventario y demás relaciones históricas se conservan intactos.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('usuarios', 'estado', {
      type: Sequelize.ENUM('activo', 'inactivo', 'eliminado'),
      allowNull: false,
      defaultValue: 'activo'
    });
  },
  down: async (queryInterface, Sequelize) => {
    // Antes de quitar el valor del ENUM, los usuarios eliminados pasan a
    // 'inactivo' (siguen sin poder iniciar sesión y no se pierde ningún dato).
    await queryInterface.sequelize.query("UPDATE usuarios SET estado = 'inactivo' WHERE estado = 'eliminado'");
    await queryInterface.changeColumn('usuarios', 'estado', {
      type: Sequelize.ENUM('activo', 'inactivo'),
      allowNull: false,
      defaultValue: 'activo'
    });
  }
};
