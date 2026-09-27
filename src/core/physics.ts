export const G = 9.80665;

/** Jump height (cm) from flight time (s), assuming take-off and landing in the same posture: h = g·t²/8. */
export function heightCmFromFlightTime(flightSeconds: number): number {
  return ((G * flightSeconds * flightSeconds) / 8) * 100;
}

/** Inverse of heightCmFromFlightTime. */
export function flightTimeFromHeightCm(heightCm: number): number {
  return Math.sqrt((8 * (heightCm / 100)) / G);
}
