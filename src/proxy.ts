import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { getProductBySlug } from './lib/catalog';

const intl = createMiddleware(routing);

const PRODUCT_PATH = /^(?:\/(uz))?\/catalog\/([^/]+)\/?$/;

/**
 * Страница товара рендерится потоком (Suspense), и notFound() внутри неё уже не может
 * сменить HTTP-статус. Неизвестный товар отсекается здесь, чтобы ответ был настоящим 404.
 */
function isDecodable(pathname: string) {
  try {
    decodeURI(pathname);
    return true;
  } catch {
    return false;
  }
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Битая percent-кодировка (например, /%E0%A4%A) иначе роняет маршрутизацию с ошибкой 500.
  if (!isDecodable(pathname)) return new NextResponse(null, { status: 400 });

  const match = pathname.match(PRODUCT_PATH);
  if (match && !getProductBySlug(match[2])) {
    const url = request.nextUrl.clone();
    url.pathname = `/${match[1] ?? routing.defaultLocale}/catalog/${match[2]}/not-found`;
    return NextResponse.rewrite(url);
  }
  return intl(request);
}

export const config = {
  // Все страницы, кроме API, служебных файлов Next.js, картинок превью (opengraph-image)
  // и статических файлов (с точкой в имени).
  matcher: '/((?!api|_next|_vercel|.*opengraph-image|.*\\..*).*)',
};
