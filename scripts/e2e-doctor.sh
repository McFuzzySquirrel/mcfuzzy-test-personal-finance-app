#!/usr/bin/env bash
set -euo pipefail

status=0

echo "Detox Android environment doctor"
echo

if bash "$(dirname "$0")/e2e-env.sh" >/tmp/e2e-java-check.log 2>&1; then
  cat /tmp/e2e-java-check.log
else
  cat /tmp/e2e-java-check.log
  status=1
fi

echo

if bash "$(dirname "$0")/e2e-android-sdk.sh" >/tmp/e2e-sdk-check.log 2>&1; then
  cat /tmp/e2e-sdk-check.log
else
  cat /tmp/e2e-sdk-check.log
  status=1
fi

echo

if command -v adb >/dev/null 2>&1; then
  echo "adb found at: $(command -v adb)"
else
  echo "adb not found in PATH"
  status=1
fi

if command -v emulator >/dev/null 2>&1; then
  echo "emulator found at: $(command -v emulator)"
else
  echo "emulator not found in PATH"
  status=1
fi

if command -v avdmanager >/dev/null 2>&1; then
  echo "avdmanager found at: $(command -v avdmanager)"
else
  echo "avdmanager not found in PATH"
  status=1
fi

if [[ -n "${DETOX_AVD_NAME:-}" ]]; then
  echo "DETOX_AVD_NAME=${DETOX_AVD_NAME}"
else
  echo "DETOX_AVD_NAME not set; default emulator name is detox-api35"
fi

exit "$status"
