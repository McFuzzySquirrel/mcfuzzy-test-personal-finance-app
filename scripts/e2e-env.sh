#!/usr/bin/env bash
set -euo pipefail

resolve_java_home() {
  local candidate=""

  if [[ -n "${JAVA_HOME:-}" && -x "${JAVA_HOME}/bin/java" ]]; then
    echo "$JAVA_HOME"
    return 0
  fi

  for candidate in \
    /usr/lib/jvm/java-17-openjdk-amd64 \
    /usr/lib/jvm/temurin-17-jdk-amd64 \
    /usr/lib/jvm/temurin-17-jdk \
    /usr/lib/jvm/java-17-openjdk \
    /Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home
  do
    if [[ -x "$candidate/bin/java" ]]; then
      echo "$candidate"
      return 0
    fi
  done

  if command -v update-alternatives >/dev/null 2>&1; then
    while IFS= read -r candidate; do
      if [[ "$candidate" == *java-17* || "$candidate" == *temurin-17* || "$candidate" == *jdk-17* ]]; then
        echo "$(dirname "$(dirname "$candidate")")"
        return 0
      fi
    done < <(update-alternatives --list java 2>/dev/null || true)
  fi

  if command -v java >/dev/null 2>&1; then
    echo "$(dirname "$(dirname "$(readlink -f "$(command -v java)")")")"
    return 0
  fi

  return 1
}

export JAVA_HOME="$(resolve_java_home)"

echo "Using JAVA_HOME=$JAVA_HOME"

JAVA_MAJOR="$($JAVA_HOME/bin/java -version 2>&1 | sed -n 's/.*version "\([0-9][0-9]*\).*/\1/p' | head -n1)"

if [[ -z "$JAVA_MAJOR" ]]; then
  echo "Unable to determine Java version from JAVA_HOME=$JAVA_HOME" >&2
  exit 1
fi

if [[ "$JAVA_MAJOR" -ne 17 ]]; then
  echo "Detox Android commands require JDK 17 for this project." >&2
  echo "Current JAVA_HOME points to Java $JAVA_MAJOR: $JAVA_HOME" >&2
  echo "Install JDK 17 and set JAVA_HOME, e.g.:" >&2
  echo "  export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64" >&2
  exit 1
fi
