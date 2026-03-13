# Student Finance App

A local-first React Native app for students to track spending, set category budgets, view insights, manage split/debt entries, and export monthly reports.

## Highlights

- Fast expense entry flow with category grid and optional notes
- Monthly dashboard: spent, remaining, top category, budget progress
- Insights: category pie chart, monthly trend, weekly summary
- Student features: split expenses, lent/borrowed tracking, recurring entries
- Export: CSV and PDF with native share sheet integration
- Offline by default with SQLite (`expo-sqlite`)

## Tech Stack

- Expo SDK `55.0.6`
- React Native + TypeScript (strict)
- React Navigation v7 (tabs + stack)
- SQLite via `expo-sqlite` v2
- Charts via `react-native-gifted-charts`
- Jest for unit/integration tests
- Detox for Android E2E baseline

## Project Layout

```text
app/           # screens and navigation
components/    # reusable UI components
db/            # schema, migrations, query helpers, seeds
hooks/         # feature hooks over db layer
store/         # providers (DatabaseProvider)
utils/         # formatting/export helpers
types/         # shared domain types
__tests__/     # jest tests
e2e/           # Detox tests/config
scripts/       # setup, doctor, e2e helper scripts
```

## Quick Start

```bash
npm install
npm run start
```

Run app targets:

```bash
npm run android
npm run ios
npm run web
```

## Quality Gates

```bash
npm run typecheck
npm run lint
npm run test
```

## Android E2E (Detox)

> [!IMPORTANT]
> Local Android E2E requires Java 21 and Android SDK tooling.

Prerequisites:

- Java 21 installed
- Android SDK installed
- `adb`, `emulator`, and `avdmanager` available in `PATH`
- Android AVD created (API 35 recommended)

Run environment diagnostics first:

```bash
npm run e2e:doctor
```

Build Android app/test artifacts:

```bash
npm run e2e:build:android
```

Run Detox tests:

```bash
npm run e2e:test:android
```

One-shot E2E flow:

```bash
npm run e2e:android
```

Optional AVD override:

```bash
export DETOX_AVD_NAME=detox-api35
```

Artifacts (logs/videos/screenshots on failure):

```bash
artifacts/detox
```

### E2E Script Behavior

- `scripts/e2e-env.sh` validates Java 21 and resolves `JAVA_HOME`
- `scripts/e2e-android-sdk.sh` resolves Android SDK path and writes `android/local.properties`
- `scripts/e2e-android-build.sh` patches generated Gradle wrapper to `8.13` for Java 21 compatibility in current Expo/RN Android flow

## Current Status

- Core app features from the PRD are implemented through dashboard, insights, student features, and export flows
- Unit/integration test baseline is active and passing
- Detox baseline is integrated in CI; local execution depends on machine SDK/emulator setup

## Useful Docs

- PRD: `docs/prd/student-finance-app-prd.md`
- Research source: `docs/research/student_finance_app_project.md`
- Accessibility checklist: `docs/accessibility-checklist.md`
- ADR: `ejs-docs/adr/0001-java21-gradle813-detox-toolchain.md`
