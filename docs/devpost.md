# Devpost submission kit: Airtime (Shipaton 2026, Next Gen)

## Eligibility checklist (Next Gen)
- [ ] Register and submit with a verifiable academic email: **sbasovic@uwaterloo.ca** (University of Waterloo, CS, class of 2028). The official FAQ requires a verifiable academic email for student eligibility.
- [ ] Public open-source repo URL (this repo, MIT).
- [ ] Demo video (public YouTube/Vimeo, under ~2 min recommended), showing the RevenueCat purchase flow.
- [ ] No store launch required for Next Gen.
- [ ] Deadline: **Sep 30, 2026 11:45 pm PDT / Oct 1, 2:45 am EDT**. Aim to submit by 9 pm PDT.
- [ ] Confirm the submission shows "Submitted" on Devpost. Do not assume it's done until the platform confirms it.

## Tagline
The 10-second daily readiness jump: your phone tells you whether to go hard, go easy, or rest.

## Inspiration
Every coach knows the countermovement jump is one of the quickest checks of whether an athlete is fresh or fried. Measuring it has usually meant a force plate, contact mat, or filming at 240 fps and counting frames. We wanted it to take one person, one phone, and ten seconds.

## What it does
Hold your phone to your chest and jump three times. Airtime times each flight with the accelerometer (take-off = free fall, landing = impact), converts it to height, and compares today with **your own** 3–7-day baseline. If the drop is larger than your normal day-to-day wobble, you get **EASY** or **REST**. Otherwise you get **GO**.
Free: unlimited single jumps and **Jump-Off**, a pass-the-phone leaderboard for teams and parties.
**Airtime Pro** unlocks the daily call, noise-aware thresholds and the baseline trend.

## How we built it
Expo SDK 57 + React Native 0.86 + TypeScript, Expo Router, `expo-sensors` at 100 Hz, and `expo-haptics` for a "JUMP!" buzz.
The core is pure and unit-tested (20 tests): a streaming detector state machine with sub-sample edge interpolation and rejection rules, flight-time physics, and a readiness model whose threshold is the athlete's own coefficient of variation.
**RevenueCat** (`react-native-purchases` 10.10): Test Store, a `pro` entitlement, and a `default` Offering whose packages and metadata drive the paywall. The purchase goes through `purchasePackage`, the `CustomerInfo` listener unlocks Pro live, and restore works. An in-app **RevenueCat panel** shows the live entitlement state and an SDK event log.
The paywall appears the moment your baseline is complete. That's when the value is real and the locked call is one tap away.
Emulator-safe: "Sim · fresh / tired" streams a synthetic accelerometer trace through the same detector, always labelled SIMULATED.

## Challenges
Phone-sensor jump height has real absolute error. We credit My Jump / My Jump Lab, the validated video-based app, and chose not to compete on centimetres. Airtime's decision is relative to you, and only changes larger than your own noise count.

## Accomplishments
A working detector, an honest readiness model, and a monetization moment that follows the product's value instead of an arbitrary limit.

## What's next
Our own validation study (repeatability ICC, Bland-Altman against 240 fps video), team dashboards for coaches (a RevenueCat web purchase), and Apple Watch/Wear OS capture.

## Built with
expo, react-native, typescript, expo-router, expo-sensors, revenuecat, react-native-purchases, jest

---

## Demo video script (≈100 s, hook first)
| t | Shot | VO / on-screen |
| --- | --- | --- |
| 0–8 | Two friends, one phone. "Jump-Off!" Pass the phone, jump, leaderboard pops: **41.2 vs 38.7 cm**. | "One phone. No camera. Who's got more airtime?" |
| 8–18 | Morning, solo. Phone to chest, stand still, haptic buzz, "JUMP!" | "But the real trick is what it tells *you*, every morning." |
| 18–30 | Day 3: baseline completes → paywall slides up ("Your baseline is ready"). | "After three mornings Airtime knows your normal." |
| 30–45 | Tap annual → **Test Store** sheet → Success. Back on Today: **GO +1.2 %** unlocks. | "Purchase through RevenueCat…" |
| 45–55 | Open the RevenueCat panel: `entitlements.active.pro = ACTIVE`, event log `purchasePackage → CustomerInfo listener`. Cut to the RC dashboard transaction. | "…entitlement live, straight from CustomerInfo." |
| 55–75 | Next day, after leg day: jump, **REST −11 %**, "Your noise is ±1.6 %, so this is real." | "It only calls a drop bigger than your own day-to-day noise." |
| 75–90 | Honesty card: "Estimate, not a lab. Validation protocol in the repo." Show the tests passing. | "We publish our method and limits." |
| 90–100 | Logo + "Airtime: the 10-second daily readiness jump." | |

Film sensor jumps on a real phone. If you show emulator footage, keep the SIMULATED tag visible.
