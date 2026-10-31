import { Pressable, View } from 'react-native';

import { colors, palette, radius } from '@/theme';

import { Txt } from './ui';

/** Insignia cuadrada del grupo con sus iniciales. */
export function GroupBadge({
  ini,
  bg,
  size,
  fontSize,
  r,
}: {
  ini: string;
  bg: string;
  size: number;
  fontSize: number;
  r: number;
}) {
  return (
    <View
      accessible={false}
      importantForAccessibility="no"
      style={{
        width: size,
        height: size,
        borderRadius: r,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Txt d w={800} s={fontSize} c={palette.navy}>
        {ini}
      </Txt>
    </View>
  );
}

/** Tarjeta de grupo. `full` en Inicio (crema), `compact` en Perfil (blanca con borde). */
export function GroupCard({
  ini,
  bg,
  name,
  meta,
  badge,
  badgeSub,
  aria,
  variant = 'full',
  onPress,
}: {
  ini: string;
  bg: string;
  name: string;
  meta: string;
  badge: string;
  badgeSub?: string;
  aria: string;
  variant?: 'full' | 'compact';
  onPress: () => void;
}) {
  const full = variant === 'full';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={aria}
      onPress={onPress}
      style={{
        backgroundColor: full ? palette.cream : palette.white,
        borderWidth: full ? 0 : 1,
        borderColor: palette.creamLine,
        borderRadius: radius.card,
        paddingVertical: 14,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <GroupBadge
        ini={ini}
        bg={bg}
        size={full ? 52 : 44}
        fontSize={full ? 18 : 15}
        r={full ? 16 : radius.groupBadge}
      />
      <View style={{ flex: 1, minWidth: 0, gap: full ? 3 : 2 }}>
        <Txt w={700} s={full ? 16 : 15} ell>
          {name}
        </Txt>
        <Txt s={13} c={colors.text.onLightSecondary} num ell>
          {meta}
        </Txt>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Txt d w={800} s={full ? 22 : 20}>
          {badge}
        </Txt>
        {full && badgeSub ? (
          <Txt s={12} c={colors.text.onLightSecondary}>
            {badgeSub}
          </Txt>
        ) : null}
      </View>
    </Pressable>
  );
}
