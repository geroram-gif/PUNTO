import { Pressable, View } from 'react-native';

import type { SetRowVM } from '@/features/register/vm';
import { palette } from '@/theme';

import { Icon, Txt } from './ui';

function Step({
  kind,
  label,
  onPress,
}: {
  kind: 'minus' | 'plus';
  label: string;
  onPress: () => void;
}) {
  const plus = kind === 'plus';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: plus ? 0 : 1.5,
        borderColor: palette.navy,
        backgroundColor: plus ? palette.navy : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={kind} size={16} color={plus ? palette.cream : palette.navy} stroke={2.25} />
    </Pressable>
  );
}

/** Games de un set para cada pareja, con − y +. Muestra el error del set si no cierra. */
export function SetScoreInput({
  r,
  onBump,
}: {
  r: SetRowVM;
  onBump: (team: 0 | 1, delta: 1 | -1) => void;
}) {
  const side = (team: 0 | 1) => (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
      }}
    >
      <Step
        kind="minus"
        label={team === 0 ? r.ariaDecA : r.ariaDecB}
        onPress={() => onBump(team, -1)}
      />
      <Txt
        accessibilityLiveRegion="polite"
        d
        w={800}
        s={26}
        num
        align="center"
        style={{ width: 28 }}
      >
        {team === 0 ? r.a : r.b}
      </Txt>
      <Step
        kind="plus"
        label={team === 0 ? r.ariaIncA : r.ariaIncB}
        onPress={() => onBump(team, 1)}
      />
    </View>
  );
  return (
    <View style={{ gap: 6 }}>
      <View
        style={{
          backgroundColor: palette.white,
          borderWidth: 1.5,
          borderColor: r.err ? palette.navy : palette.creamLine,
          borderRadius: 16,
          paddingVertical: 10,
          paddingRight: 10,
          paddingLeft: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <Txt w={600} s={14} style={{ width: 54 }}>
          {r.label}
        </Txt>
        {side(0)}
        {side(1)}
      </View>
      {r.err ? (
        <View
          accessibilityRole="alert"
          style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start', paddingHorizontal: 4 }}
        >
          <Icon name="info" size={16} color={palette.navy} />
          <Txt s={13} lh={1.4} style={{ flex: 1 }}>
            <Txt w={700} s={13} lh={1.4}>
              Revisá este set.
            </Txt>{' '}
            {r.err}
          </Txt>
        </View>
      ) : null}
    </View>
  );
}
