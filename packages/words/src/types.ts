export type CategoryId =
  | 'food'
  | 'movie'
  | 'animal'
  | 'place'
  | 'idol'
  | 'sports'
  | 'object'
  | 'job';

export interface CategoryMeta {
  id: CategoryId;
  label: string; // 화면 표기
  icon: string; // 이모지
  premium: boolean; // 유료 잠금 여부
}

export interface SeedWord {
  word: string;
  hint: string;
  difficulty: 1 | 2 | 3;
  alternates?: readonly string[];
}

export interface CategorySeed {
  category: CategoryId;
  words: readonly SeedWord[];
}

export const CATEGORIES: readonly CategoryMeta[] = [
  { id: 'food', label: '음식', icon: '🍔', premium: false },
  { id: 'animal', label: '동물', icon: '🐶', premium: false },
  { id: 'place', label: '장소', icon: '🗺️', premium: false },
  { id: 'object', label: '사물', icon: '🪑', premium: false },
  { id: 'movie', label: '영화/드라마', icon: '🎬', premium: false },
  { id: 'idol', label: '아이돌', icon: '🎤', premium: true },
  { id: 'sports', label: '스포츠', icon: '⚽', premium: true },
  { id: 'job', label: '직업', icon: '💼', premium: true },
];

export const FREE_CATEGORIES: readonly CategoryId[] = CATEGORIES.filter((c) => !c.premium).map(
  (c) => c.id,
);
export const PREMIUM_CATEGORIES: readonly CategoryId[] = CATEGORIES.filter((c) => c.premium).map(
  (c) => c.id,
);
