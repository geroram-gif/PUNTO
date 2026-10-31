import Svg, { Circle, Path, Rect } from 'react-native-svg';

/** Íconos del prototipo (trazos 24×24). Siempre decorativos: el texto accesible va en el botón. */
export type IconName =
  | 'back'
  | 'chevron'
  | 'close'
  | 'plus'
  | 'minus'
  | 'share'
  | 'info'
  | 'check'
  | 'lock'
  | 'settings'
  | 'invite'
  | 'arrowDown';

export function Icon({
  name,
  size = 24,
  color,
  stroke = 2,
}: {
  name: IconName;
  size?: number;
  color: string;
  stroke?: number;
}) {
  const p = {
    stroke: color,
    strokeWidth: stroke,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      {name === 'back' && <Path d="M15 5l-7 7 7 7" {...p} />}
      {name === 'chevron' && <Path d="M9 5l7 7-7 7" {...p} />}
      {name === 'close' && <Path d="M6 6l12 12M18 6 6 18" {...p} />}
      {name === 'plus' && <Path d="M12 5v14M5 12h14" {...p} />}
      {name === 'minus' && <Path d="M5 12h14" {...p} />}
      {name === 'share' && (
        <>
          <Path d="M12 3v12M7 8l5-5 5 5" {...p} />
          <Path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" {...p} />
        </>
      )}
      {name === 'info' && (
        <>
          <Circle cx={12} cy={12} r={9} {...p} />
          <Path d="M12 7.5v5.5M12 16.5v.01" {...p} />
        </>
      )}
      {name === 'check' && <Path d="M5 12.5l4.5 4.5L19 7.5" {...p} />}
      {name === 'lock' && (
        <>
          <Rect x={5} y={10.5} width={14} height={10} rx={2.5} {...p} />
          <Path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" {...p} />
        </>
      )}
      {name === 'settings' && (
        <>
          <Circle cx={12} cy={12} r={3} {...p} />
          <Path
            d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"
            {...p}
          />
        </>
      )}
      {name === 'invite' && (
        <>
          <Circle cx={9} cy={8} r={3.5} {...p} />
          <Path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5M19 8v6M16 11h6" {...p} />
        </>
      )}
      {name === 'arrowDown' && <Path d="M12 5v14M6 13l6 6 6-6" {...p} />}
    </Svg>
  );
}
