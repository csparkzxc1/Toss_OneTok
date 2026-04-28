// 한글 초성 추출 / 정규화 / 매칭
//
// 유니코드 한글 음절(Hangul Syllables): U+AC00 ~ U+D7A3 (총 11,172자)
// 음절 구조: 초성(19) × 중성(21) × 종성(28)
// 초성 인덱스 = (codePoint - 0xAC00) / (21 * 28)
//
// 호환 자모(Hangul Compatibility Jamo): U+3131 ~ U+318E (입력기/시각화에서 흔히 쓰는 자모)
// 첫소리(Choseong) 자모 = U+1100 ~ U+1112 (한글 자모, 음절 분해 시 등장)

const HANGUL_SYLLABLE_BASE = 0xac00;
const HANGUL_SYLLABLE_LAST = 0xd7a3;
const JUNGSEONG_COUNT = 21;
const JONGSEONG_COUNT = 28;

// 인덱스 0~18 → 호환 자모 초성 19개
// (NFD 분해 시 등장하는 U+1100~U+1112 자모도 매핑이 동일하다)
const CHOSEONG_COMPAT: readonly string[] = [
  'ㄱ',
  'ㄲ',
  'ㄴ',
  'ㄷ',
  'ㄸ',
  'ㄹ',
  'ㅁ',
  'ㅂ',
  'ㅃ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅉ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
];

// 호환 자모 초성 → 인덱스
const COMPAT_TO_INDEX: Readonly<Record<string, number>> = Object.freeze(
  CHOSEONG_COMPAT.reduce<Record<string, number>>((acc, c, i) => {
    acc[c] = i;
    return acc;
  }, {}),
);

// 한글 자모(U+1100~U+1112, 첫소리) → 인덱스
const HANGUL_JAMO_CHOSEONG_BASE = 0x1100;

function isHangulSyllable(code: number): boolean {
  return code >= HANGUL_SYLLABLE_BASE && code <= HANGUL_SYLLABLE_LAST;
}

function isCompatChoseong(ch: string): boolean {
  return Object.hasOwn(COMPAT_TO_INDEX, ch);
}

function isJamoChoseong(code: number): boolean {
  return code >= HANGUL_JAMO_CHOSEONG_BASE && code <= 0x1112;
}

/**
 * 한 글자(또는 자모)에서 초성 한 글자를 뽑는다.
 * - 한글 음절: 초성 호환 자모로 변환 (예: '김' → 'ㄱ')
 * - 호환 자모 초성(ㄱ~ㅎ): 그대로 반환
 * - 첫소리 자모(U+1100~U+1112): 호환 자모로 변환
 * - 그 외 (영문/숫자/공백/특수문자): 입력 그대로 반환 (게임에서는 보통 한글만 다룸)
 */
export function toChosung(char: string): string {
  if (!char) return '';
  const code = char.codePointAt(0) ?? 0;

  if (isHangulSyllable(code)) {
    const offset = code - HANGUL_SYLLABLE_BASE;
    const choseongIndex = Math.floor(offset / (JUNGSEONG_COUNT * JONGSEONG_COUNT));
    return CHOSEONG_COMPAT[choseongIndex] ?? '';
  }

  if (isCompatChoseong(char)) {
    return char;
  }

  if (isJamoChoseong(code)) {
    return CHOSEONG_COMPAT[code - HANGUL_JAMO_CHOSEONG_BASE] ?? '';
  }

  // 한글이 아닌 글자는 게임 도메인에서 의미 없음 → 빈 문자열로 무시
  return '';
}

/**
 * 단어 → 초성 문자열.
 * - NFC 정규화 후 음절 단위 처리 (NFD 입력도 안전하게 흡수)
 * - 공백/특수문자는 무시
 * - 비한글 글자는 무시 (예: "K-pop" → "")
 */
export function wordToChosung(word: string): string {
  if (!word) return '';
  const normalized = word.normalize('NFC');
  let result = '';
  for (const ch of normalized) {
    const c = toChosung(ch);
    if (c) result += c;
  }
  return result;
}

/**
 * 정답 정규화: 비교용 표준 형태로 변환.
 * - NFC 정규화
 * - 공백/모든 구두점 제거
 * - 소문자화 (영문 혼합 대비)
 */
export function normalizeAnswer(input: string): string {
  if (!input) return '';
  return (
    input
      .normalize('NFC')
      // 공백·제어문자
      .replace(/\s+/gu, '')
      // 일반 구두점 + 흔한 기호 (한글/영문 모두)
      .replace(/[.,!?。、！？·…~\-_/\\'"`(){}\[\]<>+&%@#*=]/gu, '')
      .toLowerCase()
  );
}

/**
 * 입력이 정답과 일치하는가.
 * - 양쪽 모두 normalizeAnswer로 비교
 * - 동의어/대안은 별도 인자로 받음 (옵션)
 */
export function matchesAnswer(
  input: string,
  answer: string,
  alternates: readonly string[] = [],
): boolean {
  const target = normalizeAnswer(input);
  if (!target) return false;
  if (target === normalizeAnswer(answer)) return true;
  for (const alt of alternates) {
    if (target === normalizeAnswer(alt)) return true;
  }
  return false;
}

/**
 * 단어가 게임 출제 가능한지 검사.
 * - 모든 음절이 한글 음절(가~힣) 범위 안에 있어야 함
 * - 길이 2~5자
 */
export function isPlayableWord(word: string): boolean {
  if (!word) return false;
  const normalized = word.normalize('NFC');
  const chars = [...normalized];
  if (chars.length < 2 || chars.length > 5) return false;
  for (const ch of chars) {
    const code = ch.codePointAt(0) ?? 0;
    if (!isHangulSyllable(code)) return false;
  }
  return true;
}

export const CHOSEONG_LIST: readonly string[] = CHOSEONG_COMPAT;
