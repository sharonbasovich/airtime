import { detectTrace, JumpDetector } from '../detector';
import { synthJumpTrace } from '../synth';

describe('detectTrace on synthetic chest-held jumps', () => {
  test.each([15, 25, 35, 45, 60])('recovers %p cm within 1.5 cm at 100 Hz', (h) => {
    const st = detectTrace(synthJumpTrace(h, { seed: h }));
    expect(st.phase).toBe('done');
    expect(Math.abs((st.result?.heightCm ?? 0) - h)).toBeLessThan(1.5);
  });

  test('works at 50 Hz with more noise (within 3 cm)', () => {
    const st = detectTrace(synthJumpTrace(35, { hz: 50, noiseG: 0.05, seed: 7 }));
    expect(st.phase).toBe('done');
    expect(Math.abs((st.result?.heightCm ?? 0) - 35)).toBeLessThan(3);
  });

  test('ignores a jump that starts before the phone is still', () => {
    const st = detectTrace(synthJumpTrace(30, { stillMs: 100 }));
    expect(st.phase).not.toBe('done');
  });
});

describe('rejections', () => {
  const still = (n: number, t0 = 0) => Array.from({ length: n }, (_, i) => ({ t: t0 + i * 10, x: 0, y: 1, z: 0 }));

  test('phone dropped: free fall with no landing', () => {
    const samples = [...still(60), ...Array.from({ length: 150 }, (_, i) => ({ t: 600 + i * 10, x: 0, y: 0.02, z: 0 }))];
    expect(detectTrace(samples).phase).toBe('rejected');
  });

  test('tiny hop below plausible flight time', () => {
    const samples = [
      ...still(60),
      { t: 595, x: 0, y: 2, z: 0 },
      ...Array.from({ length: 10 }, (_, i) => ({ t: 600 + i * 10, x: 0, y: 0.05, z: 0 })),
      { t: 700, x: 0, y: 3, z: 0 },
    ];
    const st = detectTrace(samples);
    expect(st.phase).toBe('rejected');
    expect(st.reason).toMatch(/outside plausible range/);
  });

  test('reset returns to waiting', () => {
    const d = new JumpDetector();
    still(60).forEach((s) => d.push(s));
    expect(d.state.phase).toBe('ready');
    d.reset();
    expect(d.state.phase).toBe('waiting-still');
  });
});
