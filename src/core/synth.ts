import { flightTimeFromHeightCm } from './physics';
import type { Sample } from './detector';

/** Deterministic PRNG so synthetic traces are reproducible in tests and demos. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type SynthOptions = { hz?: number; noiseG?: number; seed?: number; stillMs?: number };

/**
 * Synthetic chest-held countermovement jump: stillness (1 g), unweighting dip, propulsion peak,
 * free fall (~0 g) for the flight time implied by `heightCm`, landing impact, then settle.
 * Used for the emulator "simulated jump" mode and detector tests — never for real results.
 */
export function synthJumpTrace(heightCm: number, opts: SynthOptions = {}): Sample[] {
  const hz = opts.hz ?? 100;
  const noise = opts.noiseG ?? 0.02;
  const rand = mulberry32(opts.seed ?? 1);
  const dt = 1000 / hz;
  const flightMs = flightTimeFromHeightCm(heightCm) * 1000;
  const still = opts.stillMs ?? 800;
  const phases: { dur: number; g: (p: number) => number }[] = [
    { dur: still, g: () => 1 },
    { dur: 250, g: (p) => 1 - 0.6 * Math.sin(Math.PI * p) },
    { dur: 250, g: (p) => 1 + 1.5 * Math.sin(Math.PI * p) },
    { dur: flightMs, g: () => 0.03 },
    { dur: 120, g: (p) => 1 + 3.2 * Math.sin(Math.PI * p) },
    { dur: 600, g: (p) => 1 + 0.3 * Math.sin(3 * Math.PI * p) * (1 - p) },
  ];
  const out: Sample[] = [];
  let t = 0;
  let phaseStart = 0;
  for (const ph of phases) {
    while (t < phaseStart + ph.dur) {
      const p = (t - phaseStart) / ph.dur;
      const n = () => (rand() - 0.5) * 2 * noise;
      out.push({ t, x: n(), y: ph.g(p) + n(), z: n() });
      t += dt;
    }
    phaseStart += ph.dur;
  }
  return out;
}
