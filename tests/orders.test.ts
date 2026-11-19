import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { products } from '@config/products';
import { siteConfig } from '@config/site';
import { POST } from '@/app/api/orders/route';
import { hasConfiguredChannel, parseWebhookUrl } from '@/lib/order/channels';
import { retryPendingTargets } from '@/lib/order/intake';
import { checkoutFormSchema, orderRequestSchema } from '@/lib/order/schema';
import { buildOrderSnapshot, formatOrderText } from '@/lib/order/snapshot';
import { submitOrder } from '@/lib/order/submit';
import { clientAddress, createRateLimiter } from '@/lib/rate-limit';

// after() из next/server работает только внутри запроса Next.js — в тестах запоминаем задачи.
const scheduled = vi.hoisted(() => [] as (() => unknown)[]);
vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/server')>()),
  after: (task: () => unknown) => scheduled.push(task),
}));

const customer = {
  name: 'Азиз',
  phone: '901234567',
  district: 'yunusobod',
  address: 'ул. Амира Темура, 1, кв. 5',
  landmark: 'напротив школы',
  comment: 'После 18:00',
};

const lines = [
  { id: 'water-20l', qty: 2 },
  { id: 'water-5l', qty: 3 },
];
const items = lines.map((l) => ({ ...l, price: null }));

const product = (id: string) => products.find((p) => p.id === id)!;

let keySeq = 0;
const newKey = () => `test-key-${Date.now()}-${++keySeq}`;
let ipSeq = 0;

function request(body: unknown, ip = `10.0.0.${++ipSeq}`) {
  return new Request('http://localhost/api/orders', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-real-ip': ip },
    body: JSON.stringify(body),
  });
}

const order = (extra: Record<string, unknown> = {}) => ({ idempotencyKey: newKey(), items, customer, locale: 'ru', ...extra });
const ok = () => new Response('{"ok":true}', { status: 200 });
type FetchMock = MockInstance<typeof fetch>;
const sentTo = (fetchMock: FetchMock) =>
  fetchMock.mock.calls.map(([url, init]) => {
    const href = String(url);
    return href.includes('telegram') ? `telegram:${JSON.parse(String((init as RequestInit).body)).chat_id}` : 'webhook';
  });

describe('валидация формы и запроса', () => {
  it('принимает корректные данные', () => {
    expect(checkoutFormSchema.safeParse({ ...customer, remember: true }).success).toBe(true);
    expect(orderRequestSchema.safeParse(order()).success).toBe(true);
  });

  it('возвращает коды ошибок для переводов', () => {
    const result = checkoutFormSchema.safeParse({ ...customer, name: 'А', phone: '9012', address: '', remember: true });
    expect(result.success).toBe(false);
    const codes = result.error!.issues.map((i) => `${String(i.path[0])}:${i.message}`);
    expect(codes).toEqual(expect.arrayContaining(['name:nameShort', 'phone:phoneInvalid', 'address:addressShort']));
  });

  it('сервер не принимает пустой заказ, нереальные количества и запрос без ключа операции', () => {
    expect(orderRequestSchema.safeParse(order({ items: [] })).success).toBe(false);
    expect(orderRequestSchema.safeParse(order({ items: [{ id: 'water-20l', qty: 1000, price: null }] })).success).toBe(false);
    expect(orderRequestSchema.safeParse(order({ items: [{ id: 'water-20l', qty: 1.5, price: null }] })).success).toBe(false);
    expect(orderRequestSchema.safeParse(order({ idempotencyKey: undefined })).success).toBe(false);
    expect(orderRequestSchema.safeParse(order({ idempotencyKey: 'short' })).success).toBe(false);
  });

  it('повтор одного товара не обходит лимит количества', () => {
    const twice = [
      { id: 'water-20l', qty: 99, price: null },
      { id: 'water-20l', qty: 99, price: null },
    ];
    expect(orderRequestSchema.safeParse(order({ items: twice })).success).toBe(false);
    const built = buildOrderSnapshot({ lines: twice, customer, customerLocale: 'ru', operatorLocale: 'ru' });
    expect(built).toMatchObject({ ok: false, error: 'validation' });
  });
});

