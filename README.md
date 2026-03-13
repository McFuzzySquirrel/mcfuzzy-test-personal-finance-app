# Student Finance App

Phase 1 foundation scaffold for the student personal finance app.

## Stack

- Expo SDK `55.0.6`
- React Native + TypeScript (strict mode)
- React Navigation v7 (bottom tabs + native stack)
- SQLite via `expo-sqlite` v2

## Project Structure

```text
app/
components/
db/
hooks/
store/
utils/
types/
__tests__/
e2e/
```

## Setup

```bash
npm install
```

## Run

```bash
npm run start
npm run android
```

## Quality Checks

```bash
npm run lint
npm run typecheck
npm run test
```

## E2E

Detox Android baseline is configured with an API 35 emulator target.

Prerequisites:

- Android SDK and platform tools installed
- One Android AVD created (API 35 recommended)
- `adb` available in your `PATH`
- Java installed (`JDK 17` required for local Detox Android build)

Optional AVD override:

```bash
export DETOX_AVD_NAME=detox-api35
```

Build app + androidTest artifacts:

```bash
npm run e2e:build:android
```

The E2E scripts source `scripts/e2e-env.sh`, which attempts to discover JDK 17 from common install paths and `update-alternatives`.
If JDK 17 cannot be found, the scripts fail fast with instructions to set `JAVA_HOME`.

Run Detox tests against emulator:

```bash
npm run e2e:test:android
```

Test artifacts (logs/screenshots/videos on failures) are written to:

```bash
artifacts/detox
```

One-shot build + test:

```bash
npm run e2e:android
```
