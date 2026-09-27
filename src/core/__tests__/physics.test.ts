import { flightTimeFromHeightCm, heightCmFromFlightTime } from '../physics';

test('h = g t^2 / 8', () => {
  expect(heightCmFromFlightTime(0.5)).toBeCloseTo(30.65, 1);
  expect(heightCmFromFlightTime(0)).toBe(0);
});

test('inverse round-trips', () => {
  for (const h of [10, 25, 40, 60]) expect(heightCmFromFlightTime(flightTimeFromHeightCm(h))).toBeCloseTo(h, 6);
});
