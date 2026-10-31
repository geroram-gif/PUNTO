/** Navegación base: barra inferior sobre las rutas reales de app/. */
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

/** Ruta relativa a la raíz del proyecto (rootDir de Jest). */
const APP_DIR = './app';

describe('AppTabBar', () => {
  it('muestra las cuatro entradas con etiquetas accesibles', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/' });
    expect(screen.getByRole('tab', { name: 'Inicio' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Grupos' })).not.toBeSelected();
    expect(screen.getByRole('tab', { name: 'Perfil' })).not.toBeSelected();
    expect(screen.getByRole('button', { name: 'Partido: registrar un partido' })).toBeVisible();
  });

  it('cambia de pestaña', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/' });
    await fireEvent.press(screen.getByRole('tab', { name: 'Perfil' }));
    expect(screen).toHavePathname('/profile');
    expect(screen.getByRole('tab', { name: 'Perfil' })).toBeSelected();

    await fireEvent.press(screen.getByRole('tab', { name: 'Grupos' }));
    expect(screen).toHavePathname('/groups');
  });

  it('«Partido» abre el registro como modal y «Cancelar» vuelve', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/profile' });
    await fireEvent.press(screen.getByRole('button', { name: 'Partido: registrar un partido' }));
    expect(screen).toHavePathname('/match/new');

    await fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen).toHavePathname('/profile');
  });

  it('el cara a cara vive dentro de Grupos y deja esa pestaña activa', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/groups/jueves/h2h/nico' });
    expect(screen).toHavePathname('/groups/jueves/h2h/nico');
    expect(screen.getByRole('tab', { name: 'Grupos' })).toBeSelected();
  });
});
