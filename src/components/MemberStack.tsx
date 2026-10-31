import { View } from 'react-native';

import type { AvatarVM } from '@/features/shared/ctx';
import { palette } from '@/theme';

import { PlayerAvatar } from './PlayerAvatar';
import { Txt } from './ui';

/** Hasta 5 avatares superpuestos y «+n». */
export function MemberStack({
  stack,
  more,
  aria,
}: {
  stack: AvatarVM[];
  more: string | null;
  aria: string;
}) {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={aria}
      style={{ flexDirection: 'row', alignItems: 'center' }}
    >
      {stack.map((a, i) => (
        <PlayerAvatar
          key={i}
          av={a}
          size={30}
          fontSize={10}
          ring={palette.navy}
          style={{ marginRight: -10 }}
        />
      ))}
      {more ? (
        <View style={{ borderRadius: 17, borderWidth: 2, borderColor: palette.navy }}>
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: palette.navyLine,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Txt w={700} s={11} c={palette.cream}>
              {more}
            </Txt>
          </View>
        </View>
      ) : null}
    </View>
  );
}
