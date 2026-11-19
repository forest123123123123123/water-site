import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { CanisterSvg, CANISTER_VIEWBOX } from '@/components/product/illustrations/canister';
import { CoolerSvg, COOLER_VIEWBOX } from '@/components/product/illustrations/cooler';
import { JugSvg, JUG_VIEWBOX } from '@/components/product/illustrations/jug';
import type { Product } from './catalog';
import { formatNumber } from './format';
import { brandName } from './site';
import { svgToString } from './svg-string';

/**
 * Картинки для превью ссылок (Telegram, WhatsApp, соцсети) — 1200×630.
 * Название компании берётся из настроек, поэтому картинки обновляются сами.
 */
export const OG_SIZE = { width: 1200, height: 630 };

const FONT_DIR = join(process.cwd(), 'src/assets/og-fonts');
const font = (file: string) => {
  const buffer = readFileSync(join(FONT_DIR, file));
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
};

// Шрифты читаются один раз при загрузке модуля.
// Латиница и кириллица — отдельные файлы, поэтому у каждого своё имя и цепочка фолбэка.
const FONTS = [
  { name: 'Display', data: font('unbounded-latin-600-normal.woff'), weight: 600 as const, style: 'normal' as const },
  { name: 'DisplayCyr', data: font('unbounded-cyrillic-600-normal.woff'), weight: 600 as const, style: 'normal' as const },
  { name: 'Text', data: font('onest-latin-500-normal.woff'), weight: 500 as const, style: 'normal' as const },
  { name: 'TextCyr', data: font('onest-cyrillic-500-normal.woff'), weight: 500 as const, style: 'normal' as const },
];
const DISPLAY = 'Display, DisplayCyr';
const TEXT = 'Text, TextCyr';

/** Где на этикетке каждой иллюстрации стоят подписи (в единицах viewBox). */
const LABELS = {
  cooler: { Svg: CoolerSvg, box: COOLER_VIEWBOX, area: { x: 14, y: 292, w: 272, h: 96 }, brand: 30, volume: 30 },
  canister: { Svg: CanisterSvg, box: CANISTER_VIEWBOX, area: { x: 48, y: 200, w: 164, h: 120 }, brand: 26, volume: 28 },
  jug: { Svg: JugSvg, box: JUG_VIEWBOX, area: { x: 14, y: 158, w: 182, h: 52 }, brand: 15, volume: 14 },
} as const;

function Bottle({ product, height, dim = false }: { product: Product; height: number; dim?: boolean }) {
  if (!product.illustration) return null;
  const spec = LABELS[product.illustration];
  const scale = height / spec.box.height;
  const width = Math.round(spec.box.width * scale);
  const svg = svgToString(
    <spec.Svg id={`og-${product.illustration}`} brand="" volumeLabel="" tone={product.tone} animated={false} />,
  ).replace('<svg ', `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" `);
  const area = spec.area;

  return (
    <div style={{ position: 'relative', display: 'flex', width, height, opacity: dim ? 0.45 : 1 }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse принимает только <img> */}
      <img src={`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`} width={width} height={height} alt="" />
      <div
        style={{
          position: 'absolute',
          left: area.x * scale,
          top: area.y * scale,
          width: area.w * scale,
          height: area.h * scale,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4 * scale,
          fontFamily: DISPLAY,
        }}
      >
        <div style={{ fontSize: Math.min(spec.brand, 150 / Math.max(brandName.length, 3)) * scale, color: '#0d5e93', lineHeight: 1 }}>
          {brandName}
        </div>
        {product.volume != null && (
          <div style={{ fontSize: spec.volume * scale, color: '#0a2740', lineHeight: 1 }}>
            {`${formatNumber(product.volume)} L`}
          </div>
        )}
      </div>
    </div>
  );
}

const DROP = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><defs><linearGradient id="g" x1="0.2" y1="0" x2="0.8" y2="1"><stop offset="0" stop-color="#5cc3f0"/><stop offset="1" stop-color="#0d5e93"/></linearGradient></defs><path d="M20 3.5C20 3.5 7 18 7 26a13 13 0 0 0 26 0C33 18 20 3.5 20 3.5Z" fill="url(#g)"/><path d="M9.6 27.2c2.4-1.6 4.4-1.6 6.6 0s4.4 1.6 6.6 0 4.4-1.6 6.6 0" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>`;

export function renderOgImage({
  title,
  accent,
  subtitle,
  chips,
  products,
  highlightId,
}: {
  title: string;
  accent?: string;
  subtitle: string;
  chips: string[];
  products: Product[];
  highlightId?: string;
}) {
  // Самый большой объём — в центре, остальные по бокам (как на главной).
  const ordered = [...products].filter((p) => p.illustration).sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0)).slice(0, 3);
  const arranged: Product[] = ordered.length === 3 ? [ordered[1], ordered[0], ordered[2]] : ordered;
  const heightOf = (p: Product) => Math.round(400 * (LABELS[p.illustration!].box.height / COOLER_VIEWBOX.height));


  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: 'linear-gradient(135deg, #f7fbfe 0%, #e3f3fc 60%, #cfeaf9 100%)',
          fontFamily: TEXT,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: -140,
            top: -60,
            width: 760,
            height: 760,
            borderRadius: 9999,
            background: 'radial-gradient(circle, #ffffff 0%, rgba(178,224,246,0.55) 45%, rgba(178,224,246,0) 70%)',
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '64px 0 64px 72px', width: 610 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse принимает только <img> */}
            <img src={`data:image/svg+xml;base64,${Buffer.from(DROP).toString('base64')}`} width={56} height={56} alt="" />
            <div style={{ fontFamily: DISPLAY, fontSize: 38, color: '#050f1c', letterSpacing: -1 }}>{brandName}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                fontFamily: DISPLAY,
                fontSize: 54,
                lineHeight: 1.08,
                color: '#050f1c',
                letterSpacing: -2,
              }}
            >
              <div style={{ display: 'flex' }}>{title}</div>
              {accent ? <div style={{ display: 'flex', color: '#1a92d4' }}>{accent}</div> : null}
            </div>
            <div style={{ fontSize: 28, color: '#3a4d63' }}>{subtitle}</div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {chips.map((chip) => (
              <div
                key={chip}
                style={{
                  display: 'flex',
                  padding: '12px 24px',
                  borderRadius: 999,
                  background: '#ffffff',
                  fontFamily: DISPLAY,
                  fontSize: 24,
                  color: '#0a1a2c',
                  boxShadow: '0 8px 24px -12px rgba(13,94,147,0.35)',
                }}
              >
                {chip}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flex: 1, alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 72, paddingRight: 40 }}>
          {arranged.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', marginLeft: i === 0 ? 0 : -26, zIndex: p.id === arranged[1]?.id ? 0 : 1 }}>
              <Bottle product={p} height={heightOf(p)} dim={Boolean(highlightId && p.id !== highlightId)} />
            </div>
          ))}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: FONTS },
  );
}
