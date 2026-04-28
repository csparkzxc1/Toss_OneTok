import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@hanjul-tok/shared': new URL('../shared/src/index.ts', import.meta.url).pathname,
    },
  },
});
