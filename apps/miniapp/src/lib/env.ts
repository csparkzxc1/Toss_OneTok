// Granite plugin-env 가 PUBLIC_ prefix 변수를 process.env로 주입
declare const process: { env: Record<string, string | undefined> };

export const env = {
  apiBaseUrl: process.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3001',
  appEnv: (process.env.PUBLIC_APP_ENV ?? 'development') as 'development' | 'production',
};
