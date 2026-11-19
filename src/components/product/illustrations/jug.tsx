import { LabelText, PlasticDefs, Water, useSvgId, type IllustrationProps } from './water';

/** Бутылка 5 л: ПЭТ с «талией» для хвата и съёмной ручкой на горлышке. Пропорции ≈ 17×36 см. */
export const JUG_VIEWBOX = { width: 210, height: 380 };

const BODY =
  'M90 80 L90 96 C90 120 18 116 16 150 L16 214 C16 226 26 228 26 240 L26 256 C26 268 16 270 16 282 L16 350 Q16 372 38 372 L172 372 Q194 372 194 350 L194 282 C194 270 184 268 184 256 L184 240 C184 228 194 226 194 214 L194 150 C192 116 120 120 120 96 L120 80 Z';

const BUBBLES = [
  { x: 48, r: 2.6, dur: 5.4, delay: 0.3 },
  { x: 98, r: 3.2, dur: 6.2, delay: 1.9 },
  { x: 150, r: 2.2, dur: 4.8, delay: 0.9 },
  { x: 172, r: 2.8, dur: 6.8, delay: 3.1 },
];

export function JugSvg({
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
      viewBox={`0 0 ${JUG_VIEWBOX.width} ${JUG_VIEWBOX.height}`}
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

      <ellipse cx="105" cy="376" rx="96" ry="8" fill={`url(#${id}-shadow)`} />

      {/* Ручка на горлышке */}
      <path d="M70 76 C56 4 154 4 140 76" fill="none" stroke={tone} strokeWidth="9" strokeLinecap="round" />
      <path d="M70 76 C56 4 154 4 140 76" fill="none" stroke={`url(#${id}-cap-shade)`} strokeWidth="9" strokeLinecap="round" />
      <path d="M74 60 C66 14 104 12 120 16" fill="none" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="88" y="13" width="34" height="13" rx="6.5" fill={tone} />
      <rect x="88" y="13" width="34" height="13" rx="6.5" fill={`url(#${id}-cap-shade)`} />

      <path d={BODY} fill="#e8f6fd" fillOpacity="0.5" />
      <Water
        id={id}
        clipId={clipId}
        surfaceY={114}
        bottomY={372}
        x0={16}
        x1={194}
        level={level}
        animated={animated}
        bubbles={BUBBLES}
      />
      <path d={BODY} fill={`url(#${id}-plastic)`} />

      {/* Грани плеч и рёбра «талии» */}
      <g clipPath={`url(#${clipId})`}>
        <path d="M98 100 C84 116 54 124 38 146" fill="none" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="2" />
        <path d="M112 100 C126 116 156 124 172 146" fill="none" stroke="#0b578c" strokeOpacity="0.16" strokeWidth="2" />
        {[234, 246, 258].map((y) => (
          <g key={y}>
            <path d={`M20 ${y} Q105 ${y + 6} 190 ${y}`} fill="none" stroke="#0b578c" strokeOpacity="0.26" strokeWidth="2.4" />
            <path d={`M20 ${y + 3} Q105 ${y + 9} 190 ${y + 3}`} fill="none" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1.2" />
          </g>
        ))}
        {/* Этикетка */}
        <path d="M14 156 Q105 166 196 156 L196 208 Q105 218 14 208 Z" fill={`url(#${id}-label)`} fillOpacity="0.96" />
        <path d="M14 156 Q105 166 196 156" fill="none" stroke={tone} strokeWidth="4" />
        <path d="M14 208 Q105 218 196 208" fill="none" stroke={tone} strokeWidth="4" />
      </g>
      <LabelText text={brand} x={105} y={182} maxWidth={120} maxSize={17} fill="#0d5e93" />
      <text
        x="105"
        y="203"
        textAnchor="middle"
        className="font-display"
        fontWeight={700}
        fontSize="15"
        letterSpacing="0.4"
        fill="#0a2740"
      >
        {volumeLabel}
      </text>

      <rect x="26" y="160" width="9" height="196" rx="4.5" fill={`url(#${id}-shine)`} opacity="0.8" />
      <rect x="178" y="166" width="5" height="180" rx="2.5" fill="#ffffff" opacity="0.22" />
      <path d={BODY} fill="none" stroke="#0d5e93" strokeOpacity="0.38" strokeWidth="1.8" />

      {/* Кольцо ручки и крышка */}
      <rect x="66" y="72" width="78" height="10" rx="5" fill={tone} />
      <rect x="66" y="72" width="78" height="10" rx="5" fill={`url(#${id}-cap-shade)`} />
      <path d="M86 74 L86 50 Q86 38 98 38 L112 38 Q124 38 124 50 L124 74 Z" fill={tone} />
      <path d="M86 74 L86 50 Q86 38 98 38 L112 38 Q124 38 124 50 L124 74 Z" fill={`url(#${id}-cap-shade)`} />
      {Array.from({ length: 6 }, (_, i) => (
        <line key={i} x1={91 + i * 5.6} y1="48" x2={91 + i * 5.6} y2="70" stroke="#000000" strokeOpacity="0.12" strokeWidth="1.2" />
      ))}
      <rect x="94" y="42" width="22" height="3" rx="1.5" fill="#ffffff" opacity="0.45" />
    </svg>
  );
}

/** Компонент для страниц: уникальные id для градиентов у каждого экземпляра. */
export function Jug(props: IllustrationProps) {
  return <JugSvg id={useSvgId('jug')} {...props} />;
}
