import { LabelText, PlasticDefs, Water, useSvgId, type IllustrationProps } from './water';

/** Канистра 10 л: прямоугольный корпус, ручка сверху, крышка-носик сбоку. Пропорции ≈ 24×40 см. */
export const CANISTER_VIEWBOX = { width: 260, height: 400 };

const BODY = 'M12 140 Q12 104 48 104 L212 104 Q248 104 248 140 L248 360 Q248 392 216 392 L44 392 Q12 392 12 360 Z';
const HANDLE =
  'M112 118 L112 46 Q112 22 136 22 L208 22 Q232 22 232 46 L232 118 Z M134 104 L134 58 Q134 44 148 44 L196 44 Q210 44 210 58 L210 104 Z';

const BUBBLES = [
  { x: 52, r: 3, dur: 5.6, delay: 0.4 },
  { x: 104, r: 2.4, dur: 6.4, delay: 2.2 },
  { x: 160, r: 3.6, dur: 5, delay: 1.1 },
  { x: 214, r: 2.2, dur: 7, delay: 3.3 },
];

export function CanisterSvg({
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
      viewBox={`0 0 ${CANISTER_VIEWBOX.width} ${CANISTER_VIEWBOX.height}`}
      className={className}
      style={style}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <defs>
        <PlasticDefs id={id} flat />
        <clipPath id={clipId}>
          <path d={BODY} />
        </clipPath>
        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="0.45" stopColor="#ffffff" stopOpacity="0.04" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <ellipse cx="130" cy="396" rx="122" ry="10" fill={`url(#${id}-shadow)`} />

      {/* Ручка */}
      <path d={HANDLE} fillRule="evenodd" fill="#d8eef9" />
      <path d={HANDLE} fillRule="evenodd" fill={`url(#${id}-plastic)`} />
      <path d={HANDLE} fillRule="evenodd" fill="none" stroke="#0d5e93" strokeOpacity="0.35" strokeWidth="2" />
      <path d="M120 100 L120 50 Q120 30 140 30 L170 30" fill="none" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="4" strokeLinecap="round" />

      <path d={BODY} fill="#e3f4fc" fillOpacity="0.55" />
      <Water
        id={id}
        clipId={clipId}
        surfaceY={126}
        bottomY={392}
        x0={12}
        x1={248}
        level={level}
        animated={animated}
        bubbles={BUBBLES}
      />
      <path d={BODY} fill={`url(#${id}-plastic)`} />

      {/* Фаска верхней грани и боковые рёбра */}
      <g clipPath={`url(#${clipId})`}>
        <path d="M12 134 Q130 142 248 134" fill="none" stroke="#ffffff" strokeOpacity="0.65" strokeWidth="2.5" />
        <path d="M12 140 Q130 148 248 140" fill="none" stroke="#0b578c" strokeOpacity="0.2" strokeWidth="2" />
        {[30, 230].map((x) => (
          <g key={x}>
            <path d={`M${x} 166 L${x} 370`} stroke="#0b578c" strokeOpacity="0.22" strokeWidth="3.5" />
            <path d={`M${x + 4} 166 L${x + 4} 370`} stroke="#ffffff" strokeOpacity="0.45" strokeWidth="1.5" />
          </g>
        ))}
        <polygon points="12,104 150,104 60,392 12,392" fill={`url(#${id}-sheen)`} />
      </g>

      {/* Этикетка-панель */}
      <rect x="48" y="200" width="164" height="120" rx="18" fill={`url(#${id}-label)`} fillOpacity="0.96" />
      <rect x="48" y="200" width="164" height="120" rx="18" fill="none" stroke={tone} strokeWidth="4" />
      <LabelText text={brand} x={130} y={248} maxWidth={130} maxSize={26} fill="#0d5e93" />
      <line x1="84" y1="262" x2="176" y2="262" stroke={tone} strokeOpacity="0.35" strokeWidth="2" />
      <text
        x="130"
        y="300"
        textAnchor="middle"
        className="font-display"
        fontWeight={700}
        fontSize="28"
        letterSpacing="0.5"
        fill="#0a2740"
      >
        {volumeLabel}
      </text>

      <rect x="20" y="150" width="8" height="220" rx="4" fill={`url(#${id}-shine)`} opacity="0.75" />
      <path d={BODY} fill="none" stroke="#0d5e93" strokeOpacity="0.38" strokeWidth="2" />

      {/* Носик и крышка */}
      <rect x="40" y="74" width="40" height="36" rx="4" fill="#cde9f7" />
      <rect x="40" y="74" width="40" height="36" rx="4" fill={`url(#${id}-plastic)`} />
      <rect x="32" y="70" width="56" height="10" rx="4" fill={tone} />
      <path d="M36 74 L36 52 Q36 40 48 40 L72 40 Q84 40 84 52 L84 74 Z" fill={tone} />
      <path d="M36 74 L36 52 Q36 40 48 40 L72 40 Q84 40 84 52 L84 74 Z" fill={`url(#${id}-cap-shade)`} />
      {Array.from({ length: 7 }, (_, i) => (
        <line key={i} x1={42 + i * 6} y1="50" x2={42 + i * 6} y2="70" stroke="#000000" strokeOpacity="0.12" strokeWidth="1.3" />
      ))}
      <rect x="46" y="44" width="28" height="3.5" rx="1.75" fill="#ffffff" opacity="0.45" />
    </svg>
  );
}

/** Компонент для страниц: уникальные id для градиентов у каждого экземпляра. */
export function Canister(props: IllustrationProps) {
  return <CanisterSvg id={useSvgId('canister')} {...props} />;
}
