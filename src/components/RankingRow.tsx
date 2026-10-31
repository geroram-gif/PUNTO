import { Pressable, View } from 'react-native';

import { rankingRowColors, type ProvisionalRowVM, type RankingRowVM } from '@/features/group/vm';
import { colors, palette, radius } from '@/theme';

import { Bar } from './Bar';
import { PlayerAvatar } from './PlayerAvatar';
import { GuestTag, Icon, MeTag, Txt } from './ui';

/** Fila del ranking. La tuya va en navy y no abre cara a cara. */
export function RankingRow({ r, onPress }: { r: RankingRowVM; onPress: () => void }) {
  const k = rankingRowColors(r.me);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={r.aria}
      accessibilityState={{ disabled: r.me }}
      disabled={r.me}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 60,
        paddingHorizontal: 12,
        borderRadius: 14,
        backgroundColor: k.rowBg,
      }}
    >
      <View
        style={{
          width: 30,
          height: 28,
          borderRadius: radius.chip,
          backgroundColor: r.isFirst ? palette.lime : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Txt d w={800} s={16} c={r.isFirst ? palette.navy : k.fg} num>
          {r.pos}
        </Txt>
      </View>
      <PlayerAvatar av={r.av} size={36} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <Txt w={700} s={15} c={k.fg} ell>
            {r.name}
          </Txt>
          {r.me ? <MeTag onDark /> : null}
          {r.guest ? <GuestTag /> : null}
        </View>
        <Txt s={13} c={k.sub} num ell>
          {r.pj} partidos · {r.g} ganados
        </Txt>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 5 }}>
        <Txt d w={800} s={20} lh={1} c={k.fg} num>
          {r.pct}%
        </Txt>
        <Bar ratio={r.pct / 100} width={48} height={4} track={k.track} fill={k.fill} />
      </View>
      <View style={{ width: 16, alignItems: 'flex-end', opacity: r.me ? 0 : 1 }}>
        <Icon name="chevron" size={16} color={k.fg} />
      </View>
    </Pressable>
  );
}

/** Tabla blanca del ranking. */
export function RankingTable({
  rows,
  onOpen,
}: {
  rows: RankingRowVM[];
  onOpen: (id: string) => void;
}) {
  return (
    <View
      style={{
        backgroundColor: palette.white,
        borderWidth: 1,
        borderColor: palette.creamLine,
        borderRadius: radius.card,
        padding: 6,
        gap: 2,
      }}
    >
      {rows.map((r) => (
        <RankingRow key={r.id} r={r} onPress={() => onOpen(r.id)} />
      ))}
    </View>
  );
}

/** Progreso hacia los 5 partidos: «Falta 1» y cinco puntos. */
export function ProvisionalStatIndicator({
  left,
  played,
  aria,
}: {
  left: string;
  played: number;
  aria: string;
}) {
  return (
    <View style={{ alignItems: 'flex-end', gap: 5 }}>
      <Txt w={600} s={12}>
        {left}
      </Txt>
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={aria}
        style={{ flexDirection: 'row', gap: 3 }}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              borderWidth: 1.5,
              borderColor: palette.navy,
              backgroundColor: i < played ? palette.navy : 'transparent',
            }}
          />
        ))}
      </View>
    </View>
  );
}

/** Fila de un jugador provisorio (menos de 5 partidos, sin puesto). */
export function ProvisionalRankingRow({
  r,
  onPress,
}: {
  r: ProvisionalRowVM;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={r.aria}
      accessibilityState={{ disabled: r.me }}
      disabled={r.me}
      onPress={onPress}
      style={{
        backgroundColor: colors.state.provisional,
        borderRadius: radius.card,
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 60,
      }}
    >
      <PlayerAvatar av={r.av} size={36} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <Txt w={700} s={15} ell>
            {r.name}
          </Txt>
          {r.me ? <MeTag onDark={false} /> : null}
          {r.guest ? <GuestTag /> : null}
        </View>
        <Txt s={13} c={colors.text.onLightSecondary} num>
          {r.meta}
        </Txt>
      </View>
      <ProvisionalStatIndicator left={r.left} played={r.played} aria={r.dotsAria} />
    </Pressable>
  );
}
