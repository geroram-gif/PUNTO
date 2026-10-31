import { useState } from 'react';
import { Share, View } from 'react-native';

import { palette } from '@/theme';

import { BottomSheet } from './BottomSheet';
import { Button, Txt, Wordmark } from './ui';

export interface ShareCardVM {
  bg: string;
  fg: string;
  dot: string;
  accent: string;
  accent2: string;
  kicker: string;
  big: string[];
  size: number;
  line: string;
  foot: string;
  /** Texto que se comparte (en la Fase 4, la tarjeta como imagen). */
  text: string;
}

/** Tarjeta para compartir (resultado o cara a cara) dentro de una hoja. */
export function ShareCardSheet({
  visible,
  title,
  card,
  onClose,
}: {
  visible: boolean;
  title: string;
  card: ShareCardVM;
  onClose: () => void;
}) {
  const [msg, setMsg] = useState('');
  const close = () => {
    setMsg('');
    onClose();
  };
  const share = async () => {
    try {
      const r = await Share.share({ message: card.text });
      setMsg(r.action === Share.sharedAction ? 'Listo, compartido.' : '');
    } catch {
      setMsg('');
    }
  };
  return (
    <BottomSheet visible={visible} title={title} onClose={close}>
      <View
        accessible
        accessibilityLabel={[card.kicker, card.big.join(' '), card.line].join('. ')}
        style={{ backgroundColor: card.bg, borderRadius: 24, padding: 20, gap: 8, minHeight: 300 }}
      >
        <Wordmark size={18} color={card.fg} dot={card.dot} />
        <Txt w={700} s={12} tr={0.08} upper c={card.accent}>
          {card.kicker}
        </Txt>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignContent: 'center',
            columnGap: 14,
          }}
        >
          {card.big.map((b, i) => (
            <Txt key={i} d w={800} s={card.size} lh={1} tr={-0.04} c={card.fg} num>
              {b}
            </Txt>
          ))}
        </View>
        <Txt d w={700} s={22} c={card.fg}>
          {card.line}
        </Txt>
        <Txt w={700} s={11} tr={0.08} upper c={card.accent2}>
          {card.foot}
        </Txt>
      </View>
      <Button label="Compartir…" tone="dark" onPress={share} />
      {msg ? (
        <Txt accessibilityLiveRegion="polite" s={14} lh={1.4} align="center">
          {msg}
        </Txt>
      ) : null}
    </BottomSheet>
  );
}

/** Variantes del prototipo: resultado (navy) y cara a cara (coral). */
export const shareCardTheme = {
  result: {
    bg: palette.navy,
    fg: palette.cream,
    dot: palette.coral,
    accent: palette.lime,
    accent2: palette.coral,
    foot: 'La cancha tiene memoria.',
  },
  h2h: {
    bg: palette.coral,
    fg: palette.navy,
    dot: palette.navy,
    accent: palette.navy,
    accent2: palette.navy,
    foot: 'Que hablen los números.',
  },
} as const;
