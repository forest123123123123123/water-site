/**
 * Ограничение частоты запросов «скользящим окном» в памяти процесса.
 *
 * Защищает от случайного или простого злонамеренного потока запросов с одного адреса,
 * но не от распределённой атаки, и не делится между экземплярами сервера.
 * Для публичного запуска лимит стоит продублировать на уровне хостинга
 * (Vercel Firewall, Cloudflare, nginx limit_req) — см. README.
 */
export function createRateLimiter({ limit, windowMs, maxKeys = 10_000 }: { limit: number; windowMs: number; maxKeys?: number }) {
  const hits = new Map<string, number[]>();

  return {
    /** Засчитывает запрос. ok: false — лимит исчерпан, retryAfter — через сколько секунд можно снова. */
    hit(key: string, now = Date.now()): { ok: true } | { ok: false; retryAfter: number } {
      const recent = (hits.get(key) ?? []).filter((t) => t > now - windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return { ok: false, retryAfter: Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000)) };
      }
      recent.push(now);
      hits.delete(key);
      hits.set(key, recent);
      // Самые давние адреса вытесняются, чтобы память не росла бесконечно.
      while (hits.size > maxKeys) hits.delete(hits.keys().next().value!);
      return { ok: true };
    },
  };
}

/**
 * Адрес клиента из заголовков прокси. Верен, только если сервер стоит за прокси,
 * который сам выставляет эти заголовки (Vercel, nginx с proxy_set_header): иначе
 * клиент может их подделать, а без них все запросы попадают в одну общую группу.
 */
export function clientAddress(request: Request): string {
  const real = request.headers.get('x-real-ip')?.trim();
  if (real) return real;
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || 'unknown';
}
