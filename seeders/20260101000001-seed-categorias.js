'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('categorias', [
      { nombre: 'Pollo', descripcion: 'Productos de pollo en canal y despresado' },
      { nombre: 'Huevos', descripcion: 'Huevo comercial por unidad, cubeta o cartón' },
      { nombre: 'Otros', descripcion: 'Otros productos avícolas' }
    ]);
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('categorias', null, {});
  }
};
