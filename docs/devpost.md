# Devpost submission kit: Airtime (Shipaton 2026, Next Gen)

Status note (2026-09-27): the Test Store purchase is **done and verified** — on-device `entitlements.active.pro` = ACTIVE with `isSandbox` = true, and the transaction appears in the RevenueCat dashboard customer profile. Anything below describing an unverified/demo purchase is obsolete; this file replaces it.

## Eligibility checklist (Next Gen). Full version: docs/eligibility.md
- [ ] Register and submit with a verifiable academic email: **sbasovic@uwaterloo.ca** (University of Waterloo, CS, class of 2028).
- [x] Public open-source repo (this repo, MIT).
- [ ] Demo video (public YouTube/Vimeo, ≤ 2 min): `airtime-demo-v2.mp4` (1:00) shows the genuine Test Store purchase — in this repo's draft GitHub release, ready for entrant upload.
- [x] No store launch required for Next Gen.
- [ ] Deadline: **Sep 30, 2026 11:45 pm PDT / Oct 1, 2:45 am EDT**. Aim to submit by 9 pm PDT.
- [ ] Confirm the submission shows "Submitted" on Devpost.

## Tagline
The 10-second daily readiness jump: your phone tells you whether to go hard, go easy, or rest.

## Story (paste-ready)

### The hook
Two friends, one phone, no camera: who has more airtime today? Hold it to your chest, jump, land — the app times your flight from the accelerometer alone. But the real trick is what it tells *you* every morning: go hard, go easy, or rest.

### What it does
Hold your phone to your chest and jump three times. Airtime times each flight with the accelerometer (take-off = free fall, landing = impact), converts it to height, and compares today with **your own** 3–7-day baseline. If the drop is larger than your normal day-to-day wobble, you get **EASY** or **REST**; otherwise **GO**.

Free: unlimited single jumps and **Jump-Off**, a pass-the-phone leaderboard for teams and parties.

**Airtime Pro** unlocks the daily call, noise-aware thresholds, and the baseline trend — the paywall appears the moment your 3-day baseline completes, when the value is real and the locked call is one tap away.

### How we built it
Expo SDK 57 + React Native 0.86 + TypeScript, Expo Router, `expo-sensors` at 100 Hz, `expo-haptics` for the "JUMP!" buzz.

