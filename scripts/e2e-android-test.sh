#!/usr/bin/env bash
set -euo pipefail

detox test -c android.emu.debug \
  --headless \
  --cleanup \
  --record-logs all \
  --take-screenshots failing \
  --record-videos failing \
  --artifacts-location artifacts/detox
