import { leaderboard } from '../jumpoff';

test('best per athlete, ranked, ties share rank', () => {
  const rows = leaderboard([
    { name: 'Maya', heightCm: 41.2 },
    { name: 'Dev', heightCm: 29 },
    { name: 'Maya', heightCm: 38 },
    { name: 'Sharon', heightCm: 40.9 },
    { name: ' ', heightCm: 12 },
  ]);
  expect(rows.map((r) => [r.name, r.rank])).toEqual([
    ['Maya', 1],
    ['Sharon', 1],
    ['Dev', 3],
    ['Anonymous', 4],
  ]);
});
