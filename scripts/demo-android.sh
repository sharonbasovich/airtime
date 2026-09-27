#!/usr/bin/env bash
# Reproducible golden-path demo on a running Android emulator/device (release or dev build installed).
# Uses only simulated traces + the DEMO purchase adapter unless the build has EXPO_PUBLIC_REVENUECAT_API_KEY.
# Usage: ANDROID_HOME=~/Android/Sdk scripts/demo-android.sh [screenshot-dir]
set -euo pipefail
cd "$(dirname "$0")/.."
OUT="${1:-docs/screenshots}"
ADB="${ANDROID_HOME:-$HOME/Android/Sdk}/platform-tools/adb"
UI="python3 scripts/adbui.py"
mkdir -p "$OUT"
"$ADB" shell pm clear dev.airtime.jump >/dev/null
"$ADB" shell monkey -p dev.airtime.jump -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1
sleep 5
$UI shot:"$OUT/01-today-new.png"
# Jump-Off (free): two simulated players
$UI "tap:Jump-Off" sleep:1 "tap:jumpoff-name" type:Sharon back sleep:0.7 "tap:Sim · fresh" sleep:4.5 "tap:jumpoff-name"
"$ADB" shell input keyevent 123; for _ in 1 2 3 4 5 6; do "$ADB" shell input keyevent 67; done
$UI type:Alex back sleep:0.7 "tap:Sim · tired" sleep:4.5 shot:"$OUT/09-jumpoff-leaderboard.png" back sleep:1
# Baseline -> paywall at the moment of value -> purchase -> Pro call
$UI "tap:Load 7 days" sleep:1 shot:"$OUT/02-baseline-ready-locked.png" \
    "tap:Today’s jump" sleep:1 "tap:Sim · fresh" sleep:1.2 shot:"$OUT/03-jump-live.png" sleep:3 \
    shot:"$OUT/04-paywall-at-baseline.png" "tap:Start Pro" sleep:1 shot:"$OUT/05-purchase-sheet.png" \
    "tap:SUCCESS" sleep:1.5 shot:"$OUT/06-jump-result.png" \
    "tap:Sim · fresh" sleep:4 "tap:Sim · fresh" sleep:4 back sleep:1.5 shot:"$OUT/07-today-pro-call.png" \
    "tap:PRO" sleep:1.5 shot:"$OUT/08-revenuecat-panel.png" back sleep:1
# Tired day -> REST
"$ADB" shell input swipe 540 1800 540 400 300; sleep 1
$UI "tap:Reset" sleep:0.5 "tap:Load 7 days" sleep:1
"$ADB" shell input swipe 540 600 540 2000 300
$UI sleep:1 "tap:Today’s jump" sleep:1 "tap:Sim · tired" sleep:4 "tap:Sim · tired" sleep:4 "tap:Sim · tired" sleep:4 \
    back sleep:1.5 shot:"$OUT/10-today-pro-rest.png"
echo "Screenshots in $OUT"
