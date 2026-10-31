import { renderRouter, screen, waitFor } from 'expo-router/testing-library';

it('muestra el esqueleto de carga y después Inicio', async () => {
  process.env.EXPO_PUBLIC_DEMO_CARGA = '1';
  await renderRouter('./app', { initialUrl: '/' });
  expect(screen.getByLabelText('Cargando')).toBeVisible();
  expect(screen.queryByRole('tab', { name: 'Inicio' })).toBeNull();
  await waitFor(() => expect(screen.getByText('Hola, Tomi.')).toBeVisible(), { timeout: 3000 });
  process.env.EXPO_PUBLIC_DEMO_CARGA = '0';
});

it('usuario nuevo: estados vacíos sin cifras', async () => {
  process.env.EXPO_PUBLIC_DEMO_ESCENARIO = 'usuario-nuevo';
  await renderRouter('./app', { initialUrl: '/' });
  expect(screen.getByText('Tu historia arranca con el primer partido.')).toBeVisible();
  delete process.env.EXPO_PUBLIC_DEMO_ESCENARIO;
});
