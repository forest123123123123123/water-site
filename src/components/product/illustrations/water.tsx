import { useId, type CSSProperties } from 'react';

/** Уникальный префикс для id внутри SVG (градиенты, маски) — у каждого экземпляра свой. */
export function useSvgId(name: string) {
  return `${name}-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
}

function wavePath(x0: number, x1: number, y: number, amplitude: number, bottom: number) {
  const start = Math.floor((x0 - 200) / 100) * 100;
  let d = `M${start} ${y} q25 ${-amplitude} 50 0`;
  for (let x = start + 50; x < x1 + 200; x += 50) d += ' t50 0';
  return `${d} V${bottom} H${start} Z`;
}

type Bubble = { x: number; r: number; dur: number; delay: number };

/**
 * Вода внутри тары: две волны со сдвигом (эффект глубины), блик на поверхности
 * и пузырьки. Уровень задаётся долей от полного (level 0…1).
 */
export function Water({
  id,
  clipId,
  surfaceY,
  bottomY,
  x0,
  x1,
  level = 1,
  animated = true,
  bubbles = [],
}: {
  id: string;
  clipId: string;
  surfaceY: number;
  bottomY: number;
  x0: number;
  x1: number;
  level?: number;
  animated?: boolean;
  bubbles?: Bubble[];
}) {
  const height = bottomY - surfaceY;
  const offset = (1 - Math.min(1, Math.max(0, level))) * (height + 12);
  const rise = -(height - 30);

  return (
    <g clipPath={`url(#${clipId})`}>
      <defs>
        <linearGradient id={`${id}-water`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9fdcf7" stopOpacity="0.92" />
          <stop offset="0.3" stopColor="#4fb3e8" stopOpacity="0.9" />
          <stop offset="1" stopColor="#0d65a8" stopOpacity="0.96" />
        </linearGradient>
        <linearGradient id={`${id}-water-back`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c8ecfb" stopOpacity="0.85" />
          <stop offset="1" stopColor="#2b8fd0" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <g className="water-level" style={{ transform: `translateY(${offset}px)` }}>
        <path
          className={animated ? 'water-wave-back' : undefined}
          d={wavePath(x0, x1, surfaceY - 3, 4, bottomY + 20)}
          fill={`url(#${id}-water-back)`}
        />
        <path
          className={animated ? 'water-wave' : undefined}
          d={wavePath(x0, x1, surfaceY + 2, 5, bottomY + 20)}
          fill={`url(#${id}-water)`}
        />
        <path
          className={animated ? 'water-wave' : undefined}
          d={wavePath(x0, x1, surfaceY + 2, 5, surfaceY + 2).replace(/ V.*$/, '')}
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.7"
          strokeWidth="2"
        />
        {animated &&
          bubbles.map((b, i) => (
            <circle
              key={i}
              className="water-bubble"
              cx={b.x}
              cy={bottomY - 14}
              r={b.r}
              fill="#ffffff"
              fillOpacity="0.75"
              style={
                {
                  '--dur': `${b.dur}s`,
                  '--delay': `${b.delay}s`,
                  '--rise': `${rise}px`,
                } as CSSProperties
              }
            />
          ))}
      </g>
    </g>
  );
}

/** Подпись бренда на этикетке: размер шрифта подбирается под длину названия. */
export function LabelText({
  text,
  x,
  y,
  maxWidth,
  maxSize,
  fill,
}: {
  text: string;
  x: number;
  y: number;
  maxWidth: number;
  maxSize: number;
  fill: string;
}) {
  const size = Math.min(maxSize, maxWidth / (Math.max(text.length, 2) * 0.74));
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      className="font-display"
      fontWeight={700}
      fontSize={size}
      letterSpacing={size * 0.02}
      fill={fill}
    >
      {text}
    </text>
  );
}

/** Общие градиенты пластика: затемнение краёв и блики, как у прозрачной тары. */
export function PlasticDefs({ id, flat = false }: { id: string; flat?: boolean }) {
  return (
    <>
      <linearGradient id={`${id}-plastic`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#0a4b7c" stopOpacity={flat ? 0.5 : 0.55} />
        <stop offset={flat ? 0.05 : 0.07} stopColor="#2f93d4" stopOpacity="0.22" />
        <stop offset="0.2" stopColor="#ffffff" stopOpacity="0.16" />
        <stop offset="0.45" stopColor="#e9f7ff" stopOpacity="0.05" />
        <stop offset="0.72" stopColor="#62b8e9" stopOpacity="0.07" />
        <stop offset={flat ? 0.95 : 0.9} stopColor="#1f7cc0" stopOpacity="0.22" />
        <stop offset="1" stopColor="#0a4472" stopOpacity="0.58" />
      </linearGradient>
      <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="0.18" stopColor="#ffffff" stopOpacity="0.75" />
        <stop offset="0.8" stopColor="#ffffff" stopOpacity="0.45" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={`${id}-cap-shade`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#000000" stopOpacity="0.35" />
        <stop offset="0.28" stopColor="#ffffff" stopOpacity="0.3" />
        <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.06" />
        <stop offset="0.82" stopColor="#000000" stopOpacity="0.1" />
        <stop offset="1" stopColor="#000000" stopOpacity="0.4" />
      </linearGradient>
      <linearGradient id={`${id}-label`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#cfe6f4" />
        <stop offset="0.18" stopColor="#ffffff" />
        <stop offset="0.75" stopColor="#f6fbfe" />
        <stop offset="1" stopColor="#c4ddee" />
      </linearGradient>
      <radialGradient id={`${id}-shadow`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#0a1a2c" stopOpacity="0.32" />
        <stop offset="1" stopColor="#0a1a2c" stopOpacity="0" />
      </radialGradient>
    </>
  );
}

export type IllustrationProps = {
  brand: string;
  volumeLabel: string;
  tone: string;
  level?: number;
  animated?: boolean;
  className?: string;
  style?: CSSProperties;
  title?: string;
};
