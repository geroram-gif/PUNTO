import { View } from 'react-native';

import { colors, palette, radius } from '@/theme';

import { Txt } from './Txt';

/** «GANARON» / «GANAN»: nunca se comunica la victoria solo con color. */
export function WinTag({ label = 'GANARON' }: { label?: string }) {
  return (
    <View
      style={{
        backgroundColor: colors.stat.win,
        borderRadius: 6,
        paddingVertical: 3,
        paddingHorizontal: 7,
      }}
    >
      <Txt w={700} s={11} c={palette.navy}>
        {label}
      </Txt>
    </View>
  );
}

/** «Vos» (lima sobre navy, navy sobre crema). */
export function MeTag({ onDark }: { onDark: boolean }) {
  return (
    <View
      style={{
        backgroundColor: onDark ? palette.lime : palette.navy,
        borderRadius: radius.chip,
        paddingVertical: 2,
        paddingHorizontal: 7,
      }}
    >
      <Txt w={700} s={11} c={onDark ? palette.navy : palette.cream}>
        Vos
      </Txt>
    </View>
  );
}

/** «Invitado» con borde punteado. */
export function GuestTag({ onDark = false }: { onDark?: boolean }) {
  const c = onDark ? colors.guest.borderOnDark : colors.guest.borderOnLight;
  return (
    <View
      style={{
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: c,
        borderRadius: radius.chip,
        paddingVertical: 2,
        paddingHorizontal: 7,
      }}
    >
      <Txt w={600} s={11} c={onDark ? palette.cream : palette.navy}>
        Invitado
      </Txt>
    </View>
  );
}
