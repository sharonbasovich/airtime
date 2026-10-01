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
| Public open-source repository | https://github.com/sharonbasovich/airtime (public, MIT detected, `main` @ a25cacc) | done — fresh clone re-verified 2026-10-01: 32/32 tests, lint, tsc clean |
| App icon 1024×1024 | `assets/icon.png` | done — verified 1024×1024 |
| Screenshot 1179×2556, no device frame | `docs/screenshots/submit-today-pro-1179x2556.png`, `docs/screenshots/submit-paywall-1179x2556.png` | done — raw `adb screencap` at override size 1179×2556 (no frame, no scaling); other docs images are 1080×2400 |
| Demo video (public YouTube/Vimeo link) | Embedded YouTube cut on the entry (`Y5R_76PAS1s`, simulated jumps, sandbox-labelled) | done — satisfies the platform-video requirement. The genuine Test Store purchase video (`airtime-demo-v2.mp4`, 1:00, SHA-256 `12a0960d…ee9b`) is a supplemental link on the entry at https://video-nfhqrqwx.devinapps.com/index.html — verified live 2026-10-01, identical bytes. See the media note below |
| Store launch | not required for Next Gen | n/a |
| Deadline | **Oct 1, 2026 12:00 pm PDT = 19:00 UTC** (official rules page, extended) | submitted before deadline |

## Submission status (2026-10-01)
Submitted and verified live: https://devpost.com/software/airtime-xdt0ae

## Media note — which video does what
- **Required platform video:** the YouTube cut embedded on the Devpost entry (https://www.youtube.com/watch?v=Y5R_76PAS1s) — the earlier simulated cut. It fulfils the YouTube/Vimeo upload requirement.
- **Supplemental purchase proof:** `airtime-demo-v2.mp4`, hosted publicly at https://video-nfhqrqwx.devinapps.com/index.html (also committed at `docs/video/`). Verified 2026-10-01: the hosted file's SHA-256 is identical to the repo copy. This is the video that shows the genuine Test Store purchase.
- Keep the wording "Test Store / sandbox" — never imply a real store purchase or real revenue. All jumps are labelled SIMULATED synthetic traces; no physical/on-human validation is claimed anywhere.
