import type { DeliveryConfig } from './types';

/**
 * Условия доставки и оплаты для страницы «Доставка и оплата».
 * null — пункт неизвестен и не показывается.
 *
 * Пример заполнения:
 *   time: { ru: 'В течение 2 часов после подтверждения', uz: 'Tasdiqlangandan keyin 2 soat ichida' },
 */
export const deliveryConfig: DeliveryConfig = {
  city: { ru: 'Ташкент', uz: 'Toshkent' },

  /**
   * Районы или зоны, куда доставляете, — если доставка идёт не по всему городу.
   * Пустой список — блок не показывается.
   * Пример: [{ ru: 'Юнусабадский район', uz: 'Yunusobod tumani' }]
   */
  zones: [],

  info: {
    /** Сроки доставки. */
    time: null,
    /** В какие дни и часы доставляете. */
    hours: null,
    /** Стоимость доставки (например, «Бесплатно от 2 бутылей»). */
    cost: null,
    /** Минимальный заказ. */
    minOrder: null,
    /** Способы оплаты (наличные, карта, Payme, Click…). */
    payment: null,
    /** Условия по таре: залог, обмен пустых бутылей и т. п. */
    containers: null,
  },

  /** Дополнительные пункты в свободной форме: [{ title: {…}, text: {…} }] */
  extra: [],

  /**
   * Районы для выбора в форме заказа. Это административные районы Ташкента;
   * если вы доставляете не везде, оставьте только нужные.
   * Пустой список — поле «Район» в форме не показывается.
   */
  districts: [
    { id: 'bektemir', name: { ru: 'Бектемирский', uz: 'Bektemir' } },
    { id: 'chilonzor', name: { ru: 'Чиланзарский', uz: 'Chilonzor' } },
    { id: 'mirobod', name: { ru: 'Мирабадский', uz: 'Mirobod' } },
    { id: 'mirzo-ulugbek', name: { ru: 'Мирзо-Улугбекский', uz: 'Mirzo Ulugʻbek' } },
    { id: 'olmazor', name: { ru: 'Алмазарский', uz: 'Olmazor' } },
    { id: 'sergeli', name: { ru: 'Сергелийский', uz: 'Sergeli' } },
    { id: 'shayxontohur', name: { ru: 'Шайхантахурский', uz: 'Shayxontohur' } },
    { id: 'uchtepa', name: { ru: 'Учтепинский', uz: 'Uchtepa' } },
    { id: 'yakkasaroy', name: { ru: 'Яккасарайский', uz: 'Yakkasaroy' } },
    { id: 'yangihayot', name: { ru: 'Янгихаётский', uz: 'Yangihayot' } },
    { id: 'yashnobod', name: { ru: 'Яшнабадский', uz: 'Yashnobod' } },
    { id: 'yunusobod', name: { ru: 'Юнусабадский', uz: 'Yunusobod' } },
  ],
};
