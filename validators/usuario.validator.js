const Joi = require('joi');

// Mismo patrón de teléfono que ya usan proveedores/clientes
// (validators/proveedor.validator.js), para mantener consistencia.
const TELEFONO = Joi.string().pattern(/^[0-9+\-\s]{7,20}$/);
const RH_VALIDOS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Campos de empleado: todos opcionales (no se exige llenar la ficha completa
// para registrar un usuario), pero validados cuando se envían.
const CAMPOS_EMPLEADO = {
  tipo_documento: Joi.string().valid('CC', 'CE', 'PA', 'TI'),
  numero_documento: Joi.string().min(4).max(30),
  telefono: TELEFONO.allow('', null),
  direccion: Joi.string().max(255).allow('', null),
  rh: Joi.string().valid(...RH_VALIDOS),
  eps: Joi.string().max(150).allow('', null),
  arl: Joi.string().max(150).allow('', null),
  cargo: Joi.string().max(100).allow('', null),
  // .raw(): Joi valida el formato/rango pero devuelve el string original en
  // vez de convertirlo a un objeto Date. Sin esto, Sequelize termina
  // interpretando esa fecha en la zona horaria del servidor y DATEONLY puede
  // guardar el día anterior (p. ej. "1998-03-10" se vuelve "1998-03-09").
  // No puede ser futura: nadie puede haber nacido después de hoy.
  fecha_nacimiento: Joi.date().iso().max('now').raw().allow(null),
  // La coherencia con fecha_nacimiento se valida en usuario.service.js (no
  // ambas a la vez con Joi.ref para no tener que exigir un orden de envío).
  fecha_ingreso: Joi.date().iso().raw().allow(null)
};

const crearUsuarioSchema = Joi.object({
  nombre: Joi.string().min(2).max(150).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  rol_id: Joi.number().integer().positive().required(),
  ...CAMPOS_EMPLEADO
})
  // tipo_documento y numero_documento van juntos: o se informan los dos, o
  // ninguno — un tipo de documento sin número (o viceversa) no es un dato útil.
  .and('tipo_documento', 'numero_documento');

const editarUsuarioSchema = Joi.object({
  nombre: Joi.string().min(2).max(150),
  email: Joi.string().email(),
  rol_id: Joi.number().integer().positive(),
  ...CAMPOS_EMPLEADO
})
  .and('tipo_documento', 'numero_documento')
  .min(1);

const cambiarEstadoSchema = Joi.object({
  estado: Joi.string().valid('activo', 'inactivo').required()
});

module.exports = { crearUsuarioSchema, editarUsuarioSchema, cambiarEstadoSchema };
