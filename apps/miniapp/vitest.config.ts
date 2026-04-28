import { defineConfig } from 'vitest/config';

// 미니앱은 RN 컴포넌트가 들어 있어 jest+RN preset이 까다롭다.
// 순수 로직 테스트(엔진, 매처)만 vitest로 검증한다.
// UI는 토스 샌드박스 + 실기기에서 수동 점검.
export default defineConfig({
  test: {
    include: ['src/game/**/__tests__/**/*.test.ts', 'src/lib/**/__tests__/**/*.test.ts'],
    environment: 'node',
  },
  resolve: {
    alias: {
      '@/game/engine': new URL('./src/game/engine.ts', import.meta.url).pathname,
      '@/game/scoring': new URL('./src/game/scoring.ts', import.meta.url).pathname,
      '@/game/matcher': new URL('./src/game/matcher.ts', import.meta.url).pathname,
      '@choseong-run/shared': new URL('../../packages/shared/src/index.ts', import.meta.url)
        .pathname,
      '@choseong-run/chosung': new URL('../../packages/chosung/src/index.ts', import.meta.url)
        .pathname,
      '@choseong-run/words': new URL('../../packages/words/src/index.ts', import.meta.url).pathname,
    },
  },
});
