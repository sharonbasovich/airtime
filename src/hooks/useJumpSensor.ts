import { Accelerometer } from 'expo-sensors';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DetectorState, JumpDetector, Sample } from '../core/detector';
import { synthJumpTrace } from '../core/synth';

export type SensorSource = 'sensor' | 'simulated';

export type JumpSensor = {
  available: boolean | null;
  source: SensorSource | null;
  state: DetectorState | null;
  liveG: number;
  armSensor: () => void;
  simulate: (targetCm: number) => void;
  stop: () => void;
};

const SENSOR_INTERVAL_MS = 10;
const SIM_TICK_MS = 16;

/** Feeds either the real accelerometer or a labelled synthetic trace through the same JumpDetector. */
export function useJumpSensor(): JumpSensor {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [source, setSource] = useState<SensorSource | null>(null);
  const [state, setState] = useState<DetectorState | null>(null);
  const [liveG, setLiveG] = useState(1);
  const detector = useRef(new JumpDetector());
  const sub = useRef<{ remove: () => void } | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    Accelerometer.isAvailableAsync().then(setAvailable, () => setAvailable(false));
  }, []);

  const stop = useCallback(() => {
    sub.current?.remove();
    sub.current = null;
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => stop, [stop]);

  const feed = useCallback(
    (s: Sample) => {
      const next = detector.current.push(s);
      setLiveG(Math.sqrt(s.x * s.x + s.y * s.y + s.z * s.z));
      setState((prev) => (prev && prev.phase === next.phase && prev.result === next.result ? prev : { ...next }));
      if (next.phase === 'done' || next.phase === 'rejected') stop();
    },
    [stop],
  );

  const armSensor = useCallback(() => {
    stop();
    detector.current.reset();
    setSource('sensor');
    setState(detector.current.state);
    Accelerometer.setUpdateInterval(SENSOR_INTERVAL_MS);
    sub.current = Accelerometer.addListener((m) => feed({ t: m.timestamp * 1000, x: m.x, y: m.y, z: m.z }));
  }, [feed, stop]);

  const simulate = useCallback(
    (targetCm: number) => {
      stop();
      detector.current.reset();
      setSource('simulated');
      setState(detector.current.state);
      const trace = synthJumpTrace(targetCm, { seed: Math.floor(Math.random() * 1e6), noiseG: 0.03 });
      const t0 = trace[0].t;
      const start = Date.now();
      let i = 0;
      timer.current = setInterval(() => {
        const elapsed = Date.now() - start;
        while (i < trace.length && trace[i].t - t0 <= elapsed) feed(trace[i++]);
        if (i >= trace.length) stop();
      }, SIM_TICK_MS);
    },
    [feed, stop],
  );

  return { available, source, state, liveG, armSensor, simulate, stop };
}
