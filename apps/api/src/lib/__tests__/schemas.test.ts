import { describe, expect, it } from 'vitest';
import { GenerateRequestSchema } from '@hanjul-tok/shared';

describe('GenerateRequestSchema', () => {
  it('accepts valid input', () => {
    const r = GenerateRequestSchema.safeParse({
      situation: 'reject',
      tone: 'polite',
      context: '결혼식 못 감',
      deviceId: 'abc',
      userId: null,
    });
    expect(r.success).toBe(true);
  });

  it('rejects unknown situation', () => {
    const r = GenerateRequestSchema.safeParse({
      situation: 'unknown',
      tone: 'polite',
      context: 'x',
      deviceId: 'abc',
      userId: null,
    });
    expect(r.success).toBe(false);
  });

  it('rejects empty context', () => {
    const r = GenerateRequestSchema.safeParse({
      situation: 'thanks',
      tone: 'warm',
      context: '',
      deviceId: 'abc',
      userId: null,
    });
    expect(r.success).toBe(false);
  });

  it('rejects context over 300 chars', () => {
    const r = GenerateRequestSchema.safeParse({
      situation: 'thanks',
      tone: 'warm',
      context: 'a'.repeat(301),
      deviceId: 'abc',
      userId: null,
    });
    expect(r.success).toBe(false);
  });
});
