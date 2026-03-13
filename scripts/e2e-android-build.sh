#!/usr/bin/env bash
set -euo pipefail

DEFAULT_JDK17="/usr/lib/jvm/java-17-openjdk-amd64"

if [[ -z "${JAVA_HOME:-}" ]]; then
  if [[ -d "$DEFAULT_JDK17" ]]; then
    export JAVA_HOME="$DEFAULT_JDK17"
  else
    export JAVA_HOME="$(dirname "$(dirname "$(readlink -f "$(command -v java)")")")"
  fi
fi

echo "Using JAVA_HOME=$JAVA_HOME"

JAVA_MAJOR="$($JAVA_HOME/bin/java -version 2>&1 | sed -n 's/.*version "\([0-9][0-9]*\).*/\1/p' | head -n1)"

if [[ -z "$JAVA_MAJOR" ]]; then
  echo "Unable to determine Java version from JAVA_HOME=$JAVA_HOME" >&2
  exit 1
fi

if [[ "$JAVA_MAJOR" -ne 17 ]]; then
  echo "Detox Android build requires JDK 17 for this project." >&2
  echo "Current JAVA_HOME points to Java $JAVA_MAJOR: $JAVA_HOME" >&2
  echo "Install JDK 17 and set JAVA_HOME, e.g.:" >&2
  echo "  export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64" >&2
  exit 1
fi

detox build -c android.emu.debug
