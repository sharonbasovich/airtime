import { computeReadiness, JumpRecord, sampleHistory, summarizeDays } from '../readiness';

const DAY = 86_400_000;
const utcKey = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const NOW = Date.UTC(2026, 8, 30, 12);

function day(offset: number, heights: number[]): JumpRecord[] {
  return heights.map((h, i) => ({ id: `${offset}-${i}`, at: NOW - offset * DAY + i * 1000, heightCm: h, flightMs: 0, source: 'sensor' }));
}

test('needs 3 prior days for a baseline', () => {
  const r = computeReadiness([...day(2, [40]), ...day(1, [40])], NOW, utcKey);
  expect(r).toEqual({ status: 'need-baseline', daysLogged: 2, daysNeeded: 3 });
});

test('baseline ready but no jump today', () => {
  const r = computeReadiness([...day(3, [40]), ...day(2, [41]), ...day(1, [39])], NOW, utcKey);
  expect(r.status).toBe('need-today');
  if (r.status === 'need-today') expect(r.baselineCm).toBeCloseTo(40, 6);
});

test('only first 3 jumps per day count', () => {
  const s = summarizeDays(day(0, [30, 30, 30, 90]), utcKey);
  expect(s[0]).toMatchObject({ jumps: 3, meanCm: 30 });
});

test('calls go / easy / rest against the 3% floor when baseline is very stable', () => {
  const base = [...day(3, [40]), ...day(2, [40]), ...day(1, [40])];
  const call = (today: number) => {
    const r = computeReadiness([...base, ...day(0, [today])], NOW, utcKey);
    return r.status === 'ready' ? r.call : r.status;
  };
  expect(call(40)).toBe('go');
  expect(call(39)).toBe('go');
  expect(call(38.4)).toBe('easy');
  expect(call(37)).toBe('rest');
});

test('noisy athletes need a bigger drop before we say rest', () => {
  const base = [...day(3, [36]), ...day(2, [44]), ...day(1, [40])];
  const r = computeReadiness([...base, ...day(0, [37])], NOW, utcKey);
  expect(r.status).toBe('ready');
  if (r.status === 'ready') {
    expect(r.noisePct).toBeCloseTo(10, 0);
    expect(r.call).toBe('go');
  }
});

test('baseline window uses at most the last 7 days', () => {
  const old = day(20, [10]);
  const recent = [1, 2, 3, 4, 5, 6, 7].flatMap((o) => day(o, [40]));
  const r = computeReadiness([...old, ...recent, ...day(0, [40])], NOW, utcKey);
  if (r.status !== 'ready') throw new Error('expected ready');
  expect(r.baselineCm).toBe(40);
  expect(r.baselineDays).toBe(7);
});

test('sample history is labelled and yields a baseline', () => {
  const h = sampleHistory(NOW);
  expect(h.every((r) => r.source === 'sample-data')).toBe(true);
  expect(computeReadiness(h, NOW, utcKey).status).toBe('need-today');
});
