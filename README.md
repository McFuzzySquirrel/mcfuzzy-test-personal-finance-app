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

Optional AVD override:

```bash
export DETOX_AVD_NAME=detox-api35
```

Build app + androidTest artifacts:

```bash
npm run e2e:build:android
```

Run Detox tests against emulator:

```bash
npm run e2e:test:android
```

One-shot build + test:

```bash
npm run e2e:android
```
