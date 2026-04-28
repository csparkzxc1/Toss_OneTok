# 초성런 (Choseong Run)

> 한국어 초성(예: ㄱㅊㅈㄱ)을 보고 30초 안에 단어(김치찌개)를 맞히는 1인 캐주얼 게임. 토스 인앱 미니앱.

## 한 게임 = 30초

```
카테고리 표시 → 초성 + 힌트 → 한글 입력 → 즉시 채점
정답: +점수 / 콤보+1 / 햅틱 light
오답: 콤보 리셋 / 1초 페널티 / 햅틱 medium
5콤보마다: +5초 보너스 + 화면 빛남 + 햅틱 heavy
```

## 모노레포 구조

```
choseong-run/
├── apps/
│   ├── miniapp/        # 토스 인앱 (React Native + Granite)
│   └── api/            # Next.js 15 백엔드 (Anthropic + Supabase + Upstash)
├── packages/
│   ├── shared/         # 공용 타입 / zod 스키마 / 상수
│   ├── chosung/        # 한글 → 초성 변환 / 정답 매칭 (클라+서버 공용)
│   └── words/          # 시드 단어 1,000개 큐레이션 JSON
└── .github/workflows/ci.yml
```

## 사전 준비

| 항목 | 비고 |
|---|---|
| Node.js 20+ | `node -v` |
| pnpm 9+ | `npm i -g pnpm` |
| 앱인토스 콘솔 미니앱 등록 | 앱 이름 = `choseong-run` |
| Anthropic API Key | 단어 풀 자동 생성용 (백엔드 전용) |
| Supabase 프로젝트 | URL / anon / service role |
| Upstash Redis | REST URL + Token |
| Vercel 계정 | 백엔드 배포 + Cron |
| (선택) 표준국어대사전 API Key | AI 단어 검증용 |

## 설치

```bash
pnpm install
```

## 환경 변수

### `apps/api/.env.local`

```
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
TOSS_APP_KEY=...
TOSS_IAP_VERIFY_URL=https://apps-in-toss.toss.im/iap/v1/verify
CRON_SECRET=long-random-string
STDICT_API_KEY=                    # 선택, 단어 검증용
NODE_ENV=development
```

### `apps/miniapp/.env.local`

```
PUBLIC_API_BASE_URL=http://localhost:3001
PUBLIC_APP_ENV=development
```

## DB 마이그레이션

Supabase SQL Editor에서 `apps/api/supabase/migrations/0001_init.sql` 전체를 실행한다.

## 로컬 개발

```bash
# 백엔드
pnpm dev:api          # http://localhost:3001

# 미니앱
pnpm dev:miniapp      # Granite dev → 토스 샌드박스에서 intoss://choseong-run
```

## 검증 명령

```bash
pnpm lint
pnpm typecheck
pnpm test
```

## 게임 점수 공식 (서버 강제)

```
문제별 점수 = 100 × 콤보배율 × 시간배율
콤보배율 = min(2.0, 1.0 + 콤보수 × 0.1)   // 콤보 0:1.0, 5:1.5, 10:2.0(상한)
시간배율 = max(0.5, 남은시간 / 30)          // 빨리 풀수록 가산
```

클라이언트가 보낸 점수는 **절대 신뢰하지 않는다**. 서버에서 정답 매칭 + 점수 재계산.

## 수익 채널

| 채널 | 구현 |
|---|---|
| 무료 사용량 제한 | 익명 일 3게임 / 토스 로그인 시 일 5게임 + 일일 챌린지 1회 |
| 보상형 광고(IAA) | 광고 1회 → +1게임 (일 최대 5회), 일일 챌린지 부활 1회 |
| 인앱결제(IAP) | 월 ₩3,900 / 평생권 ₩14,900 → 무광고 + 무제한 + 통계 + 다크 + 잠금 카테고리 3개 |
| 토스 포인트 프로모션 | 출석 7일 200P / 첫 100점 50P / 일일 챌린지 완주 30P |

## 보안 체크리스트

- [x] 게임 시작 시 정답을 클라에 보내지 않음 (초성+힌트만)
- [x] 점수는 서버에서 100% 재계산
- [x] `/api/game/submit` IP+deviceId rate limit (분당 10회)
- [x] 영수증 검증 실패 시 프리미엄 잠금 해제 안 함
- [x] 사용자 입력 단어는 평문 저장 안 함 (정답 여부와 시간만)
- [x] Cron 엔드포인트는 `CRON_SECRET` 헤더 검증

## 출시 직전 체크 (사람이 직접)

1. 앱인토스 콘솔에서 IAP 상품 2개 등록
   - `choseong_run_monthly` ₩3,900
   - `choseong_run_lifetime` ₩14,900
2. 토스 포인트 프로모션 등록 + 비즈 월렛 충전
3. 단어 시드 1,000개 사람 검수 통과
4. 표준국어대사전 API 키 발급 + 환경변수 등록
5. 샌드박스 + 실기기 한글 입력 테스트 (iOS + Android)
6. 검수 신청 (콘솔)
7. 개인정보처리방침 / 이용약관 URL 등록
8. 결제 정산 정보 등록