describe('состав заказа не меняется молча', () => {
  it('текст заявки содержит состав, объём, контакты и не выдумывает сумму', () => {
    const built = buildOrderSnapshot({ lines, customer, customerLocale: 'uz', operatorLocale: 'ru', id: '261118-TEST' });
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const text = formatOrderText(built.order, 'ru');
    expect(text).toContain('Новый заказ № 261118-TEST');
    expect(text).toContain('Питьевая вода 20 л: 2 шт. (цена не указана)');
    expect(text).toContain('Питьевая вода 5 л: 3 шт.');
    expect(text).toContain('Итого: 5 шт. · 55 л');
    expect(text).toContain('Сумма: не рассчитана, у части товаров нет цены');
    expect(text).toContain('Телефон: +998 90 123-45-67');
    expect(text).toContain('Район: Юнусабадский');
    expect(text).toContain('Язык сайта: узбекский');
    expect(text).not.toContain(String.fromCharCode(0xa0));
  });

  it('неизвестный товар — отказ, а не заказ без этой позиции', () => {
    const built = buildOrderSnapshot({
      lines: [...lines, { id: 'water-99l', qty: 1 }],
      customer,
      customerLocale: 'ru',
      operatorLocale: 'ru',
    });
    expect(built).toEqual({ ok: false, error: 'unavailable', productIds: ['water-99l'] });
  });

  it('скрытый товар и товар не в наличии нельзя заказать', () => {
    expect(buildOrderSnapshot({ lines: [{ id: 'cooler', qty: 1 }], customer, customerLocale: 'ru', operatorLocale: 'ru' })).toEqual({
      ok: false,
      error: 'unavailable',
      productIds: ['cooler'],
    });
    product('water-5l').inStock = false;
    try {
      const built = buildOrderSnapshot({ lines, customer, customerLocale: 'ru', operatorLocale: 'ru' });
      expect(built).toEqual({ ok: false, error: 'unavailable', productIds: ['water-5l'] });
    } finally {
      product('water-5l').inStock = true;
    }
  });

  it('цена изменилась после того, как покупатель её увидел — отказ', () => {
    product('water-20l').price = 25000;
    try {
      const seenOld = buildOrderSnapshot({
        lines: [{ id: 'water-20l', qty: 1, price: 20000 }],
        customer,
        customerLocale: 'ru',
        operatorLocale: 'ru',
      });
      expect(seenOld).toEqual({ ok: false, error: 'changed', productIds: ['water-20l'] });
      const seenCurrent = buildOrderSnapshot({
        lines: [{ id: 'water-20l', qty: 1, price: 25000 }],
        customer,
        customerLocale: 'ru',
        operatorLocale: 'ru',
      });
      expect(seenCurrent.ok).toBe(true);
    } finally {
      product('water-20l').price = null;
    }
  });
});

