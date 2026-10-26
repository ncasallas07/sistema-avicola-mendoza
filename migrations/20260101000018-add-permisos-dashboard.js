'use strict';

// Agrega los permisos del dashboard en bases de datos que ya tienen sembrado el
// catálogo de permisos (por ejemplo, producción). En una instalación nueva la
// tabla está vacía en este punto y los permisos los crea el seeder del catálogo,
// por lo que esta migración no hace nada.
const NUEVOS = [
  { codigo: 'dashboard.ver', nombre: 'Ver indicadores propios del dashboard', roles: ['Admin', 'Vendedor'] },
  { codigo: 'dashboard.ver_global', nombre: 'Ver indicadores generales del dashboard', roles: ['Admin'] }
];

module.exports = {
  up: async (queryInterface) => {
    const q = queryInterface.sequelize;
    const tipo = { type: q.QueryTypes.SELECT };
    const [{ total }] = await q.query('SELECT COUNT(*) AS total FROM permisos', tipo);
    if (Number(total) === 0) return;

    for (const permiso of NUEVOS) {
      const existentes = await q.query('SELECT id FROM permisos WHERE codigo = ?', { ...tipo, replacements: [permiso.codigo] });
      if (existentes.length === 0) {
        await queryInterface.bulkInsert('permisos', [
          { nombre: permiso.nombre, codigo: permiso.codigo, modulo: 'dashboard', descripcion: null, estado: 'activo', fecha_creacion: new Date() }
        ]);
      }
      const [{ id: permisoId }] = await q.query('SELECT id FROM permisos WHERE codigo = ?', { ...tipo, replacements: [permiso.codigo] });
      const roles = await q.query('SELECT id FROM roles WHERE nombre IN (?)', { ...tipo, replacements: [permiso.roles] });
      for (const rol of roles) {
        const asignado = await q.query('SELECT id FROM rol_permisos WHERE rol_id = ? AND permiso_id = ?', {
          ...tipo,
          replacements: [rol.id, permisoId]
        });
        if (asignado.length === 0) {
          await queryInterface.bulkInsert('rol_permisos', [{ rol_id: rol.id, permiso_id: permisoId }]);
        }
      }
    }
  },
  down: async (queryInterface) => {
    const q = queryInterface.sequelize;
    await q.query("DELETE rp FROM rol_permisos rp JOIN permisos p ON p.id = rp.permiso_id WHERE p.codigo IN ('dashboard.ver', 'dashboard.ver_global')");
    await q.query("DELETE FROM permisos WHERE codigo IN ('dashboard.ver', 'dashboard.ver_global')");
  }
};