The core is pure TypeScript, unit-tested (32 tests): a streaming, orientation-independent detector state machine that requires a push-off before free fall (a dropped phone doesn't count), uses symmetric interpolated take-off/landing edges, and rejects sensor gaps and a phone sliding mid-air. Around it: flight-time physics, and a readiness model whose threshold is the athlete's own coefficient of variation.

**RevenueCat** (`react-native-purchases` 10.10): a `pro` entitlement and a `default` Offering whose packages drive the paywall — product names and prices render from the dashboard, and Offering metadata (headline/subhead) is supported so paywall copy can change without a release. Purchase goes through `purchasePackage`, a `CustomerInfo` listener unlocks Pro live, and restore works. An in-app **RevenueCat panel** shows the live entitlement state and an SDK event log for judges.

### What is real, and what is simulated — stated plainly
- **Real:** the RevenueCat integration is genuine. In the video you see the app's paywall render the live `default` Offering (annual $19.99, monthly $2.99 — configured in the dashboard), the native **Test Store** purchase sheet for `airtime_pro_annual`, and the in-app panel flipping `entitlements.active.pro` to **ACTIVE** with `isSandbox = true`. The same transaction is visible in the RevenueCat dashboard customer profile. It is a **sandbox Test Store purchase — no real money moves and nothing is published to a store**, which is exactly what Next Gen requires.
- **Simulated (and labelled as such):** the jumps in the video are emulator-safe. "Sim · fresh / tired" buttons stream a synthetic accelerometer trace through the *same* production detector, always tagged SIMULATED in-app and captioned in the video.
- With no API key configured, the app falls back to a clearly labelled **DEMO adapter** (nothing charged or recorded) — the no-key build in the repo still demos cleanly, but the submitted video uses the real SDK path.

### Challenges
Phone-sensor jump height has real absolute error. We credit My Jump / My Jump Lab, the validated video-based app, and chose not to compete on centimetres: Airtime's call is relative to you, and only changes larger than your own noise count.

### Accomplishments
A working, unit-tested detector; an honest readiness model; and a monetization moment that follows the product's value instead of an arbitrary limit — verified end-to-end against a real RevenueCat project, not a mock.

### What we learned
The hard part wasn't measuring a jump — it was deciding when *not* to trust one. Most of the detector code is rejection logic. And building the paywall around a real SDK moment (entitlement flipping the locked call live) beats a static paywall screen.

### What's next
Our own validation study (repeatability ICC, Bland–Altman against 240 fps video), team dashboards for coaches (a RevenueCat web purchase), and Apple Watch/Wear OS capture.

### Built with
expo, react-native, typescript, expo-router, expo-sensors, revenuecat, react-native-purchases, jest

### AI disclosure (accurate)
Airtime was designed and implemented with AI coding agents (Cognition Devin sessions): one agent session wrote the app, and independent sessions reviewed, tested, packaged, and verified the store integration. Humans scoped the product, the monetization design, the honesty/labelling requirements, and reviewed the result. All validation claims in the repo are limited to what the code actually does — unit tests, emulator runs, and one verified sandbox purchase; no on-human accuracy claims are made.

### Known limitations (say this, don't hide it)
- Flight-time height is an **estimate**, not a lab measurement; the app acts on relative change vs your own noise only.
- All jump tests are synthetic traces; no real-phone sensor recordings yet (real-device test on a Pixel 6a is the next step).
- The purchase shown is the RevenueCat **Test Store** — sandbox, no real revenue, no store listing — which Next Gen permits.
- Test Store keys only run in debuggable builds; the demo video uses a debug dev build for that reason.

## Video (what `airtime-demo-v2.mp4` shows, 1:00)
Fresh install → 7-day baseline loads → SIMULATED-tagged jump → paywall rendering the live `default` Offering → native Test Store purchase sheet (`airtime_pro_annual`, $19.99, P1Y) → `pro` entitlement flips ACTIVE, the daily GO call unlocks → in-app RevenueCat panel (`isSandbox=true`, event log: `configure → getOfferings → purchasePackage → CustomerInfo pro=true`). Captions label the purchase as a sandbox Test Store purchase throughout.

## Screenshots for the submission (all 1179×2556, no device frame, real app screens)
| File | Shows | Honest caption to use |
| --- | --- | --- |
| `docs/screenshots/11-rc-paywall-teststore.png` | Paywall rendering the live Offering (REVENUECAT badge, real prices) | "Paywall packages served live from the RevenueCat dashboard" |
| `docs/screenshots/11-rc-purchase-teststore.png` | Native Test Store purchase sheet, `airtime_pro_annual` $19.99 P1Y | "Sandbox Test Store purchase — no real charge" |
| `docs/screenshots/11-rc-panel2-teststore.png` | In-app panel: `pro` ACTIVE, `isSandbox` true, SDK event log | "Entitlement verified in-app: pro ACTIVE, isSandbox=true" |
| `docs/screenshots/11-rc-after-teststore.png` | Today screen unlocked to PRO with GO call | "Purchase → entitlement → unlocked daily call" |
| `docs/screenshots/submit-today-pro-1179x2556.png` | PRO Today screen, GO call, SIMULATED-tagged jumps (DEMO-adapter build) | "Today's call vs your own baseline (jumps SIMULATED on emulator)" |

Best single proof-of-purchase shot: `11-rc-panel2-teststore.png` — it shows ACTIVE + sandbox + the full event log in one frame. Pair it with `11-rc-purchase-teststore.png` (the sheet itself). Only pick `submit-paywall-1179x2556.png` if you want a clean paywall beauty shot — it carries the honest "DEMO MODE · NO RC KEY" banner from the no-key build, which is accurate but less impressive than the real-offering screenshot.

## Do NOT
- Don't describe the purchase as real revenue or a live store transaction — say "RevenueCat Test Store (sandbox)".
- Don't commit the `test_…` API key or any `.env`; it lives only in the local build environment.
- Don't press Submit or accept terms until Sharon confirms at submission time.
