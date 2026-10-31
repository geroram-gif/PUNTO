/**
 * Recorrido del sprint 02 sobre la app real (rutas de app/ y store demo):
 * Inicio → Grupo → Registrar partido → Resultado → Grupo actualizado → Cara a cara → Perfil.
 */
import { fireEvent, renderRouter, screen, waitFor, within } from 'expo-router/testing-library';

const APP_DIR = './app';
const press = (name: string | RegExp, role: 'button' | 'tab' | 'radio' = 'button') =>
  fireEvent.press(screen.getByRole(role, { name }));

async function registerTomiFranVsNicoLean({ set1 = true } = {}) {
  for (const n of ['Tomás González', 'Francisco Pérez', 'Nicolás Ruiz', 'Leandro Sosa'])
    await press(n);
  if (set1) for (let i = 0; i < 6; i++) await press('Sumar un game a Tomi y Fran en Set 1');
  for (let i = 0; i < 6; i++) await press('Sumar un game a Tomi y Fran en Set 2');
  expect(screen.getByText('Todo listo. Ganan Tomi y Fran.')).toBeVisible();
  await press('Revisar partido');
  expect(screen.getByText('¿Está todo bien?')).toBeVisible();
}

afterEach(() => {
  delete process.env.EXPO_PUBLIC_DEMO_ERROR_DE_RED;
});

