import { useState } from 'react';
import { View } from 'react-native';

import { usePunto } from '@/lib/store';
import { palette } from '@/theme';

import { EmptyState } from './EmptyState';
import { Button, useTopInset } from './ui';

/** No se pudieron cargar los datos: lo único que se ofrece es reintentar (o salir). */
export function LoadErrorScreen() {
  const { state, actions } = usePunto();
  const top = useTopInset();
  const [busy, setBusy] = useState(false);
  const retry = async () => {
    setBusy(true);
    try {
      await actions.refresh();
    } catch {
      // el estado ya muestra el error
    } finally {
      setBusy(false);
    }
  };
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: palette.navy,
        paddingTop: top,
        paddingHorizontal: 20,
        paddingBottom: 24,
        justifyContent: 'center',
      }}
    >
      <EmptyState
        tone="dark"
        card={false}
        titleSize={28}
        title="No pudimos cargar tus datos."
        text={state.loadError || 'Revisá tu conexión y probá de nuevo.'}
      >
        <Button
          label="Reintentar"
          loading={busy}
          disabled={busy}
          height={52}
          onPress={() => void retry()}
        />
        <Button
          label="Cerrar sesión"
          tone="outlineLight"
          height={52}
          weight={600}
          onPress={() => void actions.signOut().catch(() => {})}
        />
      </EmptyState>
    </View>
  );
}
