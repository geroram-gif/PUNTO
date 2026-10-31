import { Pressable, View } from 'react-native';

import type { AvatarVM } from '@/features/shared/ctx';
import { colors, palette, radius } from '@/theme';

import { PlayerAvatar } from './PlayerAvatar';
import { Txt } from './ui';

function Pair({
  a,
  b,
  size,
  ring,
  overlap,
}: {
  a: AvatarVM;
  b: AvatarVM;
  size: number;
  ring: string;
  overlap: number;
}) {
  return (
    <View
      style={{ flexDirection: 'row' }}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <PlayerAvatar av={a} size={size} fontSize={size >= 40 ? 13 : 12} ring={ring} />
      <PlayerAvatar
        av={b}
        size={size}
        fontSize={size >= 40 ? 13 : 12}
        ring={ring}
        style={{ marginLeft: -overlap - 4 }}
      />
    </View>
  );
}

/** «La dupla del momento.» en el Resumen (lima, lleva a Duplas). */
export function DuoHighlightCard({
  a,
  b,
  text,
  pct,
  onPress,
}: {
  a: AvatarVM;
  b: AvatarVM;
  text: string;
  pct: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={'La dupla del momento. ' + text + ', ' + pct + ' por ciento. Ver duplas.'}
      onPress={onPress}
      style={{
        backgroundColor: palette.lime,
        borderRadius: radius.card,
        paddingVertical: 16,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <Pair a={a} b={b} size={40} ring={palette.lime} overlap={10} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Txt d w={700} s={18}>
          La dupla del momento.
        </Txt>
        <Txt s={14} ell>
          {text}
        </Txt>
      </View>
      <Txt d w={800} s={28} num>
        {pct}%
      </Txt>
    </Pressable>
  );
}

/** Dupla en la lista de Duplas (la primera, destacada en lima). */
export function DuoStatCard({
  a,
  b,
  names,
  meta,
  pct,
  top,
}: {
  a: AvatarVM;
  b: AvatarVM;
  names: string;
  meta: string;
  pct: number;
  top: boolean;
}) {
  const bg = top ? palette.lime : palette.white;
  return (
    <View
      accessible
      accessibilityLabel={names + ', ' + meta + ', ' + pct + ' por ciento'}
      style={{
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: top ? palette.lime : palette.creamLine,
        borderRadius: radius.card,
        paddingVertical: 14,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <Pair a={a} b={b} size={36} ring={bg} overlap={9} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Txt w={700} s={15} ell>
          {names}
        </Txt>
        <Txt s={13} c={colors.text.onLightSecondary} num ell>
          {meta}
        </Txt>
      </View>
      <Txt d w={800} s={22} num>
        {pct}%
      </Txt>
    </View>
  );
}

/** Dupla provisoria (menos de 3 juntos): sin porcentaje. */
export function ProvisionalDuoRow({ names, meta }: { names: string; meta: string }) {
  return (
    <View
      accessible
      accessibilityLabel={names + ', provisoria, ' + meta}
      style={{
        backgroundColor: colors.state.provisional,
        borderRadius: 16,
        paddingVertical: 10,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 44,
      }}
    >
      <Txt w={600} s={14} ell style={{ flex: 1 }}>
        {names}
      </Txt>
      <Txt s={13} c={colors.text.onLightSecondary} num>
        {meta}
      </Txt>
    </View>
  );
}
