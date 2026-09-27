# Validation: what Airtime measures and how sure we are

## Method
Flight-time method: `h = g·t²/8`, where `t` runs from take-off (the start of a sustained window below 0.35 g, at least 60 ms) to landing (the first crossing above 1.4 g after that). Both edges are linearly interpolated between samples. Accepted flights last 150–1000 ms. A jump is rejected if the phone wasn't still (SD ≤ 0.08 g over 400 ms) before take-off, if there is no landing impact (dropped phone), or if the flight is too short.

## Known error sources (why we lead with *relative* change)
- **Handheld motion:** the phone moves relative to the body's centre of mass. Studies of handheld/phone-sensor jump estimation report substantial absolute bias (for example, Frontiers in Sports and Active Living, 2023).
- **Landing posture:** bent knees on landing lengthen the flight and inflate the height. The protocol asks for straight-leg landings.
- **Sampling:** at 100 Hz each edge is quantised to 10 ms. Interpolation reduces this. Synthetic tests recover height within ±1.5 cm (±3 cm with noisier 50 Hz traces).
- **OS jitter:** timestamps come from the sensor event (`timestamp`), not from JS receive time.

The same person using the same phone and protocol repeats most of these biases every day, so **day-to-day relative change** is the useful signal (inference; this is exactly what the protocol below tests). Airtime only acts on a change larger than the athlete's own observed day-to-day coefficient of variation (floored at 3 %). A noisy athlete therefore doesn't get false "rest" calls.

## Unit-tested (this repo)
`npm test`: 20 tests covering synthetic traces at 15–60 cm and 50/100 Hz, rejection paths, the baseline gate, the first-3-jumps cap, go/easy/rest boundaries, noise-scaled thresholds, the 7-day window, and leaderboard ties.

## Not yet validated (to do before any accuracy claim)
1. **Repeatability:** 10 subjects × 3 jumps × 5 days, on one phone. Report the ICC and the typical error (CV %).
2. **Concurrent validity:** the same jumps filmed at 240 fps (My Jump-style frame counting) or on a force plate. Report the Bland-Altman bias and limits of agreement.
3. **Fatigue sensitivity:** jumps before and after a standard fatigue protocol, checking whether the call moves in the expected direction.

Until then the app says "estimate" and makes relative calls only. It is not a medical device.
