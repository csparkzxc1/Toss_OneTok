import { type ModelWords, ModelWordsSchema } from '@choseong-run/shared';

export interface ParseWordsResult {
  ok: boolean;
  words?: ModelWords['words'];
  error?: string;
}

const JSON_BLOCK_REGEX = /\{[\s\S]*"words"[\s\S]*?\]\s*\}/;

export function parseWordsOutput(raw: string): ParseWordsResult {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: 'empty_output' };

  const match = trimmed.match(JSON_BLOCK_REGEX);
  const jsonText = match ? match[0] : trimmed;

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { ok: false, error: 'invalid_json' };
  }

  const result = ModelWordsSchema.safeParse(parsed);
  if (!result.success) {
    return { ok: false, error: 'schema_mismatch' };
  }

  return { ok: true, words: result.data.words };
}
