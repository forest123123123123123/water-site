import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const path = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      // Тесты работают с собственным ассортиментом и условиями доставки, а не с настройками сайта.
      { find: /^@config\/products$/, replacement: path('./tests/fixtures/products.ts') },
      { find: /^@config\/delivery$/, replacement: path('./tests/fixtures/delivery.ts') },
      { find: /^@config\//, replacement: path('./config/') },
      { find: /^@\//, replacement: path('./src/') },
      // В тестах серверные модули импортируются напрямую — защита server-only не нужна.
      { find: /^server-only$/, replacement: path('./tests/server-only-stub.ts') },
    ],
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
