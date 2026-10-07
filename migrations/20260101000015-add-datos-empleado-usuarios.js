'use strict';

// Amplía la ficha de usuario con datos básicos de empleado. Todos los campos
// son nullable: los usuarios existentes (admin/vendedor de los seeders, y
// cualquier usuario ya creado) siguen siendo válidos sin necesidad de
// rellenar nada retroactivamente.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('usuarios', 'tipo_documento', {
      type: Sequelize.ENUM('CC', 'CE', 'PA', 'TI'),
      allowNull: true
    });
    await queryInterface.addColumn('usuarios', 'numero_documento', {
      type: Sequelize.STRING(30),
      allowNull: true,
      unique: true
    });
    await queryInterface.addColumn('usuarios', 'telefono', {
      type: Sequelize.STRING(20),
      allowNull: true
    });
    await queryInterface.addColumn('usuarios', 'direccion', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
    await queryInterface.addColumn('usuarios', 'rh', {
      type: Sequelize.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
      allowNull: true
    });
    await queryInterface.addColumn('usuarios', 'eps', {
      type: Sequelize.STRING(150),
      allowNull: true
    });
    await queryInterface.addColumn('usuarios', 'arl', {
      type: Sequelize.STRING(150),
      allowNull: true
    });
    await queryInterface.addColumn('usuarios', 'cargo', {
      type: Sequelize.STRING(100),
      allowNull: true
    });
    await queryInterface.addColumn('usuarios', 'fecha_nacimiento', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });
    await queryInterface.addColumn('usuarios', 'fecha_ingreso', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('usuarios', 'fecha_ingreso');
    await queryInterface.removeColumn('usuarios', 'fecha_nacimiento');
    await queryInterface.removeColumn('usuarios', 'cargo');
    await queryInterface.removeColumn('usuarios', 'arl');
    await queryInterface.removeColumn('usuarios', 'eps');
    await queryInterface.removeColumn('usuarios', 'rh');
    await queryInterface.removeColumn('usuarios', 'direccion');
    await queryInterface.removeColumn('usuarios', 'telefono');
    await queryInterface.removeColumn('usuarios', 'numero_documento');
    await queryInterface.removeColumn('usuarios', 'tipo_documento');
  }
};
