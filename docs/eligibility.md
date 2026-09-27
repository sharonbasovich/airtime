# Shipaton 2026: Next Gen eligibility & submission checklist

Source: the official Shipaton 2026 rules and FAQ on Devpost (revenuecat-shipaton-2026.devpost.com, Rules and FAQ pages). Re-read them before submitting; this file is a summary, not the rules.

## Entrant (fill in / confirm on Devpost)
| Item | Value | Status |
| --- | --- | --- |
| Name | Sharon Basovich | provided by entrant |
| School / program | University of Waterloo, Computer Science | provided by entrant |
| Expected graduation | 2028 | provided by entrant |
| Age | 18 | provided by entrant (check the rules' minimum-age clause) |
| Academic email | sbasovic@uwaterloo.ca | **must** be the email used / verified for Next Gen |

## Next Gen requirements vs this repo
| Requirement (summarised) | Evidence | Status |
| --- | --- | --- |
| Currently enrolled student with a verifiable academic email | sbasovic@uwaterloo.ca | entrant to confirm on Devpost |
| New work per the rules' submission-period clause (verify wording) | git history of this repo (first commit Sep 2026) | entrant to confirm |
| Meaningful RevenueCat SDK use | `react-native-purchases` 10.10: configure, getOfferings, purchasePackage, CustomerInfo listener, restore; `pro` entitlement gates the daily call (`src/purchases/`) | **done** — genuine Test Store purchase verified 2026-09-27 (see below) |
| Public open-source repository | https://github.com/sharonbasovich/airtime (public, MIT detected, `main` @ ae6a945) | done — fresh clone verified: 32/32 tests, lint, tsc, expo-doctor 21/21 |
| App icon 1024×1024 | `assets/icon.png` | done — verified 1024×1024 |
| Screenshot 1179×2556, no device frame | `docs/screenshots/submit-today-pro-1179x2556.png`, `docs/screenshots/submit-paywall-1179x2556.png` | done — raw `adb screencap` at override size 1179×2556 (no frame, no scaling); other docs images are 1080×2400 |
| Demo video (public link) | re-recorded on the debug build: real Test Store purchase (`$rc_annual`), sandbox-labelled throughout; in repo draft release as `airtime-demo-v2.mp4` (1:00, SHA-256 `12a0960d…ee9b`) | needs upload to YouTube/Vimeo by entrant |
| Store launch | not required for Next Gen | n/a |
| Deadline | Sep 30, 2026 11:45 pm PDT = Oct 1, 2:45 am EDT | aim for 9 pm PDT |

## Before pressing Submit
1. Push the bundle (see `docs/MERGE.md` → "Publish"), make the repo public, and check the README renders.
2. Done: the video shows the genuine Test Store purchase (sandbox-labelled). Keep the wording "Test Store / sandbox" — never imply a real store purchase.
3. Upload the video (YouTube/Vimeo, public or unlisted as the rules allow) and paste the link.
4. Select the **Next Gen** category and use the academic email.
5. Only treat it as done when Devpost shows the project as submitted.
