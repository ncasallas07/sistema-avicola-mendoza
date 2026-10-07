const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Usuario, PasswordResetToken, sequelize } = require('../models');
const { enviarCorreoRecuperacion } = require('./email.service');

const MINUTOS_EXPIRACION = 60;

// El token se genera con crypto.randomBytes (no con jsonwebtoken): no debe
// ser el JWT de sesión ni derivarse de él, para que invalidar uno no afecte
// al otro y para que nunca sea predecible. Solo se guarda su hash SHA-256 en
// la base de datos — un hash determinista es suficiente aquí (a diferencia
// de una contraseña) porque el propio token ya tiene 256 bits de entropía;
// lo importante es no guardarlo en texto plano, no dificultar el cálculo.
const generarTokenCrudo = () => crypto.randomBytes(32).toString('hex');
const hashearToken = (tokenCrudo) => crypto.createHash('sha256').update(tokenCrudo).digest('hex');

const urlFrontend = () => {
  const configurada = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim();
  return configurada.replace(/\/+$/, '');
};

// Nunca revela si el correo existe o no: siempre se comporta igual desde
// afuera (ver controllers/auth.controller.js, que ignora el valor de retorno).
const solicitarRecuperacion = async (email) => {
  const usuario = await Usuario.findOne({ where: { email } });
  if (!usuario || usuario.estado !== 'activo') return;

  // Cualquier enlace de recuperación anterior sin usar queda invalidado al
  // pedir uno nuevo, para que no queden varios enlaces válidos circulando.
  await PasswordResetToken.update(
    { usado_en: new Date() },
    { where: { usuario_id: usuario.id, usado_en: null } }
  );

  const tokenCrudo = generarTokenCrudo();
  await PasswordResetToken.create({
    usuario_id: usuario.id,
    token_hash: hashearToken(tokenCrudo),
    expira_en: new Date(Date.now() + MINUTOS_EXPIRACION * 60 * 1000)
  });

  const enlace = `${urlFrontend()}/restablecer-contrasena?token=${tokenCrudo}`;

  try {
    await enviarCorreoRecuperacion({
      to: usuario.email,
      nombre: usuario.nombre,
      enlace,
      minutosExpiracion: MINUTOS_EXPIRACION
    });
  } catch (err) {
    // Un fallo de envío no debe filtrarse al cliente (revelaría información
    // sobre el correo); queda solo en el log del servidor para diagnóstico.
    console.error('No se pudo enviar el correo de recuperación:', err.message);
  }
};

const restablecerPassword = async (tokenCrudo, nuevaPassword) => {
  const tokenHash = hashearToken(tokenCrudo);
  const registro = await PasswordResetToken.findOne({ where: { token_hash: tokenHash } });

  if (!registro || registro.usado_en || registro.expira_en < new Date()) {
    const error = new Error('El enlace de recuperación es inválido o ya expiró. Solicita uno nuevo.');
    error.status = 400;
    throw error;
  }

  const usuario = await Usuario.findByPk(registro.usuario_id);
  if (!usuario || usuario.estado !== 'activo') {
    const error = new Error('El enlace de recuperación es inválido o ya expiró. Solicita uno nuevo.');
    error.status = 400;
    throw error;
  }

  const passwordHash = await bcrypt.hash(nuevaPassword, 10);

  await sequelize.transaction(async (t) => {
    usuario.password = passwordHash;
    await usuario.save({ transaction: t });
    registro.usado_en = new Date();
    await registro.save({ transaction: t });
  });
};

module.exports = { solicitarRecuperacion, restablecerPassword, hashearToken, MINUTOS_EXPIRACION };
