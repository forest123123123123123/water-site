import { z } from 'zod';
import { MAX_QTY } from '../limits';

/**
 * Коды ошибок совпадают с ключами переводов checkout.errors.* —
 * так одни и те же правила работают и в форме, и на сервере.
 */
export const customerFields = {
  name: z.string().trim().min(2, 'nameShort').max(60, 'tooLong'),
  /** 9 цифр национального номера, без +998. */
  phone: z.string().regex(/^\d{9}$/, 'phoneInvalid'),
  district: z.string().trim().max(60, 'tooLong'),
  address: z.string().trim().min(5, 'addressShort').max(300, 'tooLong'),
  landmark: z.string().trim().max(200, 'tooLong'),
  comment: z.string().trim().max(1000, 'tooLong'),
};

export const checkoutFormSchema = z.object({
  ...customerFields,
  remember: z.boolean(),
});

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;
export type CustomerData = Omit<CheckoutFormValues, 'remember'>;

/** Тело запроса POST /api/orders. */
export const orderRequestSchema = z.object({
  /** Ключ операции: одинаков у всех попыток отправить один и тот же заказ (см. lib/order/intake.ts). */
  idempotencyKey: z.string().regex(/^[A-Za-z0-9_-]{16,64}$/),
  items: z
    .array(
      z.object({
        id: z.string().min(1).max(64),
        qty: z.number().int().min(1).max(MAX_QTY),
        /** Цена, которую видел покупатель; null — «цена уточняется». */
        price: z.number().int().min(0).nullable(),
      }),
    )
    .min(1)
    .max(50)
    // Иначе лимит количества обходится повтором одной позиции.
    .refine((items) => new Set(items.map((i) => i.id)).size === items.length),
  customer: z.object(customerFields),
  locale: z.enum(['ru', 'uz']),
  /** Поле-ловушка для ботов: у людей всегда пустое. */
  website: z.string().max(0).optional(),
});
