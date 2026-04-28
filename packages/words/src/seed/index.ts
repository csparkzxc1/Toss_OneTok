import type { CategoryId, CategorySeed, SeedWord } from '../types.js';
import { ANIMAL } from './animal.js';
import { FOOD } from './food.js';
import { IDOL } from './idol.js';
import { JOB } from './job.js';
import { MOVIE } from './movie.js';
import { OBJECT } from './object.js';
import { PLACE } from './place.js';
import { SPORTS } from './sports.js';

export const SEED: readonly CategorySeed[] = [
  FOOD,
  ANIMAL,
  PLACE,
  OBJECT,
  MOVIE,
  IDOL,
  SPORTS,
  JOB,
];

const SEED_BY_CATEGORY: Readonly<Record<CategoryId, readonly SeedWord[]>> = {
  food: FOOD.words,
  animal: ANIMAL.words,
  place: PLACE.words,
  object: OBJECT.words,
  movie: MOVIE.words,
  idol: IDOL.words,
  sports: SPORTS.words,
  job: JOB.words,
};

export function getSeedWords(category: CategoryId): readonly SeedWord[] {
  return SEED_BY_CATEGORY[category] ?? [];
}

export function getAllSeedWords(): readonly { category: CategoryId; word: SeedWord }[] {
  const out: { category: CategoryId; word: SeedWord }[] = [];
  for (const section of SEED) {
    for (const word of section.words) {
      out.push({ category: section.category, word });
    }
  }
  return out;
}
