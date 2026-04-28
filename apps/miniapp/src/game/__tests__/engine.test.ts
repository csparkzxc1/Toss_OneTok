import { GAME_DURATION_MS } from '@choseong-run/shared';
import { describe, expect, it } from 'vitest';
import { type GameWord, gameReducer, initialState } from '../engine';

const W = (id: string): GameWord => ({ id, chosung: 'ㄱㅊ', hint: '...', length: 2 });

describe('gameReducer', () => {
  it('idle → START → playing', () => {
    const s = gameReducer(initialState(), { type: 'START', words: [W('a'), W('b')], now: 0 });
    expect(s.status).toBe('playing');
    expect(s.words).toHaveLength(2);
    expect(s.remainingMs).toBe(GAME_DURATION_MS);
  });

  it('TICK은 시간을 차감한다', () => {
    let s = gameReducer(initialState(), { type: 'START', words: [W('a')], now: 0 });
    s = gameReducer(s, { type: 'TICK', now: 1000 });
    expect(s.remainingMs).toBe(GAME_DURATION_MS - 1000);
  });

  it('TICK이 0 이하가 되면 finished', () => {
    let s = gameReducer(initialState(), { type: 'START', words: [W('a')], now: 0 });
    s = gameReducer(s, { type: 'TICK', now: GAME_DURATION_MS + 100 });
    expect(s.status).toBe('finished');
    expect(s.remainingMs).toBe(0);
  });

  it('정답 SUBMIT은 콤보 +1, 다음 단어로 이동', () => {
    let s = gameReducer(initialState(), { type: 'START', words: [W('a'), W('b')], now: 0 });
    s = gameReducer(s, { type: 'SUBMIT', input: '김치', correct: true, now: 1000 });
    expect(s.combo).toBe(1);
    expect(s.maxCombo).toBe(1);
    expect(s.currentIndex).toBe(1);
    expect(s.attempts).toHaveLength(1);
    expect(s.flash).toBe('correct');
    expect(s.scoreClient).toBeGreaterThan(0);
  });

  it('오답 SUBMIT은 콤보 리셋 + 1초 페널티', () => {
    let s = gameReducer(initialState(), { type: 'START', words: [W('a'), W('b'), W('c')], now: 0 });
    s = gameReducer(s, { type: 'SUBMIT', input: '김치', correct: true, now: 500 });
    s = gameReducer(s, { type: 'SUBMIT', input: '오답', correct: false, now: 1000 });
    expect(s.combo).toBe(0);
    expect(s.flash).toBe('wrong');
    // 오답 후 시간은 더 빠르게 줄어듦 (페널티 +1초)
    expect(s.remainingMs).toBeLessThan(GAME_DURATION_MS - 1000);
  });

  it('5콤보 시 시간 보너스 + comboBonus flash', () => {
    let s = gameReducer(initialState(), {
      type: 'START',
      words: [W('a'), W('b'), W('c'), W('d'), W('e'), W('f')],
      now: 0,
    });
    for (let i = 0; i < 5; i += 1) {
      s = gameReducer(s, { type: 'SUBMIT', input: '정답', correct: true, now: (i + 1) * 100 });
    }
    expect(s.combo).toBe(5);
    expect(s.flash).toBe('comboBonus');
    // 보너스 5초 추가 → 남은 시간이 원래보다 큼
    expect(s.remainingMs).toBeGreaterThan(GAME_DURATION_MS - 500); // 0.5초만 흘렀고 +5초 보너스
  });

  it('마지막 단어 정답 시 finished 상태로 전환', () => {
    let s = gameReducer(initialState(), { type: 'START', words: [W('a')], now: 0 });
    s = gameReducer(s, { type: 'SUBMIT', input: '정답', correct: true, now: 100 });
    expect(s.status).toBe('finished');
  });

  it('SKIP은 콤보 리셋 + 다음 단어', () => {
    let s = gameReducer(initialState(), { type: 'START', words: [W('a'), W('b')], now: 0 });
    s = gameReducer(s, { type: 'SUBMIT', input: '정답', correct: true, now: 100 });
    s = gameReducer(s, { type: 'SKIP', now: 200 });
    expect(s.combo).toBe(0);
    expect(s.currentIndex).toBe(1);
  });

  it('CLEAR_FLASH 후 flash null', () => {
    let s = gameReducer(initialState(), { type: 'START', words: [W('a'), W('b')], now: 0 });
    s = gameReducer(s, { type: 'SUBMIT', input: '정답', correct: true, now: 100 });
    expect(s.flash).toBe('correct');
    s = gameReducer(s, { type: 'CLEAR_FLASH' });
    expect(s.flash).toBeNull();
  });

  it('idle 상태에서 SUBMIT은 무시', () => {
    const s = gameReducer(initialState(), {
      type: 'SUBMIT',
      input: '아무거나',
      correct: true,
      now: 0,
    });
    expect(s.status).toBe('idle');
    expect(s.attempts).toHaveLength(0);
  });

  it('finished 상태에서 TICK은 무시', () => {
    let s = gameReducer(initialState(), { type: 'START', words: [W('a')], now: 0 });
    s = gameReducer(s, { type: 'SUBMIT', input: '정답', correct: true, now: 100 });
    expect(s.status).toBe('finished');
    const before = s;
    s = gameReducer(s, { type: 'TICK', now: 200 });
    expect(s.remainingMs).toBe(before.remainingMs);
  });
});
