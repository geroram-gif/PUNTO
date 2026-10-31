import { View } from 'react-native';

import { colors, palette, radius } from '@/theme';

import { Txt, WinTag } from './ui';

/** Resumen navy del partido (revisión antes de guardar y detalle). */
export function MatchSummary({
  meta,
  rows,
  winLabel,
}: {
  meta: string;
  rows: { name: string; win: boolean; sets: number[] }[];
  winLabel: string;
}) {
  return (
    <View
      style={{
        backgroundColor: palette.navy,
        borderRadius: radius.card,
        paddingVertical: 16,
        paddingHorizontal: 18,
        gap: 12,
      }}
    >
      <Txt s={13} c={colors.text.onDarkSecondary}>
        {meta}
      </Txt>
      {rows.map((r, k) => (
        <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Txt
            w={r.win || winLabel === 'GANAN' ? 700 : 400}
            s={16}
            c={r.win || winLabel === 'GANAN' ? palette.cream : colors.text.onDarkSecondary}
            ell
            style={{ flex: 1 }}
          >
            {r.name}
          </Txt>
          {r.win ? <WinTag label={winLabel} /> : null}
          {r.sets.map((v, i) => (
            <Txt
              key={i}
              d
              w={r.win || winLabel === 'GANAN' ? 700 : 600}
              s={20}
              c={r.win || winLabel === 'GANAN' ? palette.cream : colors.text.onDarkSecondary}
              num
              align="center"
              style={{ width: 26 }}
            >
              {v}
            </Txt>
          ))}
        </View>
      ))}
    </View>
  );
}
