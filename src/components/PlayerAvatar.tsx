import { View } from 'react-native';

import type { AvatarVM } from '@/features/shared/ctx';

import { Txt } from './ui';

/**
 * Avatar de jugador: iniciales sobre su color. Los invitados van sin fondo y con borde
 * punteado. `ring` dibuja el aro que separa avatares superpuestos (box-shadow del prototipo).
 */
export function PlayerAvatar({
  av,
  size = 36,
  fontSize = 12,
  display = false,
  ring,
  ringWidth = 2,
  style,
}: {
  av: AvatarVM;
  size?: number;
  fontSize?: number;
  /** Iniciales en Sora 800 (avatares grandes). */
  display?: boolean;
  ring?: string;
  ringWidth?: number;
  style?: object;
}) {
  const inner = (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: av.bg,
        borderWidth: av.dashed ? 1.5 : 0,
        borderStyle: av.dashed ? 'dashed' : 'solid',
        borderColor: av.dashed ?? 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Txt d={display} w={display ? 800 : 700} s={fontSize} c={av.fg}>
        {av.ini}
      </Txt>
    </View>
  );
  if (!ring) return <View style={style}>{inner}</View>;
  return (
    <View
      style={[
        {
          borderRadius: (size + ringWidth * 2) / 2,
          borderWidth: ringWidth,
          borderColor: ring,
          backgroundColor: ring,
        },
        style,
      ]}
    >
      {inner}
    </View>
  );
}
