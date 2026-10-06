require('dotenv').config();

const base = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'mysql',
  logging: false,
  // Mismos valores por defecto que ya aplicaba Sequelize implícitamente;
  // se dejan explícitos para que queden documentados de cara a producción.
  pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
  // Algunos proveedores de MySQL administrado exigen TLS en la conexión.
  // Apagado por defecto (no cambia el comportamiento local/actual);
  // se activa poniendo DB_SSL=true si el proveedor lo requiere.
  dialectOptions: process.env.DB_SSL === 'true' ? { ssl: { rejectUnauthorized: false } } : {}
};

module.exports = {
  development: { ...base, database: process.env.DB_NAME },
  test: { ...base, database: process.env.DB_NAME_TEST || `${process.env.DB_NAME}_test` },
  production: { ...base, database: process.env.DB_NAME }
};
