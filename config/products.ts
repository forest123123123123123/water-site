import type { Product } from './types';

/**
 * Ассортимент. Каждый объект — отдельный товар со своей страницей /catalog/<slug>.
 * Порядок в списке = порядок на сайте.
 *
 *  price: 18000   — цена в сумах, числом.
 *  price: null    — цена неизвестна: показывается «Цена уточняется», итог заказа не считается.
 *  inStock: false — товар виден, но купить его нельзя.
 *  visible: false — товар полностью скрыт с сайта.
 *  image: '/images/products/water-20l.webp' — фото из public/images/products
 *                   (PNG/WebP на прозрачном или белом фоне, около 1200×1200).
 *  image: null    — показывается встроенная иллюстрация.
 *
 * Чтобы добавить товар, скопируйте блок { … } целиком и поменяйте id, slug,
 * название, объём и тексты. id и slug уникальны: латиница, цифры и дефис.
 */
export const products: Product[] = [
  {
    /** Внутренний ключ товара. Не меняйте после запуска: по нему хранятся корзины покупателей. */
    id: 'water-5l',
    slug: 'water-5l',
    name: { ru: 'Питьевая вода', uz: 'Ichimlik suvi' },
    /** Объём в литрах. Для товаров без объёма (например, помпа или кулер) — null. */
    volume: 5,
    price: null,
    inStock: true,
    visible: true,
    image: null,
    /** Запасная иллюстрация, пока нет фото: 'jug' (бутылка с ручкой), 'canister' (канистра), 'cooler' (бутыль для кулера). */
    illustration: 'jug',
    /** Фирменный оттенок товара — используется в карточке и акцентах. */
    tone: '#5DBCEB',
    shortDescription: {
      ru: 'Компактная тара, которую удобно хранить и переносить.',
      uz: 'Ixcham idish: saqlash va olib yurish qulay.',
    },
    /** Подробное описание. Пустая строка между абзацами = новый абзац. */
    description: {
      ru: 'Питьевая вода в таре объёмом 5 литров. Подойдёт, если воды нужно немного или удобнее носить небольшие бутылки.\n\nЭтот объём можно заказать вместе с 10 и 20 литрами в одном заказе.',
      uz: '5 litrli idishdagi ichimlik suvi. Suv koʻp kerak boʻlmaganda yoki kichik idishlarni koʻtarish qulayroq boʻlganda mos keladi.\n\nBu hajmni 10 va 20 litrlik suv bilan bitta buyurtmada olish mumkin.',
    },
    /** Важное примечание к товару (например, про тару или залог). null — не показывается. */
    note: null,
    /** Характеристики. value: null — строка не показывается. */
    specs: [
      { label: { ru: 'Объём', uz: 'Hajmi' }, value: { ru: '5 литров', uz: '5 litr' } },
      { label: { ru: 'Тара', uz: 'Idish' }, value: null },
      { label: { ru: 'Тип воды', uz: 'Suv turi' }, value: null },
      { label: { ru: 'Минерализация', uz: 'Mineralizatsiya' }, value: null },
      { label: { ru: 'Срок хранения', uz: 'Saqlash muddati' }, value: null },
    ],
  },
  {
    id: 'water-10l',
    slug: 'water-10l',
    name: { ru: 'Питьевая вода', uz: 'Ichimlik suvi' },
    volume: 10,
    price: null,
    inStock: true,
    visible: true,
    image: null,
    illustration: 'canister',
    tone: '#1B8FD2',
    shortDescription: {
      ru: 'Подойдёт, если 5 литров мало, а 20 слишком много.',
      uz: '5 litr kam, 20 litr esa koʻp boʻlganda mos keladi.',
    },
    description: {
      ru: 'Питьевая вода в таре объёмом 10 литров. Это средний вариант между компактной бутылкой и большой бутылью.\n\nЭтот объём можно заказать вместе с 5 и 20 литрами в одном заказе.',
      uz: '10 litrli idishdagi ichimlik suvi. Bu kichik va katta idish oʻrtasidagi oʻrtacha hajm.\n\nBu hajmni 5 va 20 litrlik suv bilan bitta buyurtmada olish mumkin.',
    },
    note: null,
    specs: [
      { label: { ru: 'Объём', uz: 'Hajmi' }, value: { ru: '10 литров', uz: '10 litr' } },
      { label: { ru: 'Тара', uz: 'Idish' }, value: null },
      { label: { ru: 'Тип воды', uz: 'Suv turi' }, value: null },
      { label: { ru: 'Минерализация', uz: 'Mineralizatsiya' }, value: null },
      { label: { ru: 'Срок хранения', uz: 'Saqlash muddati' }, value: null },
    ],
  },
  {
    id: 'water-20l',
    slug: 'water-20l',
    name: { ru: 'Питьевая вода', uz: 'Ichimlik suvi' },
    volume: 20,
    price: null,
    inStock: true,
    visible: true,
    image: null,
    illustration: 'cooler',
    tone: '#0C5A92',
    shortDescription: {
      ru: 'Самый большой объём для тех, кому воды нужно много.',
      uz: 'Eng katta hajm: suv koʻp kerak boʻlganda qulay.',
    },
    description: {
      ru: 'Питьевая вода в бутыли объёмом 20 литров. Это самый большой объём в нашем ассортименте: подходит для семьи, офиса или мероприятия, когда воды нужно много.\n\nЭтот объём можно заказать вместе с 5 и 10 литрами в одном заказе.',
      uz: '20 litrli idishdagi ichimlik suvi. Bu assortimentimizdagi eng katta hajm: suv koʻp kerak boʻladigan oila, ofis yoki tadbir uchun qulay.\n\nBu hajmni 5 va 10 litrlik suv bilan bitta buyurtmada olish mumkin.',
    },
    note: null,
    specs: [
      { label: { ru: 'Объём', uz: 'Hajmi' }, value: { ru: '20 литров', uz: '20 litr' } },
      { label: { ru: 'Тара', uz: 'Idish' }, value: null },
      { label: { ru: 'Тип воды', uz: 'Suv turi' }, value: null },
      { label: { ru: 'Минерализация', uz: 'Mineralizatsiya' }, value: null },
      { label: { ru: 'Срок хранения', uz: 'Saqlash muddati' }, value: null },
    ],
  },
];
