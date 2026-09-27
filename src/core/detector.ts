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
};

export const DEFAULT_CONFIG: DetectorConfig = {
  freeFallG: 0.35,
  minFreeFallMs: 60,
  landingG: 1.4,
  minFlightMs: 150,
  maxFlightMs: 1000,
  maxStillStd: 0.08,
  stillWindowMs: 400,
};

export type DetectorPhase = 'waiting-still' | 'ready' | 'airborne' | 'done' | 'rejected';

export type JumpDetection = {
  flightMs: number;
  heightCm: number;
  takeoffT: number;
  landingT: number;
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
 * Take-off = first sample of a sustained near-0 g run; landing = first sample after that run
 * that crosses the impact threshold. Sub-sample edges are linearly interpolated.
 */
export class JumpDetector {
  private readonly cfg: DetectorConfig;
  private buffer: { t: number; m: number }[] = [];
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
    this.phase = 'waiting-still';
    this.freeFallStart = null;
    this.prev = null;
    this.result = undefined;
    this.reason = undefined;
  }

  push(sample: Sample): DetectorState {
    const cur = { t: sample.t, m: magnitude(sample) };
    const c = this.cfg;
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
            this.freeFallStart = this.prev ? crossing(this.prev, cur, c.freeFallG) : cur.t;
          }
          if (cur.t - this.freeFallStart >= c.minFreeFallMs) this.phase = 'airborne';
        } else {
          this.freeFallStart = null;
        }
        break;
      }
      case 'airborne': {
        const takeoff = this.freeFallStart as number;
        if (cur.m >= c.landingG) {
          const landing = this.prev ? crossing(this.prev, cur, c.landingG) : cur.t;
          const flightMs = landing - takeoff;
          if (flightMs < c.minFlightMs || flightMs > c.maxFlightMs) {
            this.reject(`flight time ${Math.round(flightMs)} ms outside plausible range`);
          } else {
            this.result = {
              flightMs,
              heightCm: heightCmFromFlightTime(flightMs / 1000),
              takeoffT: takeoff,
              landingT: landing,
            };
            this.phase = 'done';
          }
        } else if (cur.t - takeoff > c.maxFlightMs) {
          this.reject('no landing detected (phone dropped or thrown?)');
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
