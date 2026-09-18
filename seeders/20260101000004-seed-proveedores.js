'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('proveedores', [
      {
        nombre_razon_social: 'Granja Avícola El Amanecer S.A.S',
        identificacion: '900111222-1',
        telefono: '3101234567',
        correo: 'contacto@elamanecer.com',
        direccion: 'Km 5 vía a Fusagasugá',
        estado: 'activo',
        fecha_registro: new Date()
      },
      {
        nombre_razon_social: 'Incubadora San José Ltda',
        identificacion: '900333444-2',
        telefono: '3117654321',
        correo: 'ventas@incubadorasanjose.com',
        direccion: 'Vereda La Esperanza, Mendoza',
        estado: 'activo',
        fecha_registro: new Date()
      }
    ]);
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('proveedores', null, {});
  }
};
