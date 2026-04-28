// 입력 정답 매칭 — 클라에서는 정답을 모르므로,
// 서버에서 받은 단어의 실제 답이 없다 → "초성 자수 일치 + 입력 한글만" 정도의 빠른 후보 검사만 수행.
// 진짜 채점은 서버.
//
// 이 함수는 키보드 onSubmit 시점에 "전송할 가치가 있는 입력인가" 정도를 가르는 용도.
import { isPlayableWord, normalizeAnswer } from '@choseong-run/chosung';

export interface QuickValidation {
  ok: boolean;
  reason?: 'empty' | 'non_korean' | 'length_mismatch';
}

/**
 * 클라이언트에서 사용자가 입력한 답에 대해 빠른 사전 검증.
 * - 빈 입력 거부
 * - 한글 음절이 아닌 글자만 들어있으면 거부
 * - 정답 글자 수와 불일치 시 경고용
 */
export function quickValidate(input: string, expectedLength: number): QuickValidation {
  const normalized = normalizeAnswer(input);
  if (!normalized) return { ok: false, reason: 'empty' };

  // 한글 글자 수 카운트 (NFC 후 isPlayableWord-like 체크는 길이 제한 때문에 여기선 직접 카운트)
  const chars = [...normalized];
  let hangulCount = 0;
  for (const ch of chars) {
    const code = ch.codePointAt(0) ?? 0;
    if (code >= 0xac00 && code <= 0xd7a3) hangulCount += 1;
  }
  if (hangulCount === 0) return { ok: false, reason: 'non_korean' };
  if (hangulCount !== expectedLength) {
    return { ok: false, reason: 'length_mismatch' };
  }
  return { ok: true };
}

export { isPlayableWord, normalizeAnswer };
