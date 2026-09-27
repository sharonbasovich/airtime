# Merging this independent build into the parallel Airtime repo

This repo was built separately because the other Airtime build (Devin session 31b87a91…) and its repository were not accessible (session HTTP 403, and no public GitHub repo). Nothing in that work was touched.

## Pieces and where they go
| Module | Depends on | Drop-in? |
| --- | --- | --- |
| `src/core/*` + `src/core/__tests__/*` | nothing (pure TS) | Yes. Copy the folder and add `jest` + `babel-preset-expo` + `jest.config.js` + `babel.config.js`. |
| `src/purchases/*` | `react-native-purchases` ≥ 9.5.4, `react-native` | Yes. Wrap your root in `<PurchasesProvider>` and gate with `usePurchases().isPro`. |
| `src/hooks/useJumpSensor.ts`, `src/ui/JumpMeasure.tsx` | `expo-sensors`, `expo-haptics` | Yes. Replaces or augments your detector. |
| `src/state/RecordsProvider.tsx` | `@react-native-async-storage/async-storage` | Optional. Keep your own storage if you have it; records must match `JumpRecord`. |
| `src/app/*` | Expo Router | Reference screens. Merge by hand into your navigation. |

## Steps (target repo = `../airtime-main`)
```bash
# 1. branch in the target repo
cd ../airtime-main && git checkout -b merge/independent-airtime
# 2. bring this repo in as a remote and pull history into a subfolder, or copy directly
git remote add indep ../airtime   # or the bundle: git remote add indep /path/airtime.bundle
git fetch indep
git checkout indep/master -- src/core src/purchases src/hooks/useJumpSensor.ts src/ui docs jest.config.js babel.config.js
# 3. deps (SDK-matched)
npx expo install react-native-purchases expo-sensors expo-haptics @react-native-async-storage/async-storage
npx expo install babel-preset-expo jest @types/jest -- -D
# 4. add "types": ["jest"] to tsconfig compilerOptions, then:
npx jest && npx tsc --noEmit && npx expo lint
```
Conflicts to decide by hand: whichever detector thresholds were tuned on a real phone (keep the real-device-tuned values, and rerun `detector.test.ts` against recorded traces), paywall styling, and the entitlement ID (this repo uses `pro`).

## Publish to https://github.com/sharonbasovich/airtime (empty repo), from a GitHub-connected machine
```bash
git clone airtime.bundle airtime && cd airtime
git remote set-url origin https://github.com/sharonbasovich/airtime.git
git push -u origin master:main
git bundle verify ../airtime.bundle   # optional integrity check
```
The bundle contains the full history on branch `master` (pushed as `main`). No secrets are in it: the RevenueCat key is read from `EXPO_PUBLIC_REVENUECAT_API_KEY` at build time.
