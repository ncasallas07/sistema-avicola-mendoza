'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('roles', [
      { id: 1, nombre: 'Admin' },
      { id: 2, nombre: 'Vendedor' }
    ]);
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('roles', null, {});
  }
};
