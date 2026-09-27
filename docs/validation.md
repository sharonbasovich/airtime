# Validation: what Airtime measures and how sure we are

## Method
Flight-time method: `h = g·t²/8`. The detector (`src/core/detector.ts`) works on acceleration **magnitude**, so it doesn't matter which way the phone is rotated on the chest.
1. **Armed:** magnitude SD ≤ 0.08 g over 400 ms (standing still).
2. **Take-off:** the downward crossing of 0.35 g that starts a run below 0.35 g lasting at least 60 ms. The run is accepted only if a **push-off peak ≥ 1.25 g** occurred in the 700 ms before it. A phone dropped from still hands has no push-off, so it is rejected.
3. **Landing:** the last *upward* crossing of the same 0.35 g level before the impact threshold (1.4 g) is hit. Using one level for both edges keeps the threshold bias symmetric: on synthetic traces the mean flight-time bias is under 3 ms, down from about 8 ms with a separate impact-level edge.
4. **Accept** only if the flight lasts 150–1000 ms and the mean magnitude in flight is ≤ 0.45 g (otherwise the phone was sliding on the body). Any sensor gap over 40 ms in flight rejects the jump instead of guessing across it. Duplicate or out-of-order timestamps are dropped.
5. **Quality readout:** each result reports push peak (g), mean flight g, and effective sample rate (Hz), and the jump screen shows them.

## Known error sources (why we lead with *relative* change)
- **Handheld motion:** the phone moves relative to the body's centre of mass. Studies of handheld/phone-sensor jump estimation report substantial absolute bias (for example, Frontiers in Sports and Active Living, 2023).
- **Landing posture:** bent knees on landing lengthen the flight and inflate the height. The protocol asks for straight-leg landings.
- **Sampling:** at 100 Hz each edge is quantised to 10 ms. Interpolation reduces this. On synthetic traces height is recovered within ±1.5 cm at 100 Hz (mean abs error < 1 cm over 30 noisy seeds), within ±1 cm at 200 Hz, and within ±3 cm at 50 Hz with heavier noise.
- **OS jitter:** timestamps come from the sensor event (`timestamp`), not from JS receive time.

The same person using the same phone and protocol repeats most of these biases every day, so **day-to-day relative change** is the useful signal (inference; this is exactly what the protocol below tests). Airtime only acts on a change larger than the athlete's own observed day-to-day coefficient of variation (floored at 3 %). A noisy athlete therefore doesn't get false "rest" calls.

## Unit-tested (this repo)
`npm test`: 32 tests. They cover synthetic traces at 15–60 cm and 50/100/200 Hz, 30-seed accuracy, 5 cm fatigue-drop discrimination, arbitrary phone orientation, ±3 ms timestamp jitter, duplicate/out-of-order samples, and mid-flight sensor gaps. They also cover false positives (dropped phone, walking, brief near-0 g blips, phone sliding mid-air) and other rejection paths, the baseline gate, the first-3-jumps cap, go/easy/rest boundaries, noise-scaled thresholds, the 7-day window, and leaderboard ties.

All of these are **synthetic**. No real-phone traces have been recorded yet.

## Not yet validated (to do before any accuracy claim)
1. **Repeatability:** 10 subjects × 3 jumps × 5 days, on one phone. Report the ICC and the typical error (CV %).
2. **Concurrent validity:** the same jumps filmed at 240 fps (My Jump-style frame counting) or on a force plate. Report the Bland-Altman bias and limits of agreement.
3. **Fatigue sensitivity:** jumps before and after a standard fatigue protocol, checking whether the call moves in the expected direction.

Until then the app says "estimate" and makes relative calls only. It is not a medical device.
