/**
 * Анимация «капля летит в корзину»: от кнопки к видимой иконке корзины.
 * Чистый Web Animations API — без зависимостей. Уважает prefers-reduced-motion.
 */
function visibleTarget(): HTMLElement | null {
  const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-cart-target]'));
  const visible = targets.filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight;
  });
  // Нижняя панель на телефоне ближе к пальцу — она в приоритете.
  return visible.sort((a, b) => b.getBoundingClientRect().top - a.getBoundingClientRect().top)[0] ?? null;
}

export function bumpCartTargets() {
  for (const el of document.querySelectorAll<HTMLElement>('[data-cart-target]')) {
    el.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.16)' }, { transform: 'scale(1)' }],
      { duration: 450, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
    );
  }
}

export function flyToCart(from: HTMLElement | null) {
  if (typeof window === 'undefined') return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const target = visibleTarget();
  if (!from || !target || reduce) {
    bumpCartTargets();
    return;
  }

  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const start = { x: a.left + a.width / 2, y: a.top + a.height / 2 };
  const end = { x: b.left + b.width / 2, y: b.top + b.height / 2 };
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lift = Math.min(140, Math.abs(dx) * 0.25 + 60);

  const outer = document.createElement('div');
  const drop = document.createElement('div');
  outer.style.cssText = `position:fixed;left:${start.x - 9}px;top:${start.y - 9}px;z-index:100;pointer-events:none;`;
  drop.style.cssText =
    'width:18px;height:18px;border-radius:50% 50% 50% 50% / 60% 60% 40% 40%;background:radial-gradient(circle at 35% 30%,#d6f1fd,#3fafe5 45%,#0d5e93);box-shadow:0 6px 14px -4px rgba(13,94,147,.6);';
  outer.appendChild(drop);
  document.body.appendChild(outer);

  const duration = 720;
  outer.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${dx}px)` }], {
    duration,
    easing: 'cubic-bezier(0.45, 0, 0.55, 1)',
    fill: 'forwards',
  });
  const flight = drop.animate(
    [
      { transform: 'translateY(0) scale(0.6)', opacity: 0.4, offset: 0 },
      { transform: `translateY(${Math.min(0, dy) - lift}px) scale(1.15)`, opacity: 1, offset: 0.38, easing: 'cubic-bezier(0.3, 0, 0.7, 1)' },
      { transform: `translateY(${dy}px) scale(0.45)`, opacity: 0.85, offset: 1 },
    ],
    { duration, easing: 'cubic-bezier(0.2, 0.6, 0.3, 1)', fill: 'forwards' },
  );
  flight.onfinish = () => {
    outer.remove();
    bumpCartTargets();
  };
}
