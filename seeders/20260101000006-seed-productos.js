'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('productos', [
      {
        id: 1,
        nombre: 'Pollo entero',
        descripcion: 'Pollo entero fresco',
        categoria_id: 1,
        textura_presentacion: 'Entero',
        unidad_medida: 'kg',
        precio: 9500,
        cantidad_disponible: 80,
        stock_minimo: 15,
        estado: 'activo',
        fecha_creacion: new Date()
      },
      {
        id: 2,
        nombre: 'Pechuga despresada',
        descripcion: 'Pechuga de pollo sin piel',
        categoria_id: 1,
        textura_presentacion: 'Despresado',
        unidad_medida: 'kg',
        precio: 13500,
        cantidad_disponible: 50,
        stock_minimo: 10,
        estado: 'activo',
        fecha_creacion: new Date()
      },
      {
        id: 3,
        nombre: 'Alas de pollo',
        descripcion: 'Alas de pollo frescas',
        categoria_id: 1,
        textura_presentacion: 'Despresado',
        unidad_medida: 'kg',
        precio: 10500,
        cantidad_disponible: 40,
        stock_minimo: 10,
        estado: 'activo',
        fecha_creacion: new Date()
      },
      {
        id: 4,
        nombre: 'Huevo AA cubeta x30',
        descripcion: 'Cubeta de 30 huevos tipo AA',
        categoria_id: 2,
        textura_presentacion: 'Cubeta x30',
        unidad_medida: 'cubeta',
        precio: 15000,
        cantidad_disponible: 60,
        stock_minimo: 20,
        estado: 'activo',
        fecha_creacion: new Date()
      },
      {
        id: 5,
        nombre: 'Huevo AA unidad',
        descripcion: 'Huevo tipo AA por unidad',
        categoria_id: 2,
        textura_presentacion: 'Unidad',
        unidad_medida: 'unidad',
        precio: 550,
        cantidad_disponible: 8,
        stock_minimo: 50,
        estado: 'activo',
        fecha_creacion: new Date()
      },
      {
        id: 6,
        nombre: 'Menudencias de pollo',
        descripcion: 'Menudencias variadas',
        categoria_id: 3,
        textura_presentacion: 'Bolsa 1kg',
        unidad_medida: 'kg',
        precio: 6000,
        cantidad_disponible: 25,
        stock_minimo: 10,
        estado: 'activo',
        fecha_creacion: new Date()
      }
    ]);
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('productos', null, {});
  }
};
