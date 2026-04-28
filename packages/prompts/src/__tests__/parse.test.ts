import { describe, expect, it } from 'vitest';
import { parseModelOutput } from '../parse.js';

describe('parseModelOutput', () => {
  it('parses valid pure JSON', () => {
    const raw = '{"candidates": ["메시지1", "메시지2", "메시지3"]}';
    const r = parseModelOutput(raw);
    expect(r.ok).toBe(true);
    expect(r.candidates).toEqual(['메시지1', '메시지2', '메시지3']);
  });

  it('extracts JSON from text with leading/trailing noise', () => {
    const raw = '여기 결과입니다:\n{"candidates": ["a", "b", "c"]}\n끝.';
    const r = parseModelOutput(raw);
    expect(r.ok).toBe(true);
    expect(r.candidates).toEqual(['a', 'b', 'c']);
  });

  it('rejects when fewer than 3 candidates', () => {
    const r = parseModelOutput('{"candidates": ["a", "b"]}');
    expect(r.ok).toBe(false);
    expect(r.error).toBe('schema_mismatch');
  });

  it('rejects malformed JSON', () => {
    const r = parseModelOutput('not json');
    expect(r.ok).toBe(false);
  });

  it('rejects empty', () => {
    expect(parseModelOutput('').ok).toBe(false);
    expect(parseModelOutput('   ').ok).toBe(false);
  });

  it('trims whitespace inside candidates', () => {
    const r = parseModelOutput('{"candidates":["  hi  ","there","ok"]}');
    expect(r.candidates?.[0]).toBe('hi');
  });
});
