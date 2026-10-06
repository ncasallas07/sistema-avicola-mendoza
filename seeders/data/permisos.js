'use strict';

// Catálogo único de permisos del sistema. Cada código corresponde a una
// acción real que ya existe en una ruta del backend (ver auditoría de
// routes/*.routes.js) — no se agregan permisos para funcionalidades que
// no existen (p. ej. no hay categorias.editar porque esa ruta no existe).
//
// Este módulo es la única fuente de verdad: lo usa tanto el seeder real
// (seeders/20260101000008-seed-permisos.js) como tests/helpers/db.js, para
// que el entorno de pruebas reproduzca exactamente la misma matriz de
// permisos que la base de datos real.
const CATALOGO_PERMISOS = [
  { codigo: 'clientes.ver', nombre: 'Ver clientes', modulo: 'clientes' },
  { codigo: 'clientes.crear', nombre: 'Crear clientes', modulo: 'clientes' },
  { codigo: 'clientes.editar', nombre: 'Editar clientes', modulo: 'clientes' },
  { codigo: 'clientes.eliminar', nombre: 'Activar/desactivar clientes', modulo: 'clientes' },

  { codigo: 'proveedores.ver', nombre: 'Ver proveedores', modulo: 'proveedores' },
  { codigo: 'proveedores.crear', nombre: 'Crear proveedores', modulo: 'proveedores' },
  { codigo: 'proveedores.editar', nombre: 'Editar proveedores', modulo: 'proveedores' },
  { codigo: 'proveedores.eliminar', nombre: 'Activar/desactivar proveedores', modulo: 'proveedores' },

  { codigo: 'productos.ver', nombre: 'Ver productos', modulo: 'productos' },
  { codigo: 'productos.crear', nombre: 'Crear productos', modulo: 'productos' },
  { codigo: 'productos.editar', nombre: 'Editar productos', modulo: 'productos' },
  { codigo: 'productos.eliminar', nombre: 'Activar/desactivar productos', modulo: 'productos' },

  { codigo: 'categorias.ver', nombre: 'Ver categorías', modulo: 'categorias' },
  { codigo: 'categorias.crear', nombre: 'Crear categorías', modulo: 'categorias' },

  { codigo: 'inventario.ver', nombre: 'Ver inventario', modulo: 'inventario' },
  { codigo: 'inventario.registrar_movimiento', nombre: 'Registrar entradas/salidas de inventario', modulo: 'inventario' },

  { codigo: 'pedidos.ver', nombre: 'Ver pedidos', modulo: 'pedidos' },
  { codigo: 'pedidos.crear', nombre: 'Crear pedidos', modulo: 'pedidos' },
  { codigo: 'pedidos.editar', nombre: 'Cambiar estado de pedidos', modulo: 'pedidos' },
  { codigo: 'pedidos.cancelar', nombre: 'Cancelar pedidos', modulo: 'pedidos' },

  { codigo: 'usuarios.ver', nombre: 'Ver usuarios', modulo: 'usuarios' },
  { codigo: 'usuarios.crear', nombre: 'Crear usuarios', modulo: 'usuarios' },
  { codigo: 'usuarios.editar', nombre: 'Editar usuarios', modulo: 'usuarios' },
  { codigo: 'usuarios.eliminar', nombre: 'Activar/desactivar usuarios', modulo: 'usuarios' },
  { codigo: 'usuarios.cambiar_rol', nombre: 'Cambiar el rol de un usuario', modulo: 'usuarios' },

  { codigo: 'roles.ver', nombre: 'Ver roles y permisos', modulo: 'roles' },
  { codigo: 'roles.crear', nombre: 'Crear roles', modulo: 'roles' },
  { codigo: 'roles.editar', nombre: 'Editar roles', modulo: 'roles' },
  { codigo: 'roles.eliminar', nombre: 'Eliminar/desactivar roles', modulo: 'roles' },
  { codigo: 'roles.asignar_permisos', nombre: 'Asignar permisos a un rol', modulo: 'roles' },

  { codigo: 'reportes.ver', nombre: 'Ver reportes', modulo: 'reportes' },
  { codigo: 'reportes.exportar', nombre: 'Exportar reportes (CSV)', modulo: 'reportes' }
];

// Permisos con los que deben quedar sembrados los roles "Admin" y "Vendedor"
// ya existentes, para que conserven EXACTAMENTE las capacidades que ya
// tenían antes de este cambio (ver tests existentes en tests/*.test.js).
const PERMISOS_POR_ROL_EXISTENTE = {
  Admin: CATALOGO_PERMISOS.map((p) => p.codigo),
  Vendedor: [
    'clientes.ver',
    'clientes.crear',
    'clientes.editar',
    'productos.ver',
    'categorias.ver',
    'inventario.ver',
    'pedidos.ver',
    'pedidos.crear',
    'pedidos.editar',
    'pedidos.cancelar'
  ]
};

module.exports = { CATALOGO_PERMISOS, PERMISOS_POR_ROL_EXISTENTE };
