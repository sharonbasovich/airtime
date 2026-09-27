import { detectTrace, Sample } from '../detector';
import { mulberry32, synthJumpTrace } from '../synth';

const still = (ms: number, t0 = 0, hz = 100): Sample[] =>
  Array.from({ length: Math.round((ms * hz) / 1000) }, (_, i) => ({ t: t0 + (i * 1000) / hz, x: 0, y: 1, z: 0 }));

function rotate(samples: Sample[], yaw: number, pitch: number): Sample[] {
  return samples.map((s) => {
    const x1 = s.x * Math.cos(yaw) - s.y * Math.sin(yaw);
    const y1 = s.x * Math.sin(yaw) + s.y * Math.cos(yaw);
    const y2 = y1 * Math.cos(pitch) - s.z * Math.sin(pitch);
    const z2 = y1 * Math.sin(pitch) + s.z * Math.cos(pitch);
    return { t: s.t, x: x1, y: y2, z: z2 };
  });
}

describe('accuracy across many noisy synthetic jumps', () => {
  test('30 seeds at 35 cm: mean abs error < 1 cm, worst < 2 cm', () => {
    const errs = Array.from({ length: 30 }, (_, i) => {
      const st = detectTrace(synthJumpTrace(35, { seed: 100 + i, noiseG: 0.04 }));
      expect(st.phase).toBe('done');
      return Math.abs((st.result?.heightCm ?? 0) - 35);
    });
    expect(errs.reduce((a, b) => a + b, 0) / errs.length).toBeLessThan(1);
    expect(Math.max(...errs)).toBeLessThan(2);
  });

  test('a 5 cm drop in real flight is resolved in the right direction every time', () => {
    for (let i = 0; i < 20; i++) {
      const fresh = detectTrace(synthJumpTrace(38, { seed: 500 + i, noiseG: 0.03 })).result?.heightCm ?? 0;
      const tired = detectTrace(synthJumpTrace(33, { seed: 900 + i, noiseG: 0.03 })).result?.heightCm ?? 0;
      expect(fresh - tired).toBeGreaterThan(3.5);
    }
  });

  test('reports push peak, flight mean g and sample rate', () => {
    const r = detectTrace(synthJumpTrace(30, { seed: 3 })).result;
    expect(r?.pushPeakG).toBeGreaterThan(2);
    expect(r?.flightMeanG).toBeLessThan(0.15);
    expect(r?.sampleHz).toBeGreaterThan(95);
    expect(r?.sampleHz).toBeLessThan(105);
  });
});

describe('real-world sensor conditions', () => {
  test('orientation independent: phone rotated arbitrarily on the chest', () => {
    const base = synthJumpTrace(40, { seed: 11 });
    for (const [yaw, pitch] of [[0.4, 0.2], [1.57, 0], [2.5, -1.1]]) {
      const st = detectTrace(rotate(base, yaw, pitch));
      expect(st.phase).toBe('done');
      expect(Math.abs((st.result?.heightCm ?? 0) - 40)).toBeLessThan(1.5);
    }
  });

  test('timestamp jitter of ±3 ms (Android sensor delivery) stays within 2 cm', () => {
    const rand = mulberry32(42);
    const jittered = synthJumpTrace(35, { seed: 5 }).map((s, i) => ({ ...s, t: i * 10 + (rand() - 0.5) * 6 }));
    const st = detectTrace(jittered);
    expect(st.phase).toBe('done');
    expect(Math.abs((st.result?.heightCm ?? 0) - 35)).toBeLessThan(2);
  });

  test('duplicate / out-of-order timestamps are ignored', () => {
    const trace = synthJumpTrace(35, { seed: 6 });
    const messy = trace.flatMap((s, i) => (i % 17 === 0 ? [s, { ...s }, { ...s, t: s.t - 5 }] : [s]));
    const st = detectTrace(messy);
    expect(st.phase).toBe('done');
    expect(Math.abs((st.result?.heightCm ?? 0) - 35)).toBeLessThan(1.5);
  });

  test('works at 200 Hz', () => {
    const st = detectTrace(synthJumpTrace(45, { hz: 200, seed: 8 }));
    expect(Math.abs((st.result?.heightCm ?? 0) - 45)).toBeLessThan(1);
  });

  test('sensor gap mid-flight is rejected rather than guessed', () => {
    const trace = synthJumpTrace(40, { seed: 9 });
    const takeoff = trace.findIndex((s) => s.y < 0.2);
    const gappy = trace.filter((_, i) => i < takeoff + 10 || i > takeoff + 16);
    const st = detectTrace(gappy);
    expect(st.phase).toBe('rejected');
    expect(st.reason).toMatch(/sensor gap/);
  });
});

describe('false positives', () => {
  test('phone dropped from still hands onto a cushion: no push-off, rejected', () => {
    const fall = Array.from({ length: 30 }, (_, i) => ({ t: 800 + i * 10, x: 0, y: 0.02, z: 0 }));
    const impact = Array.from({ length: 10 }, (_, i) => ({ t: 1100 + i * 10, x: 0, y: 3, z: 0 }));
    const st = detectTrace([...still(800), ...fall, ...impact]);
    expect(st.phase).toBe('rejected');
    expect(st.reason).toMatch(/push-off/);
  });

  test('walking around (no free fall) never produces a jump', () => {
    const rand = mulberry32(1);
    const walk = Array.from({ length: 1000 }, (_, i) => ({
      t: 1000 + i * 10,
      x: (rand() - 0.5) * 0.2,
      y: 1 + 0.45 * Math.sin((2 * Math.PI * i) / 55),
      z: (rand() - 0.5) * 0.2,
    }));
    expect(detectTrace([...still(1000), ...walk]).phase).toBe('ready');
  });

  test('brief near-0 g blips shorter than the confirmation window do not start a flight', () => {
    const blips = [0, 1, 2].flatMap((k) => [
      { t: 900 + k * 200, x: 0, y: 0.1, z: 0 },
      { t: 910 + k * 200, x: 0, y: 0.1, z: 0 },
      ...still(180, 920 + k * 200),
    ]);
    expect(detectTrace([...still(900), ...blips]).phase).toBe('ready');
  });

  test('phone sliding on the chest mid-air (high flight mean g) is rejected', () => {
    const trace = synthJumpTrace(40, { seed: 12 });
    const takeoff = trace.findIndex((s) => s.y < 0.2);
    const wobbly = trace.map((s, i) => (i > takeoff + 8 && i < takeoff + 45 ? { ...s, y: 1.2 } : s));
    const st = detectTrace(wobbly);
    expect(st.phase).toBe('rejected');
  });
});
