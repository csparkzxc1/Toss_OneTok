import { describe, expect, it } from 'vitest';
import { type AuthoritativeWord, computePoints, scoreGame } from '../scoring.js';

const W = (id: string, answer: string, alternates?: string[]): AuthoritativeWord => ({
  id,
  answer,
  alternates,
});

describe('computePoints', () => {
  it('콤보 0, 시간 만땅 → 100점', () => {
    expect(computePoints({ combo: 0, remainingMs: 30_000 })).toBe(100);
  });

  it('콤보 5 → 1.5배', () => {
    expect(computePoints({ combo: 5, remainingMs: 30_000 })).toBe(150);
  });

  it('콤보 10+ 상한 2.0배', () => {
    expect(computePoints({ combo: 10, remainingMs: 30_000 })).toBe(200);
    expect(computePoints({ combo: 50, remainingMs: 30_000 })).toBe(200);
  });

  it('시간 절반 → 시간 0.5배', () => {
    expect(computePoints({ combo: 0, remainingMs: 15_000 })).toBe(50);
  });

  it('시간이 0이어도 최소 0.5배', () => {
    expect(computePoints({ combo: 0, remainingMs: 0 })).toBe(50);
  });
});

describe('scoreGame', () => {
  const words = [
    W('w1', '김치찌개'),
    W('w2', '치킨'),
    W('w3', '떡볶이'),
    W('w4', '짜장면', ['자장면']),
  ];

  it('전부 정답 + 빠르게 풀면 콤보 가산', () => {
    const out = scoreGame(words, [
      { wordId: 'w1', input: '김치찌개', timeMs: 1000 },
      { wordId: 'w2', input: '치킨', timeMs: 1000 },
      { wordId: 'w3', input: '떡볶이', timeMs: 1000 },
      { wordId: 'w4', input: '자장면', timeMs: 1000 },
    ]);
    expect(out.correctCount).toBe(4);
    expect(out.maxCombo).toBe(4);
    expect(out.totalScore).toBeGreaterThan(0);
    expect(out.wordResults).toHaveLength(4);
    expect(out.wordResults[0]?.correct).toBe(true);
  });

  it('오답이면 콤보 리셋 + 1초 페널티', () => {
    const out = scoreGame(words, [
      { wordId: 'w1', input: '김치찌개', timeMs: 500 },
      { wordId: 'w2', input: '치킨', timeMs: 500 },
      { wordId: 'w3', input: '오답', timeMs: 500 }, // ❌
      { wordId: 'w4', input: '짜장면', timeMs: 500 },
    ]);
    expect(out.correctCount).toBe(3);
    expect(out.maxCombo).toBe(2);
    // w4의 콤보는 1로 다시 시작
    expect(out.wordResults[3]?.combo).toBe(1);
  });

  it('누적 시간이 30초를 넘으면 이후 결과는 점수 0', () => {
    const out = scoreGame(words, [
      { wordId: 'w1', input: '김치찌개', timeMs: 20_000 },
      { wordId: 'w2', input: '치킨', timeMs: 11_000 }, // 누적 31000 > 30000
      { wordId: 'w3', input: '떡볶이', timeMs: 1000 }, // 이미 시간 초과
    ]);
    expect(out.correctCount).toBe(1); // 첫 번째만 정답
  });

  it('5콤보 달성 시 시간 보너스 +5초로 추가 정답 가능', () => {
    // 단어 7개 모두 5초씩, 정답 → 5×5 = 25초, 6번째에 보너스 적용
    const longWords = [
      W('a', '가나'),
      W('b', '나다'),
      W('c', '다라'),
      W('d', '라마'),
      W('e', '마바'),
      W('f', '바사'),
      W('g', '사아'),
    ];
    const out = scoreGame(longWords, [
      { wordId: 'a', input: '가나', timeMs: 5000 },
      { wordId: 'b', input: '나다', timeMs: 5000 },
      { wordId: 'c', input: '다라', timeMs: 5000 },
      { wordId: 'd', input: '라마', timeMs: 5000 },
      { wordId: 'e', input: '마바', timeMs: 5000 }, // 5콤보 달성 → 보너스
      { wordId: 'f', input: '바사', timeMs: 5000 }, // 30+5=35초 안
      { wordId: 'g', input: '사아', timeMs: 5000 }, // 35초 안 (정답)
    ]);
    expect(out.correctCount).toBe(7);
  });

  it('알 수 없는 wordId는 무시 (서버가 발급하지 않은 ID)', () => {
    const out = scoreGame(words, [
      { wordId: 'fake', input: '아무거나', timeMs: 1000 },
      { wordId: 'w1', input: '김치찌개', timeMs: 1000 },
    ]);
    expect(out.correctCount).toBe(1);
  });

  it('alternates(동의어)도 정답 처리', () => {
    const out = scoreGame(words, [{ wordId: 'w4', input: '자장면', timeMs: 1000 }]);
    expect(out.correctCount).toBe(1);
  });

  it('음수/이상치 시간은 0으로 클램프', () => {
    const out = scoreGame(words, [{ wordId: 'w1', input: '김치찌개', timeMs: -1000 }]);
    expect(out.correctCount).toBe(1);
  });

  it('빈 배열', () => {
    const out = scoreGame(words, []);
    expect(out.totalScore).toBe(0);
    expect(out.correctCount).toBe(0);
    expect(out.maxCombo).toBe(0);
    expect(out.wordResults).toEqual([]);
  });
});
