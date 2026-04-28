import Anthropic from '@anthropic-ai/sdk';
import { buildMessages, parseModelOutput } from '@hanjul-tok/prompts';
import type { Situation, Tone } from '@hanjul-tok/shared';
import { getEnv } from './env.js';

let client: Anthropic | null = null;

function getClient() {
  if (!client) {
    client = new Anthropic({ apiKey: getEnv().ANTHROPIC_API_KEY });
  }
  return client;
}

export interface GenerateInput {
  situation: Situation;
  tone: Tone;
  context: string;
}

export interface GenerateResult {
  candidates: [string, string, string];
}

const MODEL = 'claude-haiku-4-5';

async function callOnce(input: GenerateInput): Promise<string> {
  const { system, messages } = buildMessages(input);
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 600,
    temperature: 0.8,
    system,
    messages,
  });
  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('no_text_block');
  }
  return textBlock.text;
}

export async function generateMessages(input: GenerateInput): Promise<GenerateResult> {
  let lastError: string | undefined;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const raw = await callOnce(input);
    const parsed = parseModelOutput(raw);
    if (parsed.ok && parsed.candidates) {
      return { candidates: parsed.candidates };
    }
    lastError = parsed.error;
  }

  throw new Error(`generation_failed: ${lastError ?? 'unknown'}`);
}
