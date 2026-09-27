# Monetization: Airtime Pro via RevenueCat

## Why this paywall
Measuring stays free, because that's the growth loop (Jump-Off is social and shareable). The paid value is the **decision**: "go easy today" is only possible once a personal baseline exists. So the paywall triggers *at the moment the 3-day baseline completes* (`src/app/jump.tsx`), when the user has invested three mornings and the locked call is sitting right there.

## Dashboard setup (Test Store, no store account needed)
1. RevenueCat → create project **Airtime** → Apps → **Test Store** app. Copy its public SDK key (`test_…`).
2. Products (Test Store): `airtime_pro_annual` ($19.99 / year) and `airtime_pro_monthly` ($2.99 / month).
3. Entitlement `pro`, with both products attached.
4. Offering `default` (set as current), with packages `$rc_annual` → annual and `$rc_monthly` → monthly.
   Optional metadata: `{"headline":"Your baseline is ready","subhead":"…"}`. The app renders it, so paywall copy can change without a release.
5. Build with `EXPO_PUBLIC_REVENUECAT_API_KEY=test_…` (via a local env var or an EAS secret; never committed).

## SDK moments shown in the demo
1. `Purchases.configure`, as a line in the in-app SDK event log.
2. `getOfferings`: packages and prices rendered from the dashboard.
3. `purchasePackage`, completed in the Test Store purchase sheet.
4. `CustomerInfo` → `entitlements.active.pro` flips to ACTIVE, the readiness call unlocks, and the listener fires.
5. `restorePurchases`.
6. Dashboard: the Test Store transaction and customer appear.

## Pricing rationale (inference)
$2.99/mo or $19.99/yr (44 % off), in line with consumer fitness utilities. Annual is shown first and marked "Best value". Next Gen requires no live store launch, so prices would be validated after launch.
