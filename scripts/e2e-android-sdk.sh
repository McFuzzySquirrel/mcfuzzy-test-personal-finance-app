#!/usr/bin/env bash
set -euo pipefail

resolve_android_sdk() {
  local candidate=""

  if [[ -n "${ANDROID_HOME:-}" && -d "${ANDROID_HOME}" ]]; then
    echo "$ANDROID_HOME"
    return 0
  fi

  if [[ -n "${ANDROID_SDK_ROOT:-}" && -d "${ANDROID_SDK_ROOT}" ]]; then
    echo "$ANDROID_SDK_ROOT"
    return 0
  fi

  for candidate in \
    "$HOME/Android/Sdk" \
    "$HOME/Android/sdk" \
    /opt/android-sdk \
    /usr/lib/android-sdk \
    /usr/local/android-sdk
  do
    if [[ -d "$candidate" ]]; then
      echo "$candidate"
      return 0
    fi
  done

  return 1
}

ANDROID_SDK_DIR="$(resolve_android_sdk || true)"

if [[ -z "$ANDROID_SDK_DIR" ]]; then
  echo "Android SDK not found." >&2
  echo "Set ANDROID_HOME or ANDROID_SDK_ROOT, or install the SDK in a standard location such as:" >&2
  echo "  $HOME/Android/Sdk" >&2
  echo "  /opt/android-sdk" >&2
  exit 1
fi

export ANDROID_HOME="$ANDROID_SDK_DIR"
export ANDROID_SDK_ROOT="$ANDROID_SDK_DIR"

echo "Using ANDROID_HOME=$ANDROID_HOME"

if [[ -d android ]]; then
  printf 'sdk.dir=%s\n' "$ANDROID_HOME" > android/local.properties
fi
