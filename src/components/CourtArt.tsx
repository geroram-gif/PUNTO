import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { palette } from '@/theme';

/** Ilustraciones de cancha de los estados vacíos (decorativas). */
export function CourtArt({ variant }: { variant: 'home' | 'group' | 'h2h' }) {
  const line = palette.navyLine;
  if (variant === 'home')
    return (
      <Svg width="100%" height={180} viewBox="0 0 350 190" aria-hidden>
        <Rect
          x={6}
          y={6}
          width={338}
          height={178}
          rx={6}
          stroke={line}
          strokeWidth={2}
          fill="none"
        />
        <Path d="M175 6v178M6 95h338M90 6v178M260 6v178" stroke={line} strokeWidth={2} />
        <Circle cx={175} cy={95} r={22} fill={palette.coral} />
        <Circle cx={120} cy={60} r={6} fill={palette.lime} />
        <Circle cx={232} cy={134} r={8} fill={palette.lilac} />
      </Svg>
    );
  if (variant === 'group')
    return (
      <Svg width={140} height={80} viewBox="0 0 140 80" aria-hidden>
        <Rect
          x={3}
          y={3}
          width={134}
          height={74}
          rx={4}
          stroke={line}
          strokeWidth={2}
          fill="none"
        />
        <Path d="M70 3v74M3 40h134" stroke={line} strokeWidth={2} />
        <Circle cx={70} cy={40} r={10} fill={palette.coral} />
      </Svg>
    );
  return (
    <Svg width={160} height={96} viewBox="0 0 160 96" aria-hidden>
      <Rect x={4} y={4} width={152} height={88} rx={4} stroke={line} strokeWidth={2} fill="none" />
      <Path d="M80 4v88M4 48h152" stroke={line} strokeWidth={2} />
      <Circle cx={44} cy={48} r={8} fill={palette.coral} />
      <Circle
        cx={116}
        cy={48}
        r={8}
        stroke={palette.mist}
        strokeWidth={2}
        strokeDasharray="3 3"
        fill="none"
      />
    </Svg>
  );
}
