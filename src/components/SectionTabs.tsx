import { Pressable, View } from 'react-native';

import { palette, protoColors, radius } from '@/theme';

import { Txt } from './ui';

/** Pestañas internas (segmentado). */
export function SectionTabs<K extends string>({
  tabs,
  value,
  onChange,
  accessibilityLabel,
}: {
  tabs: readonly (readonly [K, string])[];
  value: K;
  onChange: (k: K) => void;
  accessibilityLabel: string;
}) {
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      style={{
        flexDirection: 'row',
        gap: 4,
        backgroundColor: palette.navy2,
        borderRadius: radius.chip,
        padding: 4,
      }}
    >
      {tabs.map(([k, label]) => {
        const on = k === value;
        return (
          <Pressable
            key={k}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={label}
            onPress={() => onChange(k)}
            style={{
              flex: 1,
              height: 44,
              borderRadius: radius.chip,
              backgroundColor: on ? palette.cream : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Txt w={on ? 700 : 500} s={14} c={on ? palette.navy : protoColors.sand}>
              {label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}
