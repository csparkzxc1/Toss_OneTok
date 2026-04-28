import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/__tests__/**/*.test.ts'],
    environment: 'node',
  },
  resolve: {
    alias: {
      '@choseong-run/chosung': new URL('../chosung/src/index.ts', import.meta.url).pathname,
    },
  },
});
