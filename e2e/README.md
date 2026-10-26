# Pruebas de extremo a extremo (E2E)

Prueban el sistema desde la interfaz, como lo haría un usuario: iniciar sesión,
registrar un pedido, confirmarlo, descargar el comprobante y verificar que el
inventario disminuyó.

## Requisitos

1. Base de datos con los datos iniciales (`npm run db:migrate` y `npm run db:seed`).
2. Backend en ejecución: `npm run dev` (puerto 3000).
3. Frontend en ejecución: `cd frontend` y `npm run dev` (puerto 5173).
4. Navegador de Playwright instalado una sola vez: `npx playwright install chromium`.

## Ejecución

```bash
npm run test:e2e
```

Variables opcionales: `E2E_URL` (por defecto `http://localhost:5173`),
`E2E_EMAIL` y `E2E_PASSWORD` (por defecto, el administrador de los datos iniciales).
