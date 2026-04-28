import { describe, expect, it } from 'vitest';
import { quickValidate } from '../matcher';

describe('quickValidate', () => {
  it('빈 입력 거부', () => {
    expect(quickValidate('', 4).ok).toBe(false);
    expect(quickValidate('   ', 4).ok).toBe(false);
  });

  it('한글 음절만 + 길이 일치', () => {
    expect(quickValidate('김치찌개', 4).ok).toBe(true);
    expect(quickValidate(' 김치찌개 ', 4).ok).toBe(true);
  });

  it('영문만 입력 시 non_korean', () => {
    expect(quickValidate('abcd', 4).reason).toBe('non_korean');
  });

  it('한글 글자 수 불일치', () => {
    const r = quickValidate('김치', 4);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('length_mismatch');
  });
});
