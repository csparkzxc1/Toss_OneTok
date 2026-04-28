// 초성런 Granite 설정
// Granite v1.x: 정확한 GraniteConfig 스키마는 SDK 가이드 참고.
// 빌드 시점에 CLI가 page-based 자동 라우팅 처리.
// https://developers-apps-in-toss.toss.im/tutorials/react-native.html

const config = {
  appName: 'choseong-run',
  scheme: 'choseong-run',
  routes: { dir: './pages' },
  plugins: [
    // env 변수 주입: PUBLIC_ prefix
    { name: 'env', options: { prefix: 'PUBLIC_' } },
  ],
};

export default config;
