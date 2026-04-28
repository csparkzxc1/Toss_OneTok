import { ModelCandidatesSchema } from '@hanjul-tok/shared';

export interface ParseResult {
  ok: boolean;
  candidates?: [string, string, string];
  error?: string;
}

const JSON_BLOCK_REGEX = /\{[\s\S]*"candidates"[\s\S]*?\]\s*\}/;

export function parseModelOutput(raw: string): ParseResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: 'empty_output' };
  }

  const match = trimmed.match(JSON_BLOCK_REGEX);
  const jsonText = match ? match[0] : trimmed;

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { ok: false, error: 'invalid_json' };
  }

  const result = ModelCandidatesSchema.safeParse(parsed);
  if (!result.success) {
    return { ok: false, error: 'schema_mismatch' };
  }

  const [a, b, c] = result.data.candidates;
  if (!a || !b || !c) {
    return { ok: false, error: 'missing_candidate' };
  }

  return { ok: true, candidates: [a.trim(), b.trim(), c.trim()] };
}
