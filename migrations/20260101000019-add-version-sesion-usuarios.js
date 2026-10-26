'use strict';

// version_sesion se incluye en cada token de sesión. Al restablecer la
// contraseña se incrementa, de modo que los tokens emitidos antes del cambio
// dejan de ser válidos de inmediato (sesiones abiertas en otros dispositivos).
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('usuarios', 'version_sesion', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('usuarios', 'version_sesion');
  }
};
