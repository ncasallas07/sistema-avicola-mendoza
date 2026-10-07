const nodemailer = require('nodemailer');

let transporter = null;

const obtenerTransporter = () => {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: String(process.env.SMTP_PORT) === '465',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined
  });
  return transporter;
};

const plantillaRecuperacion = ({ nombre, enlace, minutosExpiracion }) => `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; color: #1e293b;">
    <div style="background-color: #065f46; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 18px;">AVÍCOLA MENDOZA</h1>
    </div>
    <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
      <p>Hola${nombre ? `, ${nombre}` : ''}:</p>
      <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en el sistema de gestión de AVÍCOLA MENDOZA.</p>
      <p style="text-align: center; margin: 28px 0;">
        <a href="${enlace}" style="background-color: #059669; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
          Restablecer contraseña
        </a>
      </p>
      <p>Este enlace es válido durante <strong>${minutosExpiracion} minutos</strong> y solo puede usarse una vez.</p>
      <p style="font-size: 13px; color: #64748b;">
        Si tú no solicitaste este cambio, puedes ignorar este correo: tu contraseña actual seguirá funcionando y
        nadie podrá acceder a tu cuenta con este enlace.
      </p>
    </div>
  </div>
`;

// Si no hay SMTP configurado: en desarrollo se registra el enlace en consola
// (para poder probar el flujo de punta a punta sin un proveedor real); en
// producción se considera un error de configuración y se lanza, en vez de
// fingir que el correo se envió.
const enviarCorreoRecuperacion = async ({ to, nombre, enlace, minutosExpiracion }) => {
  if (!process.env.SMTP_HOST) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SMTP no configurado: no se puede enviar el correo de recuperación en producción.');
    }
    console.log(`[email] SMTP no configurado (modo desarrollo). Enlace de recuperación para ${to}: ${enlace}`);
    return;
  }

  await obtenerTransporter().sendMail({
    from: process.env.SMTP_FROM || '"AVÍCOLA MENDOZA" <no-reply@avicolamendoza.com>',
    to,
    subject: 'Restablece tu contraseña — AVÍCOLA MENDOZA',
    html: plantillaRecuperacion({ nombre, enlace, minutosExpiracion })
  });
};

module.exports = { enviarCorreoRecuperacion };
