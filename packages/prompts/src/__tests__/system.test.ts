import { describe, expect, it } from 'vitest';
import { SYSTEM_PROMPT, buildMessages, buildUserPrompt } from '../system.js';

describe('buildUserPrompt', () => {
  it('embeds situation, tone, and context labels', () => {
    const result = buildUserPrompt({
      situation: 'reject',
      tone: 'polite',
      context: '친한 선배 결혼식인데 일정 안돼서 못 감',
    });
    expect(result).toContain('상황: 거절');
    expect(result).toContain('톤: 정중');
    expect(result).toContain('친한 선배 결혼식');
    expect(result).toContain('JSON');
  });

  it('builds different prompts for different situation x tone combinations', () => {
    const a = buildUserPrompt({ situation: 'apology', tone: 'firm', context: '회의 늦었음' });
    const b = buildUserPrompt({ situation: 'thanks', tone: 'warm', context: '도와주셨음' });
    expect(a).not.toEqual(b);
  });
});

describe('buildMessages', () => {
  it('returns system + user message structure', () => {
    const result = buildMessages({
      situation: 'congrats',
      tone: 'casual',
      context: '친구 합격',
    });
    expect(result.system).toBe(SYSTEM_PROMPT);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].role).toBe('user');
    expect(result.messages[0].content).toContain('합격');
  });
});

describe('SYSTEM_PROMPT', () => {
  it('mandates JSON-only output', () => {
    expect(SYSTEM_PROMPT).toContain('JSON');
    expect(SYSTEM_PROMPT).toContain('candidates');
    expect(SYSTEM_PROMPT).toContain('한국어');
  });
});
