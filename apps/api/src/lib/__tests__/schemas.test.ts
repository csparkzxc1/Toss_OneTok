import {
  CategoryIdSchema,
  GameStartRequestSchema,
  GameSubmitRequestSchema,
} from '@choseong-run/shared';
import { describe, expect, it } from 'vitest';

describe('GameStartRequestSchema', () => {
  it('정상 입력', () => {
    const r = GameStartRequestSchema.safeParse({
      deviceId: 'abc',
      userId: null,
      mode: 'normal',
      category: 'food',
    });
    expect(r.success).toBe(true);
  });

  it('daily 모드는 카테고리 생략 허용', () => {
    const r = GameStartRequestSchema.safeParse({
      deviceId: 'abc',
      userId: null,
      mode: 'daily',
    });
    expect(r.success).toBe(true);
  });

  it('알 수 없는 모드 거부', () => {
    const r = GameStartRequestSchema.safeParse({
      deviceId: 'abc',
      userId: null,
      mode: 'unknown',
    });
    expect(r.success).toBe(false);
  });

  it('알 수 없는 카테고리 거부', () => {
    const r = GameStartRequestSchema.safeParse({
      deviceId: 'abc',
      userId: null,
      mode: 'normal',
      category: 'fake',
    });
    expect(r.success).toBe(false);
  });
});

describe('GameSubmitRequestSchema', () => {
  it('정상 결과 배열', () => {
    const r = GameSubmitRequestSchema.safeParse({
      sessionId: 's_abc',
      deviceId: 'd1',
      userId: null,
      results: [{ wordId: 'w1', input: '김치', timeMs: 1500 }],
    });
    expect(r.success).toBe(true);
  });

  it('30개 초과 거부', () => {
    const results = Array.from({ length: 31 }, (_, i) => ({
      wordId: `w${i}`,
      input: '치킨',
      timeMs: 100,
    }));
    const r = GameSubmitRequestSchema.safeParse({
      sessionId: 's_abc',
      deviceId: 'd1',
      userId: null,
      results,
    });
    expect(r.success).toBe(false);
  });

  it('음수 timeMs 거부', () => {
    const r = GameSubmitRequestSchema.safeParse({
      sessionId: 's_abc',
      deviceId: 'd1',
      userId: null,
      results: [{ wordId: 'w1', input: '김치', timeMs: -5 }],
    });
    expect(r.success).toBe(false);
  });
});

describe('CategoryIdSchema', () => {
  it('8개 카테고리 모두 허용', () => {
    for (const c of ['food', 'animal', 'place', 'object', 'movie', 'idol', 'sports', 'job']) {
      expect(CategoryIdSchema.safeParse(c).success).toBe(true);
    }
  });
});
