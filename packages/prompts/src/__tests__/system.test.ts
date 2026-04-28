import { describe, expect, it } from 'vitest';
import { WORD_GEN_SYSTEM, buildWordMessages, buildWordUserPrompt } from '../system.js';

describe('buildWordUserPrompt', () => {
  it('카테고리 라벨/설명 포함', () => {
    const result = buildWordUserPrompt({ category: 'food', count: 30 });
    expect(result).toContain('카테고리: 음식');
    expect(result).toContain('만들어야 할 개수: 30');
    expect(result).toContain('JSON');
  });

  it('excludeWords가 있을 때 회피 지시 포함', () => {
    const result = buildWordUserPrompt({
      category: 'animal',
      count: 10,
      excludeWords: ['강아지', '고양이'],
    });
    expect(result).toContain('이미 있으니');
    expect(result).toContain('강아지');
    expect(result).toContain('고양이');
  });

  it('카테고리에 따라 결과가 달라진다', () => {
    const a = buildWordUserPrompt({ category: 'food', count: 10 });
    const b = buildWordUserPrompt({ category: 'movie', count: 10 });
    expect(a).not.toEqual(b);
  });
});

describe('buildWordMessages', () => {
  it('system + user 구조', () => {
    const r = buildWordMessages({ category: 'place', count: 30 });
    expect(r.system).toBe(WORD_GEN_SYSTEM);
    expect(r.messages).toHaveLength(1);
    expect(r.messages[0]?.role).toBe('user');
    expect(r.messages[0]?.content).toContain('장소');
  });
});

describe('WORD_GEN_SYSTEM', () => {
  it('JSON 전용 출력 강제', () => {
    expect(WORD_GEN_SYSTEM).toContain('JSON');
    expect(WORD_GEN_SYSTEM).toContain('words');
    expect(WORD_GEN_SYSTEM).toContain('한국어');
    expect(WORD_GEN_SYSTEM).toContain('2~5자');
  });
});