describe('recorrido completo', () => {
  it('registrar un partido actualiza grupo, cara a cara y perfil', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/' });
    expect(screen.getByText('Hola, Tomi.')).toBeVisible();
    expect(screen.getByText('64%')).toBeVisible();
    expect(screen.getByText('Le ganaste 8 de 10 cruces a Nico.')).toBeVisible();

    // Inicio → Grupo
    await press(/^Los del Jueves, 8 miembros/);
    expect(screen).toHavePathname('/groups');
    expect(screen.getByText('8 miembros · 24 partidos')).toBeVisible();
    expect(screen.getByText('64% · 9 ganados de 14')).toBeVisible();

    // Grupo → Registrar (con el grupo preseleccionado)
    await press('Partido: registrar un partido en Los del Jueves');
    expect(screen).toHavePathname('/match/new');
    expect(screen.getByRole('radio', { name: 'Los del Jueves' })).toBeChecked();
    expect(
      screen.getByText('Para seguir: faltan 4 jugadores, falta el set 1, falta el set 2.'),
    ).toBeVisible();

    // Jugador repetido: aviso, no se suma dos veces
    await press('Tomás González');
    await press('Tomás González, ya está en Pareja A');
    expect(
      screen.getByText(/Tomi ya está en la Pareja A\. Un jugador no puede estar dos veces/),
    ).toBeVisible();
    await press('Tomás González, en Pareja A. Tocá para sacarlo.');

    await registerTomiFranVsNicoLean();
    await press('Confirmar y guardar');
    await waitFor(() => expect(screen).toHavePathname('/result/n1'), { timeout: 3000 });

    // Resultado: racha, % global y cara a cara recalculados
    expect(screen.getByText('Partido cargado.')).toBeVisible();
    expect(screen.getByText('Tomi y Fran')).toBeVisible();
    expect(screen.getByText('Sumaste 4 victorias seguidas.')).toBeVisible();
    expect(screen.getByText('Tu % global: 64% → 65% · 23 partidos')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Cara a cara con Nico · 9-2' })).toBeVisible();

    // Resultado → Grupo actualizado
    await press('Ver el grupo');
    expect(screen).toHavePathname('/groups');
    expect(screen.getByText('8 miembros · 25 partidos')).toBeVisible();
    expect(screen.getByText('67% · 10 ganados de 15')).toBeVisible();
    expect(screen.getByText('Ranking, duplas y cara a cara actualizados.')).toBeVisible();
    await press('Ranking', 'tab');
    expect(
      screen.getByRole('button', { name: 'Vos, Tomi, puesto 2, 67 por ciento, 10 ganados de 15' }),
    ).toBeVisible();
    await press('Partidos', 'tab');
    expect(
      screen.getByText('25 partidos en el grupo. Tocá uno para ver el detalle o corregirlo.'),
    ).toBeVisible();

    // Grupo → Cara a cara
    await press('Resumen', 'tab');
    await press(/^La rivalidad del grupo\. Tomi vs Nico · 11 cruces directos/);
    expect(screen).toHavePathname('/groups/h2h');
    expect(screen.getByText('9-2')).toBeVisible();
    expect(screen.getByText('Tomi ganó 9 de los 11 cruces.')).toBeVisible();
    expect(screen.getByRole('tab', { name: 'Grupos' })).toBeSelected();

    // Cara a cara → Perfil
    await press('Perfil', 'tab');
    expect(screen).toHavePathname('/profile');
    expect(screen.getByText('65%')).toBeVisible();
    expect(screen.getByText('15 PJ · 10 G · 67%')).toBeVisible();
    expect(
      screen.getByText(
        '15 + 8 = 23. Cada partido suma una sola vez a tu perfil global; el ranking es siempre de cada grupo.',
      ),
    ).toBeVisible();
  });

  it('corregir y borrar desde el detalle recalcula todo', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/' });
    await press(/^Tomi y Fran ganaron a Nico y Lean, 6-4, 6-3/);
    expect(screen.getByText('Detalle del partido')).toBeVisible();
    expect(
      screen.getByText(
        'Sos admin del grupo: podés corregirlo o borrarlo. Las estadísticas se recalculan solas.',
      ),
    ).toBeVisible();

    await press('Borrar');
    expect(screen.getByText('¿Borrar este partido?')).toBeVisible();
    expect(
      screen.getByText(
        'En Los del Jueves pasarías de 64% a 62%. Tu racha actual quedaría en 2 ganados.',
      ),
    ).toBeVisible();
    await press('Sí, borrar partido');
    expect(screen.getByText('Partido borrado. Las estadísticas se recalcularon.')).toBeVisible();
    expect(screen.getByText('62%')).toBeVisible();

    // Corregir el último que queda (Tomi y Bruno en Los Pibes, cargado por Tomi): pasa a perderlo
    await press(/^Tomi y Bruno ganaron a Gonza y Facu/);
    await press('Corregir');
    expect(screen).toHavePathname('/match/new');
    expect(screen.getByText('Corregir partido')).toBeVisible();
    for (let i = 0; i < 3; i++) await press('Restar un game a Tomi y Bruno en Súper');
    for (let i = 0; i < 3; i++) await press('Sumar un game a Gonza y Facu en Súper');
    expect(screen.getByText('Todo listo. Ganan Gonza y Facu.')).toBeVisible();
    await press('Revisar partido');
    await press('Guardar corrección');
    await waitFor(() => expect(screen).toHavePathname('/'), { timeout: 3000 });
    expect(
      screen.getByText('Partido corregido. Ranking, rachas y duplas recalculados.'),
    ).toBeVisible();
    expect(screen.getByText('Se viene revancha.')).toBeVisible();
  });

  it('resultado inválido no deja revisar y el error de red conserva lo cargado', async () => {
    process.env.EXPO_PUBLIC_DEMO_ERROR_DE_RED = '1';
    await renderRouter(APP_DIR, { initialUrl: '/match/new?group=jueves' });
    for (let i = 0; i < 6; i++) await press('Sumar un game a Pareja A en Set 1');
    await press('Sumar un game a Pareja B en Set 1');
    await press('Sumar un game a Pareja B en Set 1');
    await press('Sumar un game a Pareja B en Set 1');
    await press('Sumar un game a Pareja B en Set 1');
    await press('Sumar un game a Pareja B en Set 1');
    expect(screen.getByText(/6-5 no cierra un set\. Valen 6-0 a 6-4, 7-5 o 7-6\./)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Revisar partido' })).toBeDisabled();
    for (let i = 0; i < 5; i++) await press('Restar un game a Pareja B en Set 1');

    await registerTomiFranVsNicoLean({ set1: false });
    await press('Confirmar y guardar');
    await waitFor(() => expect(screen.getByText('No se pudo guardar.')).toBeVisible(), {
      timeout: 3000,
    });
    expect(screen).toHavePathname('/match/new');
    await press('Reintentar');
    await waitFor(() => expect(screen).toHavePathname('/result/n1'), { timeout: 3000 });
  });

  it('sumar un invitado lo agrega al grupo y a la pareja', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/match/new?group=jueves' });
    await press('Invitado');
    await press('Sumar invitado');
    expect(screen.getByText('Escribí un nombre.')).toBeVisible();
    await fireEvent.changeText(screen.getByLabelText('Nombre del invitado'), 'Fran');
    await press('Sumar invitado');
    expect(screen.getByText('Ya hay alguien con ese nombre en el grupo.')).toBeVisible();
    await fireEvent.changeText(screen.getByLabelText('Nombre del invitado'), 'Lucho');
    await press('Sumar invitado');
    expect(screen.getByText('Lucho se sumó a Los del Jueves como invitado.')).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Lucho, en Pareja A. Tocá para sacarlo.' }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Lucho, invitado, ya está en Pareja A' }),
    ).toBeVisible();
  });

  it('el detalle de un partido ajeno no deja corregir', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/profile' });
    await press(/^Perdido con Facu contra Bruno y Gonza/);
    expect(
      screen.getByText('Solo quien lo cargó (Gonza) o un admin del grupo puede corregirlo.'),
    ).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Corregir' })).toBeNull();
    const sheet = screen.getByText('Detalle del partido');
    expect(within(sheet).queryByText('Borrar')).toBeNull();
  });
});
