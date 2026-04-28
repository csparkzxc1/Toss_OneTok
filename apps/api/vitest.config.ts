import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts', 'src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@hanjul-tok/shared': new URL('../../packages/shared/src/index.ts', import.meta.url).pathname,
      '@hanjul-tok/prompts': new URL('../../packages/prompts/src/index.ts', import.meta.url).pathname,
    },
  },
});
