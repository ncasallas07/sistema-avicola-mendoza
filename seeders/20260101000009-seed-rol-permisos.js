'use strict';

const { PERMISOS_POR_ROL_EXISTENTE } = require('./data/permisos');

module.exports = {
  up: async (queryInterface) => {
    const roles = await queryInterface.sequelize.query('SELECT id, nombre FROM roles', {
      type: queryInterface.sequelize.QueryTypes.SELECT
    });
    const permisos = await queryInterface.sequelize.query('SELECT id, codigo FROM permisos', {
      type: queryInterface.sequelize.QueryTypes.SELECT
    });
    const idPermisoPorCodigo = Object.fromEntries(permisos.map((p) => [p.codigo, p.id]));

    const filas = [];
    for (const rol of roles) {
      const codigos = PERMISOS_POR_ROL_EXISTENTE[rol.nombre] || [];
      for (const codigo of codigos) {
        filas.push({ rol_id: rol.id, permiso_id: idPermisoPorCodigo[codigo] });
      }
    }

    if (filas.length > 0) {
      await queryInterface.bulkInsert('rol_permisos', filas);
    }
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('rol_permisos', null, {});
  }
};
