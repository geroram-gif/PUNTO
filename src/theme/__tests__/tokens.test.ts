/** src/theme tiene que reflejar design/tokens.json sin desvíos. */
import tokens from '../../../design/tokens.json';
import { MIN_DUO, MIN_H2H, MIN_RANK } from '@/lib/stats';

import {
  colors,
  fontFamily,
  heroNumber,
  heroNumberSize,
  layout,
  motion,
  palette,
  radius,
  shadow,
  space,
  typography,
} from '..';

type Scale = keyof typeof tokens.type.scale;

describe('tokens de diseño', () => {
  it('paleta idéntica', () => {
    expect(palette).toEqual(tokens.color);
  });

  it('roles semánticos apuntan al color del token', () => {
    const sem = tokens.semantic as Record<string, string>;
    const c = (k: string) => palette[sem[k] as keyof typeof palette];
    expect(colors.surface).toEqual({
      app: c('surface.app'),
      read: c('surface.read'),
      card: c('surface.card'),
      raised: c('surface.raised'),
    });
    expect(colors.text).toEqual({
      onDark: c('text.onDark'),
      onDarkSecondary: c('text.onDark.secondary'),
      onLight: c('text.onLight'),
      onLightSecondary: c('text.onLight.secondary'),
      onLightTertiary: c('text.onLight.tertiary'),
    });
    expect(colors.action).toEqual({
      primary: c('action.primary'),
      primaryText: c('action.primary.text'),
    });
    expect(colors.stat).toEqual({ win: c('stat.win'), social: c('stat.social') });
    expect(colors.state.provisional).toBe(c('state.provisional'));
    expect(colors.border).toEqual({ onLight: c('border.onLight'), onDark: c('border.onDark') });
    expect(sem['guest.border']).toBe('dashed 1.5px slate (light) / mist (dark)');
    expect(colors.guest).toEqual({
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderOnLight: palette.slate,
      borderOnDark: palette.mist,
    });
  });

  it('tipografía: familia, peso, tamaño y tracking', () => {
    const scale = tokens.type.scale;
    const famOf = (k: Exclude<Scale, 'heroNumber'>) => {
      const t = scale[k];
      return (fontFamily[t.family as 'display' | 'ui'] as Record<number, string>)[t.weight];
    };
    for (const k of Object.keys(typography) as Exclude<Scale, 'heroNumber'>[]) {
      const t = scale[k] as { size: number; letterSpacing?: string; lineHeight?: number };
      const style = typography[k] as {
        fontFamily: string;
        fontSize: number;
        letterSpacing?: number;
        lineHeight?: number;
      };
      expect(style.fontFamily).toBe(famOf(k));
      expect(style.fontSize).toBe(t.size);
      if (t.letterSpacing)
        expect(style.letterSpacing).toBeCloseTo(parseFloat(t.letterSpacing) * t.size);
      else expect(style.letterSpacing).toBeUndefined();
      if (t.lineHeight) expect(style.lineHeight).toBeCloseTo(t.lineHeight * t.size);
    }
    expect(Object.keys(typography).sort()).toEqual(
      Object.keys(scale)
        .filter((k) => k !== 'heroNumber')
        .sort(),
    );
    expect(typography.label.textTransform).toBe(scale.label.transform);
    expect([heroNumberSize.min, heroNumberSize.max]).toEqual(scale.heroNumber.size);
    expect(heroNumber(104)).toMatchObject({
      fontFamily: 'Sora_800ExtraBold',
      fontSize: 104,
      letterSpacing: -5.2,
      lineHeight: 88.4,
      fontVariant: ['tabular-nums'],
    });
    expect(heroNumber(200).fontSize).toBe(120);
    expect(tokens.type.family).toEqual({ display: 'Sora', ui: 'Inter' });
  });

  it('espaciado, layout, radios y sombras', () => {
    expect([...space]).toEqual(tokens.space);
    const { referenceViewport, ...rest } = layout;
    const { referenceViewport: refTokens, ...restTokens } = tokens.layout;
    expect(rest).toEqual(restTokens);
    expect([referenceViewport.width, referenceViewport.height]).toEqual(refTokens);
    expect(radius).toEqual(tokens.radius);
    expect(shadow).toEqual(tokens.shadow);
  });

  it('movimiento', () => {
    expect(tokens.motion.panel).toBe(
      `${motion.panel.duration}ms ${motion.panel.easing} fade+${motion.panel.offsetY}px`,
    );
    expect(tokens.motion.sheet).toBe(`${motion.sheet.duration}ms cubic-bezier(.2,.8,.2,1)`);
    expect(motion.sheet.bezier).toEqual([0.2, 0.8, 0.2, 1]);
    expect(tokens.motion.celebration).toBe(
      `${motion.celebration.popDuration}ms pop + ${motion.celebration.dotsDuration / 1000}s dots`,
    );
  });

  it('umbrales del motor', () => {
    expect([MIN_RANK, MIN_DUO, MIN_H2H]).toEqual([
      tokens.thresholds.rankingMinMatches,
      tokens.thresholds.duoHighlightMinMatches,
      tokens.thresholds.h2hVerdictMinMatches,
    ]);
  });
});
