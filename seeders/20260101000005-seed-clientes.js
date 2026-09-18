'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('clientes', [
      {
        nombre_razon_social: 'Tienda Doña Rosa',
        documento: '10203040',
        telefono: '3201112233',
        correo: 'donarosa@example.com',
        direccion: 'Cra 5 # 10-20',
        zona: 'Norte',
        ciudad: 'Mendoza',
        estado: 'activo',
        fecha_registro: new Date()
      },
      {
        nombre_razon_social: 'Supermercado La Economía',
        documento: '900555666-3',
        telefono: '3209998877',
        correo: 'compras@laeconomia.com',
        direccion: 'Calle 8 # 4-15',
        zona: 'Centro',
        ciudad: 'Mendoza',
        estado: 'activo',
        fecha_registro: new Date()
      },
      {
        nombre_razon_social: 'Restaurante El Buen Sabor',
        documento: '900777888-4',
        telefono: '3157778899',
        correo: 'gerencia@elbuensabor.com',
        direccion: 'Av. Principal # 20-30',
        zona: 'Sur',
        ciudad: 'Mendoza',
        estado: 'activo',
        fecha_registro: new Date()
      }
    ]);
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('clientes', null, {});
  }
};
