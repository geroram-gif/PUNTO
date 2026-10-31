import { Pressable, View } from 'react-native';

import { palette, radius } from '@/theme';

import { Icon, Label, Txt } from './ui';

/**
 * Resumen de rivalidad (lila). `home`: cara a cara destacado con rótulo; `group`: la rivalidad del grupo.
 */
export function HeadToHeadSummary({
  variant,
  kicker,
  title,
  text,
  score,
  onPress,
}: {
  variant: 'home' | 'group';
  kicker?: string;
  title: string;
  text: string;
  score: string;
  onPress: () => void;
}) {
  const home = variant === 'home';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[kicker, title, text, score, 'Ver cara a cara']
        .filter(Boolean)
        .map((x) => (/[.!?]$/.test(x!) ? x : x + '.'))
        .join(' ')}
      onPress={onPress}
      style={{
        backgroundColor: palette.lilac,
        borderRadius: radius.card,
        paddingVertical: home ? 18 : 16,
        paddingLeft: 20,
        paddingRight: home ? 16 : 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <View style={{ flex: 1, minWidth: 0, gap: home ? 4 : 2 }}>
        {home && kicker ? <Label c={palette.navy}>{kicker}</Label> : null}
        <Txt d w={700} s={home ? 22 : 18}>
          {title}
        </Txt>
        <Txt s={14} ell={!home}>
          {text}
        </Txt>
      </View>
      <Txt d w={800} s={home ? 44 : 28} tr={home ? -0.03 : undefined} num>
        {score}
      </Txt>
      <Icon name="chevron" size={20} color={palette.navy} />
    </Pressable>
  );
}
