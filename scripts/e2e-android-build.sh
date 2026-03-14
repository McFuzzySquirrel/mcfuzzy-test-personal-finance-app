#!/usr/bin/env bash
set -euo pipefail

. "$(dirname "$0")/e2e-env.sh"
. "$(dirname "$0")/e2e-android-sdk.sh"

if [[ ! -d android ]]; then
	CI=1 npx expo prebuild --platform android
fi

perl -0pi -e 's#gradle-(9\.0\.0|8\.10\.2)-bin\.zip#gradle-8.13-bin.zip#g' android/gradle/wrapper/gradle-wrapper.properties

# Stop stale Gradle daemons so a fresh daemon inherits the current PATH (nvm node).
(cd android && ./gradlew --stop 2>/dev/null || true)

detox build -c android.emu.debug
