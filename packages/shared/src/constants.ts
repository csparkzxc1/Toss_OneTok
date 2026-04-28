export const SITUATION_LABEL = {
  reject: '거절',
  apology: '사과',
  request: '부탁',
  thanks: '감사',
  congrats: '축하',
  condolence: '조의',
  introduce: '소개',
  reply: '답장',
  breakup: '이별',
  reconcile: '화해',
  announce: '공지',
  etc: '기타',
} as const;

export const SITUATION_ICON = {
  reject: '🙅',
  apology: '🙏',
  request: '🤝',
  thanks: '💝',
  congrats: '🎉',
  condolence: '🕊️',
  introduce: '👋',
  reply: '💬',
  breakup: '💔',
  reconcile: '🌱',
  announce: '📣',
  etc: '✍️',
} as const;

export const TONE_LABEL = {
  polite: '정중',
  casual: '친근',
  witty: '위트',
  firm: '단호',
  warm: '따뜻',
  business: '비즈니스',
  romance: '연애',
  dialect: '사투리',
} as const;

export const FREE_TONES = ['polite', 'casual', 'witty', 'firm', 'warm'] as const;
export const PREMIUM_TONES = ['business', 'romance', 'dialect'] as const;

export const FREE_DAILY_LIMIT_ANON = 3;
export const FREE_DAILY_LIMIT_LOGGED_IN = 5;
export const BONUS_DAILY_LIMIT = 5;

export const PRODUCT_IDS = {
  monthly: 'hanjul_tok_monthly',
  yearly: 'hanjul_tok_yearly',
} as const;

export const CONTEXT_MAX_LENGTH = 300;
export const CANDIDATE_MAX_LENGTH = 200;
