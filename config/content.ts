import type { AboutConfig, FaqItem } from './types';

/**
 * Страница «О компании». Пока абзацы не заполнены, страница не публикуется
 * и не показывается в меню.
 */
export const aboutConfig: AboutConfig = {
  /**
   * Абзацы текста о компании, например:
   * { ru: 'Мы доставляем воду с 2015 года…', uz: '2015-yildan beri suv yetkazib beramiz…' },
   */
  paragraphs: [],
  /**
   * Цифры и факты — показываются крупно, например:
   * { value: '2015', label: { ru: 'год основания', uz: 'tashkil etilgan yil' } },
   */
  facts: [],
  /** Фотографии (файлы в public/images/about): { src: '/images/about/team.jpg', alt: { ru: 'Наша команда', uz: 'Jamoamiz' } } */
  photos: [],
};

/**
 * Частые вопросы (страница «Доставка и оплата»).
 * Вопросы с answer: null ждут ответа от компании и не показываются, пока его нет.
 */
export const faqConfig: FaqItem[] = [
  {
    question: {
      ru: 'Можно ли совмещать разные объёмы?',
      uz: 'Turli hajmlarni birga olsa boʻladimi?',
    },
    answer: {
      ru: 'Да. Добавьте в корзину любые товары в нужном количестве, например две бутыли по 20 литров и три бутылки по 5 литров.',
      uz: 'Ha. Savatga istalgan mahsulotlarni kerakli miqdorda qoʻshing, masalan, ikkita 20 litrlik va uchta 5 litrlik idish.',
    },
  },
  {
    question: { ru: 'Куда вы доставляете воду?', uz: 'Suvni qayerga yetkazib berasiz?' },
    answer: {
      ru: 'Мы доставляем питьевую воду по Ташкенту. Подробности смотрите в разделе «Условия доставки» выше на этой странице.',
      uz: 'Ichimlik suvini Toshkent boʻylab yetkazib beramiz. Batafsil maʼlumot shu sahifadagi «Yetkazib berish shartlari» boʻlimida.',
    },
  },
  {
    question: { ru: 'Сохранится ли моя корзина?', uz: 'Savatim saqlanib qoladimi?' },
    answer: {
      ru: 'Да. Корзина хранится в вашем браузере: можно закрыть сайт и вернуться к ней позже.',
      uz: 'Ha. Savat brauzeringizda saqlanadi: saytni yopib, unga keyinroq qaytishingiz mumkin.',
    },
  },
  {
    question: { ru: 'Как оплатить заказ?', uz: 'Buyurtma uchun qanday toʻlash mumkin?' },
    answer: null,
  },
  {
    question: {
      ru: 'Нужно ли возвращать пустую бутыль?',
      uz: 'Boʻsh idishni qaytarish kerakmi?',
    },
    answer: null,
  },
  {
    question: { ru: 'Сколько ждать доставку?', uz: 'Yetkazib berishni qancha kutish kerak?' },
    answer: null,
  },
];
