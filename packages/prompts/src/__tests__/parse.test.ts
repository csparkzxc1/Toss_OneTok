import { describe, expect, it } from 'vitest';
import { parseWordsOutput } from '../parse.js';

describe('parseWordsOutput', () => {
  it('순수 JSON 파싱', () => {
    const raw = '{"words":[{"word":"김치","hint":"빨간 발효 음식","difficulty":1}]}';
    const r = parseWordsOutput(raw);
    expect(r.ok).toBe(true);
    expect(r.words).toHaveLength(1);
    expect(r.words?.[0]?.word).toBe('김치');
  });

  it('주변 텍스트가 있어도 JSON만 추출', () => {
    const raw = '여기 결과:\n{"words":[{"word":"치킨","hint":"맥주의 친구","difficulty":1}]}\n끝.';
    const r = parseWordsOutput(raw);
    expect(r.ok).toBe(true);
    expect(r.words?.[0]?.word).toBe('치킨');
  });

  it('빈 입력 거부', () => {
    expect(parseWordsOutput('').ok).toBe(false);
    expect(parseWordsOutput('   ').ok).toBe(false);
  });

  it('잘못된 JSON 거부', () => {
    expect(parseWordsOutput('not json').ok).toBe(false);
  });

  it('스키마 미일치 거부 (난이도 4)', () => {
    const r = parseWordsOutput('{"words":[{"word":"치킨","hint":"맥주","difficulty":4}]}');
    expect(r.ok).toBe(false);
    expect(r.error).toBe('schema_mismatch');
  });

  it('스키마 미일치 거부 (글자수 6)', () => {
    const r = parseWordsOutput(
      '{"words":[{"word":"가나다라마바","hint":"긴 단어","difficulty":1}]}',
    );
    expect(r.ok).toBe(false);
  });
});
