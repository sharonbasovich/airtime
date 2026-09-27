import { heightCmFromFlightTime } from './physics';

export type Sample = { t: number; x: number; y: number; z: number };

export type DetectorConfig = {
  /** Magnitude (g) below which the phone is considered in free fall. */
  freeFallG: number;
  /** Consecutive free-fall duration (ms) required to confirm take-off. */
  minFreeFallMs: number;
  /** Magnitude (g) that marks landing impact after free fall. */
  landingG: number;
  /** Plausible flight-time window (ms). */
  minFlightMs: number;
  maxFlightMs: number;
  /** Max std-dev of magnitude (g) during the pre-jump stillness window. */
  maxStillStd: number;
  stillWindowMs: number;
  /** A real jump has a propulsion peak (g) within `pushWindowMs` before take-off; a dropped phone does not. */
  minPushG: number;
  pushWindowMs: number;
  /** Largest tolerated gap between samples (ms) while armed or airborne. */
  maxGapMs: number;
  /** Mean magnitude (g) during flight above which the phone was moving on the body, not in free fall. */
  maxFlightMeanG: number;
};

export const DEFAULT_CONFIG: DetectorConfig = {
  freeFallG: 0.35,
  minFreeFallMs: 60,
  landingG: 1.4,
  minFlightMs: 150,
  maxFlightMs: 1000,
  maxStillStd: 0.08,
  stillWindowMs: 400,
  minPushG: 1.25,
  pushWindowMs: 700,
  maxGapMs: 40,
  maxFlightMeanG: 0.45,
};

export type DetectorPhase = 'waiting-still' | 'ready' | 'airborne' | 'done' | 'rejected';

export type JumpDetection = {
  flightMs: number;
  heightCm: number;
  takeoffT: number;
  landingT: number;
  /** Peak propulsion (g) before take-off, mean magnitude during flight, and effective sample rate. */
  pushPeakG: number;
  flightMeanG: number;
  sampleHz: number;
};

export type DetectorState = {
  phase: DetectorPhase;
  result?: JumpDetection;
  reason?: string;
};

export function magnitude(s: Sample): number {
  return Math.sqrt(s.x * s.x + s.y * s.y + s.z * s.z);
}

/**
 * Streaming take-off / landing detector over accelerometer magnitude.
 * Take-off = downward crossing of `freeFallG` that starts a sustained near-0 g run (confirmed only if a
 * propulsion peak preceded it); landing = the last upward crossing of the same level before the impact
 * threshold is hit. Using one level for both edges keeps threshold bias symmetric. Edges are interpolated.
 */
export class JumpDetector {
  private readonly cfg: DetectorConfig;
  private buffer: { t: number; m: number }[] = [];
  private history: { t: number; m: number }[] = [];
  private flight = { sum: 0, n: 0 };
  private pushPeakG = 0;
  private lastLow: { t: number; m: number } | null = null;
  private afterLow: { t: number; m: number } | null = null;
  private phase: DetectorPhase = 'waiting-still';
  private freeFallStart: number | null = null;
  private prev: { t: number; m: number } | null = null;
  private result?: JumpDetection;
  private reason?: string;

