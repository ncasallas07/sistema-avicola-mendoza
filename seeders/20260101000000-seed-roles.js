'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('roles', [
      { id: 1, nombre: 'Admin', descripcion: 'Acceso completo a todas las funcionalidades del sistema', estado: 'activo' },
      { id: 2, nombre: 'Vendedor', descripcion: 'Gestiona clientes y pedidos propios; consulta productos e inventario', estado: 'activo' }
    ]);
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('roles', null, {});
  }
};
