const app = require('./app');
const db = require('./models');

const PORT = process.env.PORT || 3000;

db.sequelize
  .authenticate()
  .then(() => console.log('Conexión a la base de datos establecida'))
  .catch((err) => console.error('No se pudo conectar a la base de datos:', err.message));

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
