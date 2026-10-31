import { Pressable, useWindowDimensions, View } from 'react-native';

import type { RegisterVM } from '@/features/register/vm';
import { layout, palette, protoColors } from '@/theme';

import { PlayerAvatar } from './PlayerAvatar';
import { Icon, Txt } from './ui';

/** Grilla de 4 columnas con los miembros del grupo y el botón «Invitado». */
export function PlayerSelector({
  picker,
  guestOpen,
  onPick,
  onToggleGuest,
}: {
  picker: RegisterVM['picker'];
  guestOpen: boolean;
  onPick: (id: string) => void;
  onToggleGuest: () => void;
}) {
  const { width } = useWindowDimensions();
  const cell = Math.floor((width - layout.screenGutter * 2 - 8 * 3) / 4);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {picker.map((p) => (
        <Pressable
          key={p.id}
          accessibilityRole="button"
          accessibilityLabel={p.aria}
          accessibilityState={{ selected: p.taken }}
          onPress={() => onPick(p.id)}
          style={{
            width: cell,
            height: 76,
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: p.taken ? protoColors.creamEdge : palette.creamLine,
            backgroundColor: p.taken ? palette.cream2 : palette.white,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            paddingHorizontal: 4,
          }}
        >
          <PlayerAvatar av={p.av} size={34} style={{ opacity: p.taken ? 0.4 : 1 }} />
          <Txt w={600} s={13} ell style={{ opacity: p.taken ? 0.4 : 1, maxWidth: '100%' }}>
            {p.name}
          </Txt>
          {p.taken ? (
            <View
              style={{
                position: 'absolute',
                top: 5,
                right: 5,
                minWidth: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: palette.navy,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Txt w={700} s={11} c={palette.cream}>
                {p.tag}
              </Txt>
            </View>
          ) : null}
        </Pressable>
      ))}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Invitado"
        accessibilityHint="Suma un jugador sin cuenta a este grupo"
        accessibilityState={{ expanded: guestOpen }}
        onPress={onToggleGuest}
        style={{
          width: cell,
          height: 76,
          borderRadius: 16,
          borderWidth: 1.5,
          borderStyle: 'dashed',
          borderColor: palette.slate,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
        }}
      >
        <Icon name="plus" size={22} color={palette.navy} />
        <Txt w={600} s={13}>
          Invitado
        </Txt>
      </Pressable>
    </View>
  );
}
