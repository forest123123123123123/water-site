import { afterEach, describe, expect, it, vi } from 'vitest';

const env = { ...process.env };

async function robotsWith(url: string) {
  vi.resetModules();
  process.env.NEXT_PUBLIC_SITE_URL = url;
  return (await import('@/app/robots')).default();
}

afterEach(() => {
  process.env = { ...env };
});

describe('robots.txt', () => {
  it('без публичного адреса сайт закрыт целиком', async () => {
    expect(await robotsWith('')).toEqual({ rules: { userAgent: '*', disallow: '/' } });
  });

  it('с адресом закрыт только API: корзине и оформлению нужен видимый поисковику noindex', async () => {
    const robots = await robotsWith('https://example.uz/');
    expect(robots.rules).toEqual({ userAgent: '*', allow: '/', disallow: ['/api/'] });
    expect(robots.sitemap).toBe('https://example.uz/sitemap.xml');
    expect(robots).not.toHaveProperty('host');
  });
});
