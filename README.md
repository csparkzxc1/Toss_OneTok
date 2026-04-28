# 한줄톡 (Hanjul-Tok)

> 한국인이 메시지 쓰기 막막한 순간, 상황 + 톤만 고르면 AI가 후보 3개를 즉시 생성해주는 토스 인앱 미니앱.

## 모노레포 구조

```
hanjul-tok/
├── apps/
│   ├── miniapp/   # 토스 인앱 (React Native + Granite)
│   └── api/       # Next.js 15 백엔드 (Anthropic + Supabase + Upstash)
├── packages/
│   ├── shared/    # 공용 타입 / zod 스키마 / 상수
│   └── prompts/   # 프롬프트 템플릿 + JSON 파서
└── .github/workflows/ci.yml
```

## 사전 준비

| 항목 | 비고 |
|---|---|
| Node.js 20+ | `node -v` |
| pnpm 9+ | `npm i -g pnpm` |
| 앱인토스 콘솔 미니앱 등록 | 앱 이름 = `hanjul-tok` (kebab-case 동일하게) |
| Anthropic API Key | 백엔드 `.env.local`에만 |
| Supabase 프로젝트 | URL / anon key / service role key |
| Upstash Redis | REST URL + REST Token |
| Vercel 계정 | 백엔드 배포 |

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
pnpm dev:miniapp      # Granite dev server → 토스 샌드박스 앱에서 intoss://hanjul-tok 진입
```

## 검증 명령

```bash
pnpm lint
pnpm typecheck
pnpm test
```

## 배포

### 백엔드 (Vercel)

1. `apps/api`를 Vercel 프로젝트 루트로 가리킴 (Root Directory).
2. 환경변수를 위 목록 그대로 등록.
3. 배포 후 `https://<도메인>/api/health` 확인.

### 미니앱

1. `pnpm --filter miniapp build` → 산출물 콘솔 업로드.
2. 검수 신청 (앱인토스 콘솔).

## 수익 채널

| 채널 | 구현 위치 |
|---|---|
| 무료 사용량 제한 | `apps/api/src/lib/ratelimit.ts` |
| 보상형 광고(IAA) | `apps/miniapp/src/toss/ad.ts` + `POST /api/usage` |
| 인앱결제(IAP) | `apps/miniapp/src/toss/iap.ts` + `POST /api/iap/verify` |
| 토스 포인트 프로모션 | `apps/miniapp/src/toss/points.ts` |

## 보안 체크리스트

- [x] `ANTHROPIC_API_KEY`는 백엔드 전용
- [x] Supabase service role key는 백엔드 전용
- [x] `/api/generate` IP+deviceId rate limit (분당 10회)
- [x] 영수증 검증 실패 시 콘텐츠 잠금 해제 안 함
- [x] 사용자 컨텍스트 평문 로깅 금지 (길이만 기록)
- [x] 모든 에러는 사람이 읽을 수 있는 한국어 메시지

## 출시 전 체크 (사람이 직접)

자동화할 수 없는 항목들:

1. 앱인토스 콘솔에서 IAP 상품 2개 등록
   - `hanjul_tok_monthly` ₩2,900
   - `hanjul_tok_yearly` ₩24,000
2. 토스 포인트 프로모션 등록 + 비즈 월렛 충전
   - `hanjul_attend_3d` (50P), `hanjul_attend_7d` (200P), `hanjul_first_use` (100P)
3. 샌드박스 앱 설치 + 실기기 end-to-end 테스트
4. 개인정보처리방침 / 이용약관 URL 등록
5. 정산 정보 (사업자/개인) 등록 → https://developers-apps-in-toss.toss.im/settlement/intro.html
6. 검수 신청
