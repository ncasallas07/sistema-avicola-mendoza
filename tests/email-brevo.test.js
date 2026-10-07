// Pruebas del envío por la API de Brevo. fetch se reemplaza por un mock: no
// se envía ningún correo real ni se necesita una API key válida.
describe('Envío de correo con Brevo', () => {
  const ENV_ORIGINAL = { ...process.env };
  let enviarCorreoRecuperacion;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...ENV_ORIGINAL,
      BREVO_API_KEY: 'xkeysib-prueba',
      MAIL_FROM_EMAIL: 'remitente@example.com',
      MAIL_FROM_NAME: 'AVÍCOLA MENDOZA'
    };
    delete process.env.SMTP_HOST;
    ({ enviarCorreoRecuperacion } = require('../services/email.service'));
  });

  afterEach(() => {
    process.env = ENV_ORIGINAL;
    jest.restoreAllMocks();
  });

  const datos = {
    to: 'usuario@example.com',
    nombre: 'Usuario de Prueba',
    enlace: 'https://avicola-mendoza.vercel.app/restablecer-contrasena?token=abc123',
    minutosExpiracion: 60
  };

  test('llama a la API de Brevo con el remitente, el destinatario y el enlace', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, status: 201, text: async () => '' });

    await enviarCorreoRecuperacion(datos);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opciones] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect(opciones.method).toBe('POST');
    expect(opciones.headers['api-key']).toBe('xkeysib-prueba');
    const cuerpo = JSON.parse(opciones.body);
    expect(cuerpo.sender).toEqual({ email: 'remitente@example.com', name: 'AVÍCOLA MENDOZA' });
    expect(cuerpo.to).toEqual([{ email: 'usuario@example.com', name: 'Usuario de Prueba' }]);
    expect(cuerpo.htmlContent).toContain(datos.enlace);
  });

  test('lanza un error con el código de estado si Brevo rechaza el envío', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: false, status: 401, text: async () => '{"message":"Key not found"}' });

    await expect(enviarCorreoRecuperacion(datos)).rejects.toThrow('Brevo respondió 401');
  });

  test('exige MAIL_FROM_EMAIL cuando se usa Brevo', async () => {
    delete process.env.MAIL_FROM_EMAIL;
    const fetchMock = jest.spyOn(global, 'fetch');

    await expect(enviarCorreoRecuperacion(datos)).rejects.toThrow('MAIL_FROM_EMAIL');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
