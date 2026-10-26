const { test, expect } = require('@playwright/test');

const EMAIL = process.env.E2E_EMAIL || 'admin@avicolamendoza.com';
const PASSWORD = process.env.E2E_PASSWORD || 'Cambiar123!';

// Disponibilidad que muestra el formulario de pedido para un producto: "(disp: N)".
const disponibleEnOpcion = (texto) => Number(texto.match(/disp: (-?\d+)/)[1]);

test('flujo completo: iniciar sesión, registrar y confirmar un pedido, y descargar el comprobante', async ({ page }) => {
  // 1. Inicio de sesión
  await page.goto('/login');
  await page.fill('input[type=email]', EMAIL);
  await page.fill('input[type=password]', PASSWORD);
  await page.click('button[type=submit]');
  await expect(page).toHaveURL(/\/$/);

  // 2. Registro de un pedido con un producto con existencias
  await page.goto('/pedidos/nuevo');
  const selects = page.locator('form select');
  await expect(selects.first().locator('option')).not.toHaveCount(1);
  await selects.first().selectOption({ index: 1 });
  const opcionesProducto = selects.nth(1).locator('option');
  await expect(opcionesProducto).not.toHaveCount(1);
  const textos = await opcionesProducto.allTextContents();
  const indice = textos.findIndex((t, i) => i > 0 && disponibleEnOpcion(t) >= 2);
  expect(indice).toBeGreaterThan(0);
  const valorProducto = await opcionesProducto.nth(indice).getAttribute('value');
  const disponibleAntes = disponibleEnOpcion(textos[indice]);
  await selects.nth(1).selectOption(valorProducto);
  await page.locator('input[type=number]').fill('2');
  await page.getByRole('button', { name: 'Agregar' }).click();
  await page.getByRole('button', { name: 'Crear pedido' }).click();
  await expect(page).toHaveURL(/\/pedidos\/\d+$/);
  await expect(page.getByText('Pendiente').first()).toBeVisible();

  // 3. Confirmación: el pedido pasa a Confirmado
  await page.getByRole('button', { name: 'Confirmado' }).click();
  await page.locator('div.fixed.inset-0').getByRole('button', { name: 'Confirmar' }).click();
  await expect(page.getByText('Confirmado').first()).toBeVisible();
  const urlPedido = page.url();

  // 4. Descarga del comprobante en PDF
  await page.getByRole('link', { name: /Ver comprobante/ }).click();
  const [descarga] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /Descargar/ }).click()
  ]);
  expect(descarga.suggestedFilename()).toMatch(/^Comprobante-Pedido-\d+\.pdf$/);

  // 5. El inventario disminuyó en la cantidad confirmada
  await page.goto('/pedidos/nuevo');
  await expect(page.locator('form select').nth(1).locator('option')).not.toHaveCount(1);
  const opcion = page.locator(`form select >> nth=1 >> option[value="${valorProducto}"]`);
  expect(disponibleEnOpcion(await opcion.textContent())).toBe(disponibleAntes - 2);
  expect(urlPedido).toMatch(/\/pedidos\/\d+$/);
});
