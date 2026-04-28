/** @type {import('jest').Config} */
module.exports = {
  preset: 'react-native',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@hanjul-tok/shared$': '<rootDir>/../../packages/shared/src/index.ts',
  },
  testPathIgnorePatterns: ['/node_modules/', '/.granite/'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@apps-in-toss|@granite-js)/)',
  ],
};