  constructor(cfg: Partial<DetectorConfig> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...cfg };
  }

  get state(): DetectorState {
    return { phase: this.phase, result: this.result, reason: this.reason };
  }

  reset(): void {
    this.buffer = [];
    this.history = [];
    this.flight = { sum: 0, n: 0 };
    this.pushPeakG = 0;
    this.lastLow = null;
    this.afterLow = null;
    this.phase = 'waiting-still';
    this.freeFallStart = null;
    this.prev = null;
    this.result = undefined;
    this.reason = undefined;
  }

  push(sample: Sample): DetectorState {
    const cur = { t: sample.t, m: magnitude(sample) };
    const c = this.cfg;
    if (this.phase === 'done' || this.phase === 'rejected') return this.state;
    if (this.prev && cur.t <= this.prev.t) return this.state;
    const gap = this.prev ? cur.t - this.prev.t : 0;
    if (gap > c.maxGapMs) {
      if (this.phase === 'airborne') {
        this.reject(`sensor gap of ${Math.round(gap)} ms mid-flight`);
        return this.state;
      }
      this.buffer = [];
      this.history = [];
      this.freeFallStart = null;
    }
    this.history.push(cur);
    while (this.history.length && cur.t - this.history[0].t > c.pushWindowMs + c.minFreeFallMs + c.maxGapMs) {
      this.history.shift();
    }
    switch (this.phase) {
      case 'waiting-still': {
        this.buffer.push(cur);
        while (this.buffer.length && cur.t - this.buffer[0].t > c.stillWindowMs) this.buffer.shift();
        const span = this.buffer.length ? cur.t - this.buffer[0].t : 0;
        if (span >= c.stillWindowMs * 0.9 && stdDev(this.buffer.map((b) => b.m)) <= c.maxStillStd) {
          this.phase = 'ready';
        }
        break;
      }
      case 'ready': {
        if (cur.m < c.freeFallG) {
          if (this.freeFallStart === null) {
            this.freeFallStart = this.prev && gap <= c.maxGapMs ? crossing(this.prev, cur, c.freeFallG) : cur.t;
            this.flight = { sum: 0, n: 0 };
          }
          this.flight.sum += cur.m;
          this.flight.n += 1;
          if (cur.t - this.freeFallStart >= c.minFreeFallMs) {
            const takeoff = this.freeFallStart;
            this.pushPeakG = this.history
              .filter((h) => h.t < takeoff && takeoff - h.t <= c.pushWindowMs)
              .reduce((mx, h) => Math.max(mx, h.m), 0);
            if (this.pushPeakG < c.minPushG) {
              this.reject('free fall without a push-off (phone dropped?)');
            } else {
              this.phase = 'airborne';
            }
          }
        } else {
          this.freeFallStart = null;
        }
        break;
      }
      case 'airborne': {
        const takeoff = this.freeFallStart as number;
        if (cur.m < c.freeFallG) {
          this.lastLow = cur;
          this.afterLow = null;
        } else if (this.lastLow && !this.afterLow) {
          this.afterLow = cur;
        }
        if (cur.m >= c.landingG) {
          const landing =
            this.lastLow && this.afterLow ? crossing(this.lastLow, this.afterLow, c.freeFallG) : cur.t;
          const flightMs = landing - takeoff;
          const flightMeanG = this.flight.n ? this.flight.sum / this.flight.n : 0;
          if (flightMs < c.minFlightMs || flightMs > c.maxFlightMs) {
            this.reject(`flight time ${Math.round(flightMs)} ms outside plausible range`);
          } else if (flightMeanG > c.maxFlightMeanG) {
            this.reject('phone moved against the body mid-air; hold it flat to your chest');
          } else {
            const first = this.history[0];
            const sampleHz = first && cur.t > first.t ? ((this.history.length - 1) * 1000) / (cur.t - first.t) : 0;
            this.result = {
              flightMs,
              heightCm: heightCmFromFlightTime(flightMs / 1000),
              takeoffT: takeoff,
              landingT: landing,
              pushPeakG: this.pushPeakG,
              flightMeanG,
              sampleHz,
            };
            this.phase = 'done';
          }
        } else {
          this.flight.sum += cur.m;
          this.flight.n += 1;
          if (cur.t - takeoff > c.maxFlightMs) this.reject('no landing detected (phone dropped or thrown?)');
        }
        break;
      }
      default:
        break;
    }
    this.prev = cur;
    return this.state;
  }

  private reject(reason: string) {
    this.phase = 'rejected';
    this.reason = reason;
  }
}

function crossing(a: { t: number; m: number }, b: { t: number; m: number }, level: number): number {
  if (a.m === b.m) return b.t;
  const f = (level - a.m) / (b.m - a.m);
  return a.t + Math.min(1, Math.max(0, f)) * (b.t - a.t);
}

export function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  return Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1));
}

export function detectTrace(samples: Sample[], cfg?: Partial<DetectorConfig>): DetectorState {
  const d = new JumpDetector(cfg);
  for (const s of samples) {
    const st = d.push(s);
    if (st.phase === 'done' || st.phase === 'rejected') return st;
  }
  return d.state;
}
