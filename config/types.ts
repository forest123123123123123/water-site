/**
 * Типы для файлов конфигурации. Менять этот файл не нужно: он подсказывает
 * редактору кода, какие поля есть в настройках, и не даёт ошибиться
 * (например, записать цену строкой).
 */

export type Locale = 'ru' | 'uz';

/** Текст на двух языках. Пустой узбекский вариант заменяется русским. */
export type Localized = { ru: string; uz: string };

export type SocialNetwork =
  | 'telegram'
  | 'whatsapp'
  | 'instagram'
  | 'facebook'
  | 'youtube'
  | 'tiktok';

/**
 * Куда уходят заказы:
 *  'api'      — на сервер сайта, а оттуда в Telegram-бота и/или CRM (настройка в .env);
 *  'whatsapp' — покупатель сам отправляет готовый текст заказа в WhatsApp компании;
 *  'telegram' — покупатель сам отправляет готовый текст заказа в Telegram компании.
 */
export type OrderChannel = 'api' | 'whatsapp' | 'telegram';

export type SiteConfig = {
  url: string;
  brand: {
    name: string;
    tagline: Localized;
    logo: string | null;
    logoOnDark: string | null;
    legalName: string;
  };
  contacts: {
    phones: string[];
    email: string;
    address: Localized;
    workingHours: Localized;
    mapEmbedUrl: string;
  };
  social: Record<SocialNetwork, string>;
  otherLinks: { label: Localized; url: string }[];
  orders: {
    channel: OrderChannel;
    operatorLocale: Locale;
  };
};

/** Встроенные иллюстрации тары — используются, пока нет настоящих фотографий. */
export type Illustration = 'jug' | 'canister' | 'cooler';

export type ProductSpec = {
  label: Localized;
  /** null — значение неизвестно, строка не показывается. */
  value: Localized | null;
};

export type Product = {
  id: string;
  slug: string;
  name: Localized;
  volume: number | null;
  price: number | null;
  inStock: boolean;
  visible: boolean;
  image: string | null;
  illustration: Illustration | null;
  tone: string;
  shortDescription: Localized;
  description: Localized;
  note: Localized | null;
  specs: ProductSpec[];
};

export type DeliveryInfoKey =
  | 'time'
  | 'hours'
  | 'cost'
  | 'minOrder'
  | 'payment'
  | 'containers';

export type DeliveryConfig = {
  city: Localized;
  zones: Localized[];
  info: Record<DeliveryInfoKey, Localized | null>;
  extra: { title: Localized; text: Localized }[];
  districts: { id: string; name: Localized }[];
};

export type FaqItem = {
  question: Localized;
  /** null — ответ неизвестен, вопрос не показывается. */
  answer: Localized | null;
};

export type AboutConfig = {
  paragraphs: Localized[];
  facts: { value: string; label: Localized }[];
  photos: { src: string; alt: Localized }[];
};
