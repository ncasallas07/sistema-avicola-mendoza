module.exports = {
  testEnvironment: 'node',
  setupFiles: ['./tests/jest.setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
  // Serializado: las pruebas comparten una sola base de datos de prueba y se
  // limpian entre archivos, así que correrlas en paralelo generaría carreras.
  maxWorkers: 1,
  testTimeout: 15000,
  forceExit: true
};
