#!/usr/bin/env bash
set -euo pipefail

. "$(dirname "$0")/e2e-env.sh"

detox build -c android.emu.debug
