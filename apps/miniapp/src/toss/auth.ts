// 토스 로그인 / 사용자 식별 래퍼
// 공식 SDK: @apps-in-toss/framework
// 가이드: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/시작하기/intro.html
import { authentication } from '@apps-in-toss/framework';

export interface TossUser {
  tossUserKey: string;
}

export async function loginWithToss(): Promise<TossUser | null> {
  try {
    const result = await authentication.login({
      // 약관/스코프는 콘솔에서 등록한 항목 기준
      scopes: ['userKey'],
    });
    if (!result?.userKey) return null;
    return { tossUserKey: result.userKey };
  } catch (err) {
    console.warn('[toss.auth] login failed', err);
    return null;
  }
}

export async function getCurrentUser(): Promise<TossUser | null> {
  try {
    const result = await authentication.getMe();
    if (!result?.userKey) return null;
    return { tossUserKey: result.userKey };
  } catch {
    return null;
  }
}
