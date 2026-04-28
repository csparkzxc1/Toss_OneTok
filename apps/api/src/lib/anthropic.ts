// Claude Haiku 4.5로 카테고리별 단어 풀 자동 생성.
// 운영 시: 매일 0시 KST Cron이 호출. 결과는 검증(playable 여부) 후 Supabase에 저장.
import Anthropic from '@anthropic-ai/sdk';
import { isPlayableWord } from '@choseong-run/chosung';
import { buildWordMessages, parseWordsOutput } from '@choseong-run/prompts';
import type { CategoryId, ModelWords } from '@choseong-run/shared';
import { getEnv } from './env.js';

let client: Anthropic | null = null;

function getClient() {
  if (!client) {
    client = new Anthropic({ apiKey: getEnv().ANTHROPIC_API_KEY });
  }
  return client;
}

const MODEL = 'claude-haiku-4-5';

export interface WordGenInput {
  category: CategoryId;
  count: number;
  excludeWords?: readonly string[];
}

export interface WordGenResult {
  words: ModelWords['words'];
  rejected: string[]; // playable 검증에 떨어진 단어
}

async function callOnce(input: WordGenInput): Promise<string> {
  const { system, messages } = buildWordMessages(input);
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 1500,
    temperature: 0.7,
    system,
    messages,
  });
  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('no_text_block');
  }
  return textBlock.text;
}

export async function generateWords(input: WordGenInput): Promise<WordGenResult> {
  let lastError: string | undefined;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const raw = await callOnce(input);
    const parsed = parseWordsOutput(raw);
    if (parsed.ok && parsed.words) {
      const accepted: ModelWords['words'] = [];
      const rejected: string[] = [];
      const seen = new Set<string>();
      for (const w of parsed.words) {
        if (!isPlayableWord(w.word)) {
          rejected.push(w.word);
          continue;
        }
        if (seen.has(w.word)) continue;
        seen.add(w.word);
        accepted.push(w);
      }
      if (accepted.length > 0) {
        return { words: accepted, rejected };
      }
      lastError = 'all_rejected';
    } else {
      lastError = parsed.error;
    }
  }
  throw new Error(`word_gen_failed: ${lastError ?? 'unknown'}`);
}
