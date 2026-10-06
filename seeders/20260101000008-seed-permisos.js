'use strict';

const { CATALOGO_PERMISOS } = require('./data/permisos');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert(
      'permisos',
      CATALOGO_PERMISOS.map((p) => ({
        nombre: p.nombre,
        codigo: p.codigo,
        modulo: p.modulo,
        descripcion: null,
        estado: 'activo',
        fecha_creacion: new Date()
      }))
    );
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('permisos', null, {});
  }
};
