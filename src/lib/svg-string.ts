import { Fragment, isValidElement, type ReactNode } from 'react';

/**
 * Мини-сериализатор SVG-разметки из JSX в строку — для картинок превью (next/og),
 * где нельзя использовать react-dom/server. Поддерживает только «чистые»
 * компоненты без хуков (иллюстрации тары устроены именно так).
 */

// В SVG эти атрибуты пишутся в camelCase; остальные React-пропсы → kebab-case.
const CAMEL_ATTRIBUTES = new Set([
  'viewBox',
  'preserveAspectRatio',
  'gradientUnits',
  'gradientTransform',
  'patternUnits',
  'patternContentUnits',
  'clipPathUnits',
  'textLength',
  'lengthAdjust',
  'stdDeviation',
  'spreadMethod',
]);

function attributeName(key: string) {
  if (key === 'className') return 'class';
  if (CAMEL_ATTRIBUTES.has(key)) return key;
  return key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

function escape(value: unknown) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function styleString(style: Record<string, unknown>) {
  return Object.entries(style)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `${k.startsWith('--') ? k : k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}:${v}`)
    .join(';');
}

export function svgToString(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return escape(node);
  if (Array.isArray(node)) return node.map(svgToString).join('');
  if (!isValidElement(node)) return '';

  const { type, props } = node as { type: unknown; props: Record<string, unknown> };
  if (type === Fragment) return svgToString(props.children as ReactNode);
  if (typeof type === 'function') return svgToString((type as (p: Record<string, unknown>) => ReactNode)(props));
  if (typeof type !== 'string') return '';

  let attributes = '';
  for (const [key, value] of Object.entries(props)) {
    if (key === 'children' || value == null || value === false || typeof value === 'function') continue;
    if (key === 'style') {
      const css = styleString(value as Record<string, unknown>);
      if (css) attributes += ` style="${escape(css)}"`;
      continue;
    }
    attributes += ` ${attributeName(key)}="${escape(value === true ? 'true' : value)}"`;
  }
  return `<${type}${attributes}>${svgToString(props.children as ReactNode)}</${type}>`;
}
