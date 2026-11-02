import { View } from 'react-native';

import { palette } from '@/theme';

import { Icon, Txt } from './ui';

/** Error de guardado: conserva lo cargado y ofrece reintentar. */
export function ErrorState({ message }: { message?: string }) {
  return (
    <View
      accessibilityRole="alert"
      style={{
        flexDirection: 'row',
        gap: 10,
        alignItems: 'flex-start',
        backgroundColor: palette.white,
        borderWidth: 1.5,
        borderColor: palette.navy,
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 14,
      }}
    >
      <Icon name="info" size={20} color={palette.navy} stroke={1.75} />
      <Txt s={14} lh={1.4} style={{ flex: 1 }}>
        <Txt w={700} s={14} lh={1.4}>
          No se pudo guardar.
        </Txt>{' '}
        {message ?? 'Revisá tu conexión y probá de nuevo.'} Lo que cargaste sigue acá.
      </Txt>
    </View>
  );
}
