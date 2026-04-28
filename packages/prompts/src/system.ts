import { SITUATION_LABEL, TONE_LABEL } from '@hanjul-tok/shared';
import type { Situation, Tone } from '@hanjul-tok/shared';

export const SYSTEM_PROMPT = `너는 한국인을 위한 메시지 작성 도우미다.
사용자가 [상황], [톤], [한 줄 컨텍스트]를 주면, 그에 맞는 메시지 후보 3개를 만들어준다.

규칙:
1. 한국어로만 작성한다.
2. 각 후보는 서로 명확히 다른 접근을 취한다 (예: 직접적 / 우회적 / 공감 위주).
3. 각 후보는 200자 이내, 자연스러운 구어체.
4. 이모지는 톤이 'casual', 'warm'일 때만 1~2개까지 사용한다. 다른 톤에서는 사용 금지.
5. 비속어, 차별 표현, 정치/종교 자극 표현 금지.
6. 사용자의 컨텍스트에 명시되지 않은 사실(이름, 시간, 금액 등)은 절대 만들어내지 않는다. 필요하면 [이름], [날짜] 같은 placeholder를 쓴다.
7. 절대 응답 외에 설명, 헤더, 코드 블록, 추가 텍스트를 덧붙이지 않는다.

출력 형식 (이 JSON 외에 아무것도 출력하지 마라):
{"candidates": ["후보1", "후보2", "후보3"]}`;

const TONE_GUIDE: Record<Tone, string> = {
  polite: '존댓말 기본. 상대를 배려하는 정중하고 격식 있는 어조. 서두에 호칭, 말미에 마무리 인사.',
  casual: '반말 또는 친근한 존댓말. 가까운 사이에서 쓸 법한 자연스러운 표현. 이모지 1~2개 허용.',
  witty: '존댓말. 가벼운 농담이나 재치 있는 비유 한 스푼. 단, 상황의 무게를 해치지 말 것.',
  firm: '존댓말. 단호하고 명확하게. 사족 없이 핵심만. 모호한 여지를 남기지 말 것.',
  warm: '존댓말. 따뜻하고 다정한 어조. 상대의 감정에 공감하는 표현 포함. 이모지 1~2개 허용.',
  business: '존댓말. 비즈니스 이메일 톤. 결론 먼저, 근거 다음. 깔끔하고 군더더기 없이.',
  romance: '연인 또는 호감 있는 상대에게. 솔직하고 다정하게, 과하지 않게.',
  dialect: '경상도/전라도 등 사투리 어조 (자연스러운 한국어 사투리). 컨텍스트에 지역 명시 없으면 일반적인 경상도 톤.',
};

const SITUATION_GUIDE: Record<Situation, string> = {
  reject: '거절은 확실하게, 그러나 관계를 해치지 않게. 가능하면 짧은 사유 + 감사/미안함 표현.',
  apology: '책임 회피 금지. 무엇을 잘못했는지 명확히 + 재발 방지 한 줄.',
  request: '상대 입장에서 부담을 줄여라. "혹시 가능하시면" 같은 완충 표현 활용.',
  thanks: '구체적으로 무엇이 고마웠는지 명시. 추상적 감사는 진정성이 떨어진다.',
  congrats: '상대의 성취/기쁨을 가운데에 두고, 본인 이야기는 최소화.',
  condolence: '간결하고 진중하게. 위로의 상투어보다 마음을 담아라. 절대 가벼운 표현 금지.',
  introduce: '한 줄 자기소개 + 인상적인 한 가지 + 짧은 클로징. 길어지지 말 것.',
  reply: '상대의 말에 대한 반응 → 본론 → 마무리. 상대 말을 가볍게 받아주는 한 마디 포함.',
  breakup: '상대를 비난하지 말고 본인의 결정으로 표현. 짧고 분명하게. 여지를 남기지 말 것.',
  reconcile: '잘잘못 따지지 말고 관계 회복에 초점. 먼저 손 내미는 톤.',
  announce: '핵심 정보(누가/언제/어디서/무엇)를 빠뜨리지 말고 명료하게.',
  etc: '컨텍스트를 가장 잘 살리는 자연스러운 메시지.',
};

export interface BuildPromptInput {
  situation: Situation;
  tone: Tone;
  context: string;
}

export function buildUserPrompt(input: BuildPromptInput): string {
  const situationLabel = SITUATION_LABEL[input.situation];
  const toneLabel = TONE_LABEL[input.tone];
  const situationGuide = SITUATION_GUIDE[input.situation];
  const toneGuide = TONE_GUIDE[input.tone];

  return [
    `상황: ${situationLabel}`,
    `상황 가이드: ${situationGuide}`,
    `톤: ${toneLabel}`,
    `톤 가이드: ${toneGuide}`,
    `컨텍스트: ${input.context}`,
    '',
    '위 정보를 바탕으로 후보 3개를 JSON으로만 출력하라.',
  ].join('\n');
}

export function buildMessages(input: BuildPromptInput) {
  return {
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user' as const, content: buildUserPrompt(input) }],
  };
}
