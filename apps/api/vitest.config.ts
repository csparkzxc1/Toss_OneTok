import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts', 'src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@choseong-run/shared': new URL('../../packages/shared/src/index.ts', import.meta.url)
        .pathname,
      '@choseong-run/prompts': new URL('../../packages/prompts/src/index.ts', import.meta.url)
        .pathname,
      '@choseong-run/chosung': new URL('../../packages/chosung/src/index.ts', import.meta.url)
        .pathname,
      '@choseong-run/words': new URL('../../packages/words/src/index.ts', import.meta.url).pathname,
    },
  },
});
