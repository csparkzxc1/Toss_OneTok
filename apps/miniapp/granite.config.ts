import type { GraniteConfig } from '@granite-js/react-native';

// 한줄톡 Granite 설정
// 공식 가이드: https://developers-apps-in-toss.toss.im/tutorials/react-native.html
const config: GraniteConfig = {
  appName: 'hanjul-tok',
  scheme: 'hanjul-tok',
  // pages/ 디렉토리 기반 라우팅 사용
  routes: {
    dir: './pages',
  },
  plugins: [
    // env 변수 주입: API 베이스 URL 등
    {
      name: 'env',
      options: {
        prefix: 'PUBLIC_',
      },
    },
  ],
};

export default config;
