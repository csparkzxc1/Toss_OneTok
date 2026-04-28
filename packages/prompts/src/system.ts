import type { CategoryId } from '@choseong-run/shared';

const CATEGORY_BRIEF: Record<CategoryId, { label: string; brief: string }> = {
  food: {
    label: '음식',
    brief: '한국인이 일상적으로 먹는 음식, 분식, 한식, 중식, 일식, 양식, 간식, 디저트.',
  },
  animal: {
    label: '동물',
    brief: '포유류, 조류, 어류, 곤충 포함. 일반인이 명확히 아는 종.',
  },
  place: {
    label: '장소',
    brief: '한국 도시, 세계 대도시, 일상 공간(병원/학교/카페 등), 한국 명소.',
  },
  object: {
    label: '사물',
    brief: '집·사무실에서 흔히 보는 가구, 가전, 학용품, 생활용품.',
  },
  movie: {
    label: '영화/드라마',
    brief: '한국에서 1,000만 관객 또는 메가히트한 영화/드라마 제목. 너무 마이너 X.',
  },
  idol: {
    label: '아이돌',
    brief: '한국 대중에게 잘 알려진 그룹/솔로 아티스트. 데뷔 1년 미만은 제외.',
  },
  sports: {
    label: '스포츠',
    brief: '구기 종목, 격투기, 동·하계 올림픽 종목, 운동 용어.',
  },
  job: {
    label: '직업',
    brief: '대표적인 직업명. 비속어/유행어 X.',
  },
};

export const WORD_GEN_SYSTEM = `너는 한국어 초성 퀴즈 게임의 출제자다.
사용자가 카테고리를 주면, 그 카테고리에 속하는 한국어 단어 30개를 만든다.

규칙:
1. 모든 단어는 표준국어대사전 또는 일반 한국인이 명확히 아는 단어/고유명사여야 한다.
2. 글자 수 2~5자. 절반은 3자, 30%는 4자, 20%는 2/5자.
3. 너무 어렵거나 너무 마이너한 단어 금지.
4. 카테고리에 명백히 속해야 한다.
5. 각 단어에 한 줄 힌트 (단어 직접 노출 금지).
6. 난이도 1(쉬움), 2(보통), 3(어려움) 중 하나 부여.
7. 한글 음절(가~힣)만 사용. 영문/숫자/특수문자/공백 포함 금지.
8. 모든 단어는 서로 달라야 한다 (중복 금지).

출력: 다음 JSON 외에 아무것도 출력하지 마라. 헤더, 설명, 코드블록 금지.
{"words":[{"word":"...","hint":"...","difficulty":1}, ...]}`;

export interface BuildWordPromptInput {
  category: CategoryId;
  count: number; // 보통 30
  excludeWords?: readonly string[]; // 중복 회피용
}

export function buildWordUserPrompt(input: BuildWordPromptInput): string {
  const meta = CATEGORY_BRIEF[input.category];
  const lines = [
    `카테고리: ${meta.label}`,
    `카테고리 설명: ${meta.brief}`,
    `만들어야 할 개수: ${input.count}`,
  ];
  if (input.excludeWords && input.excludeWords.length > 0) {
    lines.push('아래 단어는 이미 있으니 절대 다시 사용하지 말 것:');
    lines.push(input.excludeWords.join(', '));
  }
  lines.push('', 'JSON으로만 출력하라.');
  return lines.join('\n');
}

export function buildWordMessages(input: BuildWordPromptInput) {
  return {
    system: WORD_GEN_SYSTEM,
    messages: [{ role: 'user' as const, content: buildWordUserPrompt(input) }],
  };
}
