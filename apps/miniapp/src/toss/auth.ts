// 토스 로그인 / 사용자 식별 래퍼
// SDK v2.x 정식 API는 콘솔 가이드 참고:
// https://developers-apps-in-toss.toss.im/bedrock/reference/framework/시작하기/intro.html
//
// 현재 구현은 안전한 더미 — 실제 출시 시 framework SDK의 인증 메서드로 교체.
// 빌드/실행 시 미지원 환경에서는 null 반환.

export interface TossUser {
  tossUserKey: string;
}

async function tryDynamic<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

export async function loginWithToss(): Promise<TossUser | null> {
  // TODO(toss): SDK v2 인증 API로 교체.
  // 예시 (가이드 확정되면 사용):
  // const sdk = await import('@apps-in-toss/framework');
  // const result = await sdk.auth.login({ scopes: ['userKey'] });
  return tryDynamic(async () => {
    return null;
  });
}

export async function getCurrentUser(): Promise<TossUser | null> {
  // TODO(toss): SDK v2의 현재 세션 조회로 교체.
  return tryDynamic(async () => null);
}