describe('приём заказов', () => {
  const env = { ...process.env };

  beforeEach(() => {
    siteConfig.orders.channel = 'api';
    siteConfig.social.whatsapp = '';
    siteConfig.social.telegram = '';
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_CHAT_ID;
    delete process.env.ORDER_WEBHOOK_URL;
    delete process.env.ORDER_WEBHOOK_SECRET;
    scheduled.length = 0;
  });

  afterEach(() => {
    siteConfig.orders.channel = 'api';
    process.env = { ...env };
    vi.restoreAllMocks();
  });

  const telegramAndWebhook = () => {
    process.env.TELEGRAM_BOT_TOKEN = '123:abc';
    process.env.TELEGRAM_CHAT_ID = '-1001';
    process.env.ORDER_WEBHOOK_URL = 'https://crm.example/hook';
  };

  it('канал считается настроенным только при заданных переменных окружения', () => {
    expect(hasConfiguredChannel()).toBe(false);
    process.env.TELEGRAM_BOT_TOKEN = '123:abc';
    expect(hasConfiguredChannel()).toBe(false);
    process.env.TELEGRAM_CHAT_ID = '-1001';
    expect(hasConfiguredChannel()).toBe(true);
    delete process.env.TELEGRAM_BOT_TOKEN;
    process.env.ORDER_WEBHOOK_URL = 'https://crm.example/hook';
    expect(hasConfiguredChannel()).toBe(true);
  });

  it('мессенджер без указанного контакта: заказ никуда не уходит', async () => {
    siteConfig.orders.channel = 'whatsapp';
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const outcome = await submitOrder({ lines, customer, locale: 'ru' });
    expect(outcome).toMatchObject({ kind: 'error', code: 'not_configured' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('API не принимает заказы, если выбран способ через мессенджер', async () => {
    siteConfig.orders.channel = 'telegram';
    const res = await POST(request(order()));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ ok: false, error: 'not_configured' });
  });

  it('без настроенных каналов честно сообщает об ошибке', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await POST(request(order()));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ ok: false, error: 'not_configured' });
  });

  it('отправляет заказ в каждый чат Telegram и возвращает номер', async () => {
    process.env.TELEGRAM_BOT_TOKEN = '123:abc';
    process.env.TELEGRAM_CHAT_ID = '-1001, -1002';
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => ok());

    const res = await POST(request(order()));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.orderId).toMatch(/^\d{6}-[A-Z2-9]{6}$/);
    expect(sentTo(fetchMock).sort()).toEqual(['telegram:-1001', 'telegram:-1002']);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('https://api.telegram.org/bot123:abc/sendMessage');
    const body = JSON.parse(String((init as RequestInit).body));
    expect(body.text).toContain(`Новый заказ № ${data.orderId}`);
    expect(body.text).toContain('Питьевая вода 20 л: 2 шт.');
  });

  it('берёт цены из каталога и передаёт CRM ключ операции', async () => {
    product('water-20l').price = 25000;
    process.env.ORDER_WEBHOOK_URL = 'https://crm.example/hook';
    process.env.ORDER_WEBHOOK_SECRET = 's3cret';
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => ok());
    try {
      const body = order({ items: [{ id: 'water-20l', qty: 2, price: 25000 }] });
      const res = await POST(request(body));
      expect(res.status).toBe(200);
      const init = fetchMock.mock.calls[0][1] as RequestInit;
      const headers = init.headers as Record<string, string>;
      expect(headers['idempotency-key']).toBe(body.idempotencyKey);
      expect(headers.authorization).toBe('Bearer s3cret');
      expect(init.redirect).toBe('error');
      const payload = JSON.parse(String(init.body));
      expect(payload).toMatchObject({ event: 'order.created', idempotencyKey: body.idempotencyKey });
      expect(payload.order.total).toBe(50000);
      expect(payload.order.items[0]).toMatchObject({ id: 'water-20l', qty: 2, price: 25000 });
    } finally {
      product('water-20l').price = null;
    }
  });

  it('цена в запросе не совпадает с каталогом — 409, заказ никуда не уходит', async () => {
    process.env.ORDER_WEBHOOK_URL = 'https://crm.example/hook';
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => ok());
    const res = await POST(request(order({ items: [{ id: 'water-20l', qty: 2, price: 1 }] })));
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ ok: false, error: 'changed', productIds: ['water-20l'] });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('неизвестный товар в запросе — 422, а не заказ без него', async () => {
    process.env.ORDER_WEBHOOK_URL = 'https://crm.example/hook';
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => ok());
    const res = await POST(request(order({ items: [...items, { id: 'water-99l', qty: 1, price: null }] })));
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ ok: false, error: 'unavailable', productIds: ['water-99l'] });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('отклоняет неверные данные и ботов', async () => {
    expect((await POST(request(order({ customer: { ...customer, phone: '123' } })))).status).toBe(400);
    expect((await POST(request(order({ website: 'spam' })))).status).toBe(400);
    const notJson = new Request('http://localhost/api/orders', { method: 'POST', headers: { 'x-real-ip': '10.9.9.9' }, body: 'not json' });
    expect((await POST(notJson)).status).toBe(400);
  });

  describe('повторы и сбои', () => {
    it('повтор с тем же ключом не создаёт второй заказ', async () => {
      process.env.ORDER_WEBHOOK_URL = 'https://crm.example/hook';
      const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => ok());
      const body = order();
      const first = await (await POST(request(body))).json();
      const second = await (await POST(request(body))).json();
      expect(first.ok).toBe(true);
      expect(second).toEqual(first);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('параллельные одинаковые запросы доставляются один раз', async () => {
      process.env.ORDER_WEBHOOK_URL = 'https://crm.example/hook';
      let release!: () => void;
      const slow = new Promise<void>((r) => (release = r));
      const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        await slow;
        return ok();
      });
      const body = order();
      const pending = [POST(request(body)), POST(request(body)), POST(request(body))];
      await new Promise((r) => setTimeout(r, 10));
      release();
      const results = await Promise.all(pending.map(async (p) => (await p).json()));
      expect(new Set(results.map((r) => r.orderId)).size).toBe(1);
      expect(results.every((r) => r.ok)).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('тот же ключ с другим содержимым — 409, без отправки', async () => {
      process.env.ORDER_WEBHOOK_URL = 'https://crm.example/hook';
      const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => ok());
      const body = order();
      await POST(request(body));
      const res = await POST(request({ ...body, customer: { ...customer, comment: 'другой заказ' } }));
      expect(res.status).toBe(409);
      expect(await res.json()).toEqual({ ok: false, error: 'conflict' });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('CRM не ответила (таймаут) — ошибка, а повтор доставляет тот же заказ с тем же номером', async () => {
      process.env.ORDER_WEBHOOK_URL = 'https://crm.example/hook';
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const fetchMock = vi
        .spyOn(globalThis, 'fetch')
        .mockRejectedValueOnce(new DOMException('The operation was aborted due to timeout', 'TimeoutError'))
        .mockImplementation(async () => ok());
      const body = order();

      const first = await POST(request(body));
      expect(first.status).toBe(502);
      expect(await first.json()).toEqual({ ok: false, error: 'delivery_failed' });

      const second = await (await POST(request(body))).json();
      expect(second.ok).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      const keys = fetchMock.mock.calls.map(([, init]) => ((init as RequestInit).headers as Record<string, string>)['idempotency-key']);
      expect(keys).toEqual([body.idempotencyKey, body.idempotencyKey]);
      const texts = fetchMock.mock.calls.map(([, init]) => JSON.parse(String((init as RequestInit).body)).order.id);
      expect(texts[0]).toBe(second.orderId);
      expect(texts[1]).toBe(second.orderId);
    });

    it('CRM отвечает ошибкой — ложного успеха нет', async () => {
      process.env.ORDER_WEBHOOK_URL = 'https://crm.example/hook';
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response('fail', { status: 500 }));
      const res = await POST(request(order()));
      expect(res.status).toBe(502);
      expect(await res.json()).toEqual({ ok: false, error: 'delivery_failed' });
    });

    it('частичная доставка: успех для покупателя, недошедшим адресатам заявка досылается без повтора остальным', async () => {
      telegramAndWebhook();
      vi.spyOn(console, 'error').mockImplementation(() => {});
      let crmUp = false;
      const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) =>
        String(url).includes('crm') && !crmUp ? new Response('down', { status: 503 }) : ok(),
      );
      const body = order();

      const res = await POST(request(body));
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(sentTo(fetchMock).sort()).toEqual(['telegram:-1001', 'webhook']);
      expect(scheduled).toHaveLength(1); // фоновый повтор для webhook

      crmUp = true;
      fetchMock.mockClear();
      await retryPendingTargets(body.idempotencyKey, [0]);
      expect(sentTo(fetchMock)).toEqual(['webhook']);
      expect(JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body)).order.id).toBe(data.orderId);

      // Повтор от покупателя после этого никому ничего не шлёт.
      fetchMock.mockClear();
      expect(await (await POST(request(body))).json()).toEqual(data);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('повтор от покупателя досылает заявку только тем, кто её не получил', async () => {
      telegramAndWebhook();
      vi.spyOn(console, 'error').mockImplementation(() => {});
      let crmUp = false;
      const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) =>
        String(url).includes('crm') && !crmUp ? new Response('down', { status: 503 }) : ok(),
      );
      const body = order();
      await POST(request(body));
      crmUp = true;
      fetchMock.mockClear();
      await POST(request(body));
      expect(sentTo(fetchMock)).toEqual(['webhook']);
    });
  });

  describe('браузер: ключ операции', () => {
    const keyOf = (fetchMock: FetchMock, call: number) =>
      JSON.parse(String((fetchMock.mock.calls[call][1] as RequestInit).body)).idempotencyKey;

    it('повтор после сетевой ошибки отправляет тот же ключ; после успеха ключ новый', async () => {
      const fetchMock = vi
        .spyOn(globalThis, 'fetch')
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce(Response.json({ ok: true, orderId: '261118-AAAAAA' }))
        .mockResolvedValueOnce(Response.json({ ok: true, orderId: '261118-BBBBBB' }));

      expect(await submitOrder({ lines, customer, locale: 'ru' })).toMatchObject({ kind: 'error', code: 'network' });
      expect(await submitOrder({ lines, customer, locale: 'ru' })).toEqual({ kind: 'sent', orderId: '261118-AAAAAA' });
      await submitOrder({ lines, customer, locale: 'ru' });

      expect(keyOf(fetchMock, 0)).toBe(keyOf(fetchMock, 1));
      expect(keyOf(fetchMock, 2)).not.toBe(keyOf(fetchMock, 1));
    });

    it('изменённый заказ получает новый ключ', async () => {
      const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        throw new TypeError('Failed to fetch');
      });
      await submitOrder({ lines, customer, locale: 'ru' });
      await submitOrder({ lines: [{ id: 'water-20l', qty: 1 }], customer, locale: 'ru' });
      expect(keyOf(fetchMock, 0)).not.toBe(keyOf(fetchMock, 1));
    });

    it('передаёт цену, которую видит покупатель, и ограничивает ожидание ответа', async () => {
      const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ ok: true, orderId: 'X' }));
      await submitOrder({ lines, customer, locale: 'ru' });
      const init = fetchMock.mock.calls[0][1] as RequestInit;
      expect(JSON.parse(String(init.body)).items).toEqual(items);
      expect(init.signal).toBeInstanceOf(AbortSignal);
    });

    it('ответ сервера переводится в понятную ошибку', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ ok: false, error: 'changed' }, { status: 409 }));
      expect(await submitOrder({ lines, customer, locale: 'ru' })).toMatchObject({ kind: 'error', code: 'changed' });
    });
  });

  it('в режиме WhatsApp заказ уходит готовым сообщением', async () => {
    siteConfig.orders.channel = 'whatsapp';
    siteConfig.social.whatsapp = '+998 90 000 00 00';
    const outcome = await submitOrder({ lines, customer, locale: 'ru' });
    expect(outcome.kind).toBe('messenger');
    if (outcome.kind === 'messenger') {
      expect(outcome.href.startsWith('https://wa.me/998900000000?text=')).toBe(true);
      expect(decodeURIComponent(outcome.href.split('text=')[1])).toContain('Новый заказ с сайта');
    }
  });
});

