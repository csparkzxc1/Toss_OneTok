import { isPlayableWord, wordToChosung } from '@choseong-run/chosung';
import { describe, expect, it } from 'vitest';
import { CATEGORIES, SEED, getAllSeedWords } from '../index.js';

describe('seed words', () => {
  it('카테고리 8종 정의', () => {
    expect(CATEGORIES).toHaveLength(8);
    const ids = CATEGORIES.map((c) => c.id).sort();
    expect(ids).toEqual(['animal', 'food', 'idol', 'job', 'movie', 'object', 'place', 'sports']);
  });

  it('모든 시드 단어는 한글 2~5자', () => {
    const offenders: string[] = [];
    for (const { category, word } of getAllSeedWords()) {
      if (!isPlayableWord(word.word)) {
        offenders.push(`[${category}] ${word.word}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('카테고리별 최소 25개 이상', () => {
    for (const section of SEED) {
      expect(section.words.length, `category=${section.category}`).toBeGreaterThanOrEqual(25);
    }
  });

  it('모든 단어에 힌트 존재', () => {
    for (const { word } of getAllSeedWords()) {
      expect(word.hint.length).toBeGreaterThan(0);
    }
  });

  it('힌트에 정답 단어가 그대로 노출되지 않는다', () => {
    const offenders: string[] = [];
    for (const { word } of getAllSeedWords()) {
      if (word.hint.includes(word.word)) {
        offenders.push(word.word);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('초성 변환은 항상 글자수와 같다', () => {
    for (const { word } of getAllSeedWords()) {
      const choseong = wordToChosung(word.word);
      expect([...choseong].length, `word=${word.word}`).toBe([...word.word].length);
    }
  });

  it('카테고리 내 단어 중복 없음', () => {
    for (const section of SEED) {
      const seen = new Set<string>();
      const dups: string[] = [];
      for (const w of section.words) {
        if (seen.has(w.word)) dups.push(w.word);
        seen.add(w.word);
      }
      expect(dups, `category=${section.category}`).toEqual([]);
    }
  });
});
