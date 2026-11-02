import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Share } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';

import { ShareCardSheet, shareCardTheme } from '../ShareCard';

const card = {
  ...shareCardTheme.result,
  kicker: 'Los del Jueves',
  big: ['6-4', '6-3'],
  size: 52,
  line: 'Tomi y Fran ganaron.',
  text: 'Tomi y Fran ganaron 6-4 6-3 en Los del Jueves. PUNTO.',
};
const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};
const mount = async () =>
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ShareCardSheet visible title="Compartir resultado" card={card} onClose={() => {}} />
    </SafeAreaProvider>,
  );

afterEach(() => jest.restoreAllMocks());

describe('tarjeta para compartir', () => {
  it('comparte la tarjeta como imagen de 1080×1350', async () => {
    const share = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: Share.sharedAction, activityType: undefined });
    await mount();
    await fireEvent.press(screen.getByRole('button', { name: 'Compartir…' }));
    await waitFor(() => expect(share).toHaveBeenCalledWith({ url: 'file:///tmp/tarjeta.png' }));
    expect(captureRef).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ format: 'png', width: 1080, height: 1350 }),
    );
    expect(await screen.findByText('Listo, compartido.')).toBeVisible();
  });

  it('si no se puede generar la imagen, comparte el texto', async () => {
    (captureRef as jest.Mock).mockRejectedValueOnce(new Error('sin memoria'));
    const share = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: Share.sharedAction, activityType: undefined });
    await mount();
    await fireEvent.press(screen.getByRole('button', { name: 'Compartir…' }));
    await waitFor(() => expect(share).toHaveBeenCalledWith({ message: card.text }));
  });

  it('si el usuario cierra el menú, no muestra «compartido»', async () => {
    jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: Share.dismissedAction, activityType: undefined });
    await mount();
    await fireEvent.press(screen.getByRole('button', { name: 'Compartir…' }));
    await waitFor(() => expect(Share.share).toHaveBeenCalled());
    expect(screen.queryByText('Listo, compartido.')).toBeNull();
  });
});
