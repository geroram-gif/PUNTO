import { useEffect } from 'react';
import { AccessibilityInfo, View } from 'react-native';

import { palette, protoShadow } from '@/theme';

import { Icon, Txt } from './ui';

/** Aviso breve de confirmación (3,2 s). Se anuncia a VoiceOver. */
export function Toast({ message, bottom }: { message: string; bottom: number }) {
  useEffect(() => {
    if (message) AccessibilityInfo.announceForAccessibility(message);
  }, [message]);
  if (!message) return null;
  return (
    <View
      accessibilityLiveRegion="polite"
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom,
        backgroundColor: palette.navy,
        borderWidth: 1,
        borderColor: palette.navyLine,
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        boxShadow: protoShadow.toast,
      }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: palette.lime,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="check" size={14} color={palette.navy} stroke={3} />
      </View>
      <Txt s={14} lh={1.4} c={palette.cream} style={{ flex: 1 }}>
        {message}
      </Txt>
    </View>
  );
}
