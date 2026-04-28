// Granite v1 라우터 위에 얇게 래핑.
// page-based 자동 라우팅을 사용하므로, 미니앱은 useNavigation() / useParams()만 쓰면 된다.
// 실 SDK API와 약간 다를 수 있어 우리 코드 경계는 이 한 파일에서 흡수한다.

// eslint-disable-next-line @typescript-eslint/no-var-requires
const granite = require('@granite-js/react-native') as Record<string, unknown>;

export interface RouterNav {
  push: (path: string, params?: Record<string, unknown>) => void;
  replace: (path: string, params?: Record<string, unknown>) => void;
  goBack: () => void;
}

export function useNavigation(): RouterNav {
  const fn = granite.useNavigation as (() => unknown) | undefined;
  if (typeof fn === 'function') {
    const nav = fn() as Partial<RouterNav> & {
      navigate?: (path: string, params?: Record<string, unknown>) => void;
    };
    return {
      push: (path, params) => (nav.push ?? nav.navigate ?? (() => {}))(path, params),
      replace: (path, params) => (nav.replace ?? nav.navigate ?? (() => {}))(path, params),
      goBack: () => (nav.goBack ?? (() => {}))(),
    };
  }
  return { push: () => {}, replace: () => {}, goBack: () => {} };
}

export function useRouteParams<T = Record<string, unknown>>(): T {
  const fn = (granite.useParams ?? granite.useInitialSearchParams) as (() => unknown) | undefined;
  if (typeof fn === 'function') {
    return (fn() as T) ?? ({} as T);
  }
  return {} as T;
}
