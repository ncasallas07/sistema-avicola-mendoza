const nodemailer = require('nodemailer');

// Tiempo máximo para hablar con el proveedor de correo. Sin un límite, una
// conexión bloqueada (p. ej. un puerto SMTP filtrado por el hosting) dejaría
// la petición HTTP colgada hasta que el proxy la corte.
const TIMEOUT_MS = 10000;

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';
const NOMBRE_REMITENTE_POR_DEFECTO = 'AVÍCOLA MENDOZA';

let transporter = null;

const obtenerTransporter = () => {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: String(process.env.SMTP_PORT) === '465',
    connectionTimeout: TIMEOUT_MS,
    greetingTimeout: TIMEOUT_MS,
    socketTimeout: TIMEOUT_MS,
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

// Envío por la API HTTPS de Brevo (puerto 443). Se usa en producción porque
// los servicios gratuitos de Render bloquean la salida a los puertos SMTP
// (25, 465 y 587), así que nodemailer/SMTP nunca lograría conectarse allí.
// Se usa fetch nativo de Node (>= 18): no hace falta un SDK adicional.
const enviarConBrevo = async ({ to, nombre, subject, html }) => {
  const remitente = process.env.MAIL_FROM_EMAIL;
  if (!remitente) {
    throw new Error('Falta MAIL_FROM_EMAIL: el remitente (verificado en Brevo) es obligatorio para enviar correos.');
  }

  const respuesta = await fetch(BREVO_URL, {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
      accept: 'application/json'
    },
    body: JSON.stringify({
      sender: { email: remitente, name: process.env.MAIL_FROM_NAME || NOMBRE_REMITENTE_POR_DEFECTO },
      to: [{ email: to, ...(nombre ? { name: nombre } : {}) }],
      subject,
      htmlContent: html
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });

  if (!respuesta.ok) {
    const detalle = await respuesta.text().catch(() => '');
    throw new Error(`Brevo respondió ${respuesta.status}: ${detalle.slice(0, 300)}`);
  }
};

const enviarConSmtp = async ({ to, subject, html }) => {
  const remitente = process.env.MAIL_FROM_EMAIL
    ? `"${process.env.MAIL_FROM_NAME || NOMBRE_REMITENTE_POR_DEFECTO}" <${process.env.MAIL_FROM_EMAIL}>`
    : process.env.SMTP_FROM || `"${NOMBRE_REMITENTE_POR_DEFECTO}" <no-reply@avicolamendoza.com>`;

  await obtenerTransporter().sendMail({ from: remitente, to, subject, html });
};

// Orden de preferencia: 1) Brevo (BREVO_API_KEY), 2) SMTP (SMTP_HOST).
// Si no hay ninguno configurado: en desarrollo/pruebas se registra el enlace
// en consola (para probar el flujo de punta a punta sin un proveedor real);
// en producción se considera un error de configuración y se lanza, en vez de
// fingir que el correo se envió.
const enviarCorreoRecuperacion = async ({ to, nombre, enlace, minutosExpiracion }) => {
  const subject = 'Restablece tu contraseña — AVÍCOLA MENDOZA';
  const html = plantillaRecuperacion({ nombre, enlace, minutosExpiracion });

  if (process.env.BREVO_API_KEY) {
    await enviarConBrevo({ to, nombre, subject, html });
    return;
  }

  if (process.env.SMTP_HOST) {
    await enviarConSmtp({ to, subject, html });
    return;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Correo no configurado: define BREVO_API_KEY (o SMTP_HOST) para enviar el correo de recuperación en producción.');
  }
  console.log(`[email] Proveedor de correo no configurado (modo desarrollo). Enlace de recuperación para ${to}: ${enlace}`);
};

module.exports = { enviarCorreoRecuperacion };
