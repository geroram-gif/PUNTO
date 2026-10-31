import { View } from 'react-native';

import type { GroupVM } from '@/features/group/vm';
import { colors, palette, radius } from '@/theme';

import { Label, Txt } from './ui';

/** Tu lugar en el grupo (o tu progreso si todavía sos provisorio). */
export function PlayerStatCard({ place }: { place: NonNullable<GroupVM['place']> }) {
  return (
    <View
      accessible
      accessibilityLabel={place.label + ': ' + place.big + '. ' + place.line1 + '. ' + place.line2}
      style={{
        backgroundColor: palette.navy,
        borderRadius: radius.card,
        paddingVertical: 16,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <Txt d w={800} s={place.size} lh={0.95} tr={-0.04} c={palette.cream} num>
        {place.big}
      </Txt>
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Label c={colors.text.onDarkSecondary}>{place.label}</Label>
        <Txt w={600} s={15} c={palette.cream} num>
          {place.line1}
        </Txt>
        <Txt s={13} c={colors.text.onDarkSecondary}>
          {place.line2}
        </Txt>
      </View>
    </View>
  );
}