describe('защита публичного API', () => {
  const env = { ...process.env };

  beforeEach(() => {
    siteConfig.orders.channel = 'api';
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_CHAT_ID;
    delete process.env.ORDER_WEBHOOK_SECRET;
    process.env.ORDER_WEBHOOK_URL = 'https://crm.example/hook';
  });

  afterEach(() => {
    process.env = { ...env };
    vi.restoreAllMocks();
  });

  it('ограничивает число запросов с одного адреса до обработки и отправки', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => ok());
    const ip = '203.0.113.7';
    for (let i = 0; i < 10; i++) expect((await POST(request(order(), ip))).status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(10);

    const limited = await POST(request(order(), ip));
    expect(limited.status).toBe(429);
    expect(Number(limited.headers.get('retry-after'))).toBeGreaterThan(0);
    expect(await limited.json()).toEqual({ ok: false, error: 'rate_limited' });
    // Даже мусорное тело не разбирается, и во внешние сервисы ничего не уходит.
    const garbage = new Request('http://localhost/api/orders', { method: 'POST', headers: { 'x-real-ip': ip }, body: 'x' });
    expect((await POST(garbage)).status).toBe(429);
    expect(fetchMock).toHaveBeenCalledTimes(10);

    // Другой адрес не затронут.
    expect((await POST(request(order(), '203.0.113.8'))).status).toBe(200);
  });

  it('скользящее окно освобождается со временем', () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000 });
    expect(limiter.hit('a', 0).ok).toBe(true);
    expect(limiter.hit('a', 100).ok).toBe(true);
    expect(limiter.hit('a', 200)).toEqual({ ok: false, retryAfter: 1 });
    expect(limiter.hit('a', 1001).ok).toBe(true);
  });

  it('слишком большое тело запроса отклоняется без разбора', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    const big = order({ customer: { ...customer, comment: 'x'.repeat(20_000) } });
    const res = await POST(request(big));
    expect(res.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('адрес клиента берётся из заголовков прокси', () => {
    const req = (headers: Record<string, string>) => new Request('http://localhost/', { headers });
    expect(clientAddress(req({ 'x-real-ip': '1.1.1.1', 'x-forwarded-for': '2.2.2.2' }))).toBe('1.1.1.1');
    expect(clientAddress(req({ 'x-forwarded-for': '2.2.2.2, 10.0.0.1' }))).toBe('2.2.2.2');
    expect(clientAddress(req({}))).toBe('unknown');
  });

  it('webhook принимается только по https (http — лишь localhost) и без логина в адресе', () => {
    expect(parseWebhookUrl('https://crm.example/hook')).toHaveProperty('url');
    expect(parseWebhookUrl('http://localhost:4500/orders')).toHaveProperty('url');
    expect(parseWebhookUrl('http://127.0.0.1/orders')).toHaveProperty('url');
    expect(parseWebhookUrl('http://crm.example/hook')).toHaveProperty('error');
    expect(parseWebhookUrl('ftp://crm.example/hook')).toHaveProperty('error');
    expect(parseWebhookUrl('https://user:pass@crm.example/hook')).toHaveProperty('error');
    expect(parseWebhookUrl('crm.example/hook')).toHaveProperty('error');
  });

  it('небезопасный адрес CRM отключает webhook, а не отправляет данные открытым текстом', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    process.env.ORDER_WEBHOOK_URL = 'http://crm.example/hook';
    process.env.ORDER_WEBHOOK_SECRET = 's3cret';
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    expect(hasConfiguredChannel()).toBe(false);
    expect((await POST(request(order()))).status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(errors.mock.calls.flat().join(' ')).toContain('https');
  });
});
