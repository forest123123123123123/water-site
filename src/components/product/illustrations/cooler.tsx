import { LabelText, PlasticDefs, Water, useSvgId, type IllustrationProps } from './water';

/** Бутыль 20 л для кулера: цилиндр с рёбрами жёсткости, узкое горлышко, крышка. Пропорции ≈ 27×49 см. */
export const COOLER_VIEWBOX = { width: 300, height: 520 };

const BODY =
  'M122 56 L122 84 C122 114 14 120 14 172 L14 206 Q22 214 14 222 L14 236 Q22 244 14 252 L14 420 Q22 428 14 436 L14 450 Q22 458 14 466 L14 474 Q14 500 40 500 L260 500 Q286 500 286 474 L286 466 Q278 458 286 450 L286 436 Q278 428 286 420 L286 252 Q278 244 286 236 L286 222 Q278 214 286 206 L286 172 C286 120 178 114 178 84 L178 56 Z';

const RINGS = [214, 244, 428, 458];

const BUBBLES = [
  { x: 70, r: 3.5, dur: 6.5, delay: 0 },
  { x: 118, r: 2.5, dur: 5.2, delay: 1.6 },
  { x: 176, r: 4, dur: 7.4, delay: 0.8 },
  { x: 222, r: 2.8, dur: 5.8, delay: 2.9 },
  { x: 248, r: 2, dur: 6.8, delay: 4.1 },
  { x: 96, r: 2, dur: 7.8, delay: 3.4 },
];

export function CoolerSvg({
  id,
  brand,
  volumeLabel,
  tone,
  level = 1,
  animated = true,
  className,
  style,
  title,
}: IllustrationProps & { id: string }) {
  const clipId = `${id}-clip`;

  return (
    <svg
      viewBox={`0 0 ${COOLER_VIEWBOX.width} ${COOLER_VIEWBOX.height}`}
      className={className}
      style={style}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <defs>
        <PlasticDefs id={id} />
        <clipPath id={clipId}>
          <path d={BODY} />
        </clipPath>
      </defs>

      <ellipse cx="150" cy="506" rx="132" ry="12" fill={`url(#${id}-shadow)`} />

      {/* Пустая часть бутыли — лёгкий голубой оттенок пластика */}
      <path d={BODY} fill="#e3f4fc" fillOpacity="0.55" />

      <Water
        id={id}
        clipId={clipId}
        surfaceY={112}
        bottomY={500}
        x0={14}
        x1={286}
        level={level}
        animated={animated}
        bubbles={BUBBLES}
      />

      {/* Объём пластика поверх воды */}
      <path d={BODY} fill={`url(#${id}-plastic)`} />
      <ellipse cx="150" cy="492" rx="124" ry="10" fill="#0a4472" fillOpacity="0.18" clipPath={`url(#${clipId})`} />

      {/* Рёбра жёсткости */}
      {RINGS.map((y) => (
        <g key={y} clipPath={`url(#${clipId})`}>
          <path d={`M10 ${y} Q150 ${y + 13} 290 ${y}`} fill="none" stroke="#0b578c" strokeOpacity="0.32" strokeWidth="3.5" />
          <path d={`M10 ${y + 5} Q150 ${y + 18} 290 ${y + 5}`} fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="1.6" />
        </g>
      ))}

      {/* Этикетка, повторяющая изгиб цилиндра */}
      <g clipPath={`url(#${clipId})`}>
        <path d="M10 288 Q150 304 290 288 L290 386 Q150 402 10 386 Z" fill={`url(#${id}-label)`} fillOpacity="0.95" />
        <path d="M10 288 Q150 304 290 288" fill="none" stroke={tone} strokeWidth="5" />
        <path d="M10 386 Q150 402 290 386" fill="none" stroke={tone} strokeWidth="5" />
      </g>
      <LabelText text={brand} x={150} y={334} maxWidth={170} maxSize={30} fill="#0d5e93" />
      <text
        x="150"
        y="375"
        textAnchor="middle"
        className="font-display"
        fontWeight={700}
        fontSize="30"
        letterSpacing="0.5"
        fill="#0a2740"
      >
        {volumeLabel}
      </text>

      {/* Блики */}
      <rect x="32" y="182" width="13" height="292" rx="6.5" fill={`url(#${id}-shine)`} opacity="0.8" />
      <rect x="54" y="196" width="4" height="250" rx="2" fill="#ffffff" opacity="0.35" />
      <rect x="262" y="196" width="7" height="268" rx="3.5" fill="#ffffff" opacity="0.22" />
      <path d="M112 94 C92 112 56 122 38 156" fill="none" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="6" strokeLinecap="round" />

      <path d={BODY} fill="none" stroke="#0d5e93" strokeOpacity="0.38" strokeWidth="2" />

      {/* Горлышко и крышка */}
      <rect x="108" y="50" width="84" height="13" rx="5" fill={tone} />
      <rect x="108" y="50" width="84" height="13" rx="5" fill={`url(#${id}-cap-shade)`} />
      <path d="M116 54 L116 24 Q116 8 132 8 L168 8 Q184 8 184 24 L184 54 Z" fill={tone} />
      <path d="M116 54 L116 24 Q116 8 132 8 L168 8 Q184 8 184 24 L184 54 Z" fill={`url(#${id}-cap-shade)`} />
      {Array.from({ length: 10 }, (_, i) => (
        <line key={i} x1={123 + i * 6} y1="20" x2={123 + i * 6} y2="50" stroke="#000000" strokeOpacity="0.12" strokeWidth="1.4" />
      ))}
      <rect x="128" y="12" width="44" height="4" rx="2" fill="#ffffff" opacity="0.45" />
    </svg>
  );
}

/** Компонент для страниц: уникальные id для градиентов у каждого экземпляра. */
export function CoolerBottle(props: IllustrationProps) {
  return <CoolerSvg id={useSvgId('cooler')} {...props} />;
}
