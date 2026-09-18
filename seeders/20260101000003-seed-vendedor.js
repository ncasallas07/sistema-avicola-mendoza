'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface) => {
    const passwordHash = await bcrypt.hash('Vendedor123!', 10);
    await queryInterface.bulkInsert('usuarios', [
      {
        nombre: 'Vendedor de Prueba',
        email: 'vendedor@avicolamendoza.com',
        password: passwordHash,
        rol_id: 2,
        estado: 'activo',
        fecha_creacion: new Date()
      }
    ]);
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('usuarios', { email: 'vendedor@avicolamendoza.com' }, {});
  }
};
