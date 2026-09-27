export type JumpRecord = {
  id: string;
  /** Epoch ms. */
  at: number;
  heightCm: number;
  flightMs: number;
  source: 'sensor' | 'simulated' | 'sample-data';
  athlete?: string;
};

export type DaySummary = { day: string; meanCm: number; jumps: number };

export type ReadinessCall = 'go' | 'easy' | 'rest';

export type Readiness =
  | { status: 'need-baseline'; daysLogged: number; daysNeeded: number }
  | { status: 'need-today'; baselineCm: number; baselineDays: number }
  | {
      status: 'ready';
      todayCm: number;
      todayJumps: number;
      baselineCm: number;
      baselineDays: number;
      changePct: number;
      /** Day-to-day coefficient of variation of the baseline, in %. */
      noisePct: number;
      /** Change threshold (%) treated as meaningful for this athlete. */
      thresholdPct: number;
      call: ReadinessCall;
    };

export const BASELINE_MIN_DAYS = 3;
export const BASELINE_MAX_DAYS = 7;
/** Floor for the meaningful-change threshold so tiny baselines don't produce hair-trigger calls. */
export const MIN_THRESHOLD_PCT = 3;
/** Jumps per day that count (first N) — mirrors a fixed daily protocol. */
export const JUMPS_PER_DAY = 3;

export function localDayKey(epochMs: number, tzOffsetMin = new Date(epochMs).getTimezoneOffset()): string {
  const d = new Date(epochMs - tzOffsetMin * 60_000);
  return d.toISOString().slice(0, 10);
}

export function summarizeDays(records: JumpRecord[], dayKey: (ms: number) => string = localDayKey): DaySummary[] {
  const byDay = new Map<string, JumpRecord[]>();
  for (const r of [...records].sort((a, b) => a.at - b.at)) {
    const k = dayKey(r.at);
    const list = byDay.get(k) ?? [];
    if (list.length < JUMPS_PER_DAY) list.push(r);
    byDay.set(k, list);
  }
  return [...byDay.entries()]
    .map(([day, list]) => ({ day, jumps: list.length, meanCm: mean(list.map((r) => r.heightCm)) }))
    .sort((a, b) => (a.day < b.day ? -1 : 1));
}

/**
 * Readiness = today's mean jump (first 3 jumps) vs the athlete's own baseline
 * (mean of daily means over the previous 3–7 logged days). A change only counts if it exceeds
 * the athlete's own day-to-day noise (CV of the baseline days), floored at MIN_THRESHOLD_PCT.
 *   change > -threshold          → go
 *   -2·threshold < change ≤ -thr → easy
 *   change ≤ -2·threshold        → rest
 */
export function computeReadiness(
  records: JumpRecord[],
  now: number,
  dayKey: (ms: number) => string = localDayKey,
): Readiness {
  const today = dayKey(now);
  const days = summarizeDays(records.filter((r) => r.at <= now), dayKey);
  const prior = days.filter((d) => d.day < today).slice(-BASELINE_MAX_DAYS);
  if (prior.length < BASELINE_MIN_DAYS) {
    return { status: 'need-baseline', daysLogged: prior.length, daysNeeded: BASELINE_MIN_DAYS };
  }
  const baselineCm = mean(prior.map((d) => d.meanCm));
  const todayDay = days.find((d) => d.day === today);
  if (!todayDay) return { status: 'need-today', baselineCm, baselineDays: prior.length };
  const noisePct = (sampleStd(prior.map((d) => d.meanCm)) / baselineCm) * 100;
  const thresholdPct = Math.max(MIN_THRESHOLD_PCT, noisePct);
  const changePct = ((todayDay.meanCm - baselineCm) / baselineCm) * 100;
  const call: ReadinessCall = changePct > -thresholdPct ? 'go' : changePct > -2 * thresholdPct ? 'easy' : 'rest';
  return {
    status: 'ready',
    todayCm: todayDay.meanCm,
    todayJumps: todayDay.jumps,
    baselineCm,
    baselineDays: prior.length,
    changePct,
    noisePct,
    thresholdPct,
    call,
  };
}

export function mean(v: number[]): number {
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0;
}

export function sampleStd(v: number[]): number {
  if (v.length < 2) return 0;
  const m = mean(v);
  return Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / (v.length - 1));
}

/** Seven days of labelled sample history so the readiness flow can be demoed on day one. */
export function sampleHistory(now: number, athleteBaseCm = 38, seedOffsets = [0.4, -0.6, 0.9, -0.3, 0.2, -0.8, 0.5]): JumpRecord[] {
  const out: JumpRecord[] = [];
  seedOffsets.forEach((off, i) => {
    const dayAt = now - (seedOffsets.length - i) * 86_400_000;
    for (let j = 0; j < JUMPS_PER_DAY; j++) {
      const h = athleteBaseCm + off + (j - 1) * 0.5;
      out.push({ id: `sample-${i}-${j}`, at: dayAt + j * 60_000, heightCm: h, flightMs: 0, source: 'sample-data' });
    }
  });
  return out;
}
