import { describe, expect, it } from 'vitest';
import {
  CHOSEONG_LIST,
  isPlayableWord,
  matchesAnswer,
  normalizeAnswer,
  toChosung,
  wordToChosung,
} from '../chosung.js';

describe('toChosung', () => {
  it('일반 음절 → 초성', () => {
    expect(toChosung('김')).toBe('ㄱ');
    expect(toChosung('치')).toBe('ㅊ');
    expect(toChosung('찌')).toBe('ㅉ');
    expect(toChosung('개')).toBe('ㄱ');
    expect(toChosung('가')).toBe('ㄱ');
    expect(toChosung('힣')).toBe('ㅎ');
  });

  it('쌍자음 초성 (ㄲ ㄸ ㅃ ㅆ ㅉ)', () => {
    expect(toChosung('까')).toBe('ㄲ');
    expect(toChosung('따')).toBe('ㄸ');
    expect(toChosung('빠')).toBe('ㅃ');
    expect(toChosung('싸')).toBe('ㅆ');
    expect(toChosung('짜')).toBe('ㅉ');
  });

  it('호환 자모 초성은 그대로', () => {
    expect(toChosung('ㄱ')).toBe('ㄱ');
    expect(toChosung('ㅎ')).toBe('ㅎ');
    expect(toChosung('ㄲ')).toBe('ㄲ');
  });

  it('한글 자모(U+1100~) 첫소리도 호환 자모로 변환', () => {
    expect(toChosung('ᄀ')).toBe('ㄱ');
    expect(toChosung('ᄒ')).toBe('ㅎ');
  });

  it('비한글은 빈 문자열', () => {
    expect(toChosung('a')).toBe('');
    expect(toChosung('1')).toBe('');
    expect(toChosung(' ')).toBe('');
    expect(toChosung('!')).toBe('');
    expect(toChosung('')).toBe('');
  });
});

describe('wordToChosung', () => {
  it('"김치찌개" → "ㄱㅊㅉㄱ"', () => {
    expect(wordToChosung('김치찌개')).toBe('ㄱㅊㅉㄱ');
  });

  it('"치킨" → "ㅊㅋ"', () => {
    expect(wordToChosung('치킨')).toBe('ㅊㅋ');
  });

  it('"떡볶이" → "ㄸㅂㅇ"', () => {
    expect(wordToChosung('떡볶이')).toBe('ㄸㅂㅇ');
  });

  it('NFD 분해 입력도 동일 결과', () => {
    const nfc = '김치찌개'.normalize('NFC');
    const nfd = '김치찌개'.normalize('NFD');
    expect(wordToChosung(nfc)).toBe(wordToChosung(nfd));
  });

  it('공백·특수문자는 무시', () => {
    expect(wordToChosung('김치 찌개')).toBe('ㄱㅊㅉㄱ');
    expect(wordToChosung('김!치?찌개')).toBe('ㄱㅊㅉㄱ');
  });

  it('영문 섞임은 영문만 무시', () => {
    expect(wordToChosung('K-pop')).toBe('');
    expect(wordToChosung('치킨버거 BBQ')).toBe('ㅊㅋㅂㄱ');
  });

  it('빈 문자열', () => {
    expect(wordToChosung('')).toBe('');
  });
});

describe('normalizeAnswer', () => {
  it('공백 제거 + NFC', () => {
    expect(normalizeAnswer('김치 찌개')).toBe('김치찌개');
    expect(normalizeAnswer(' 김치찌개 ')).toBe('김치찌개');
    expect(normalizeAnswer('김치\t찌개\n')).toBe('김치찌개');
  });

  it('구두점 제거', () => {
    expect(normalizeAnswer('짜장면!')).toBe('짜장면');
    expect(normalizeAnswer('K-pop')).toBe('kpop');
    expect(normalizeAnswer('1+1')).toBe('11');
  });

  it('NFC vs NFD 동등', () => {
    expect(normalizeAnswer('김치찌개'.normalize('NFD'))).toBe('김치찌개');
  });

  it('대문자 → 소문자', () => {
    expect(normalizeAnswer('NETFLIX')).toBe('netflix');
  });

  it('빈 입력', () => {
    expect(normalizeAnswer('')).toBe('');
    expect(normalizeAnswer('   ')).toBe('');
  });
});

describe('matchesAnswer', () => {
  it('정답 일치', () => {
    expect(matchesAnswer('김치찌개', '김치찌개')).toBe(true);
    expect(matchesAnswer('김치 찌개', '김치찌개')).toBe(true);
    expect(matchesAnswer(' 김치찌개 ', '김치찌개')).toBe(true);
  });

  it('정답 불일치', () => {
    expect(matchesAnswer('김밥', '김치찌개')).toBe(false);
    expect(matchesAnswer('', '김치찌개')).toBe(false);
  });

  it('동의어(alternates) 허용', () => {
    expect(matchesAnswer('짜파게티', '짜장면', ['짜파게티', '자장면'])).toBe(true);
    expect(matchesAnswer('자장면', '짜장면', ['짜파게티', '자장면'])).toBe(true);
    expect(matchesAnswer('짬뽕', '짜장면', ['짜파게티', '자장면'])).toBe(false);
  });

  it('NFD 입력도 매칭', () => {
    expect(matchesAnswer('김치찌개'.normalize('NFD'), '김치찌개')).toBe(true);
  });

  it('대소문자 무시', () => {
    expect(matchesAnswer('netflix', 'NETFLIX')).toBe(true);
  });

  it('빈 문자열은 항상 false', () => {
    expect(matchesAnswer('', '')).toBe(false);
    expect(matchesAnswer('   ', '김치찌개')).toBe(false);
  });
});

describe('isPlayableWord', () => {
  it('한글 2~5자만 허용', () => {
    expect(isPlayableWord('김치')).toBe(true);
    expect(isPlayableWord('김치찌개')).toBe(true);
    expect(isPlayableWord('서울')).toBe(true);
    expect(isPlayableWord('대한민국')).toBe(true);
    expect(isPlayableWord('호랑이')).toBe(true);
    expect(isPlayableWord('가나다라마')).toBe(true);
  });

  it('1자/6자 이상은 거부', () => {
    expect(isPlayableWord('김')).toBe(false);
    expect(isPlayableWord('가나다라마바')).toBe(false);
  });

  it('영문/숫자/특수문자/공백 포함은 거부', () => {
    expect(isPlayableWord('K-pop')).toBe(false);
    expect(isPlayableWord('김치 찌개')).toBe(false);
    expect(isPlayableWord('1번')).toBe(false);
    expect(isPlayableWord('치킨!')).toBe(false);
  });

  it('빈 문자열은 거부', () => {
    expect(isPlayableWord('')).toBe(false);
  });
});

describe('CHOSEONG_LIST', () => {
  it('19개 정확히', () => {
    expect(CHOSEONG_LIST).toHaveLength(19);
    expect(CHOSEONG_LIST[0]).toBe('ㄱ');
    expect(CHOSEONG_LIST[18]).toBe('ㅎ');
  });
});
