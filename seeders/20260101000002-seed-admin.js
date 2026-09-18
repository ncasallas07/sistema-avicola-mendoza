'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface) => {
    const passwordHash = await bcrypt.hash('Cambiar123!', 10);
    await queryInterface.bulkInsert('usuarios', [
      {
        nombre: 'Administrador',
        email: 'admin@avicolamendoza.com',
        password: passwordHash,
        rol_id: 1,
        estado: 'activo',
        fecha_creacion: new Date()
      }
    ]);
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('usuarios', { email: 'admin@avicolamendoza.com' }, {});
  }
};
