# 💰 Student Finance

A local-first mobile app that helps university students track daily spending, manage category budgets, and understand their financial habits — all in under 5 seconds per expense.

Built with React Native and Expo, powered by on-device SQLite. No account required, no cloud sync, fully offline.

[Overview](#overview) • [Features](#features) • [Getting started](#getting-started) • [Testing](#testing) • [Project structure](#project-structure) • [Architecture](#architecture)

## Overview

Student Finance is designed around one principle: **speed-first expense entry**. Students managing allowances or part-time income need a frictionless way to log spending without interrupting their day.

The app provides a category-based budgeting system with live progress indicators, visual spending insights via charts, and student-specific workflows like split expenses and informal debt tracking — all running locally on the device with zero network dependencies.

### Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | [Expo](https://expo.dev) SDK 55, React Native 0.83 |
| Language | TypeScript 5.9 (strict mode) |
| Navigation | React Navigation v7 (tabs + stack) |
| Database | SQLite via `expo-sqlite` v2 |
| Charts | `react-native-gifted-charts` |
| Unit tests | Jest + React Native Testing Library |
| E2E tests | Detox (Android) |

## Features

**Quick expense entry** — Log an expense in under 5 seconds with amount input, category grid selection, and optional note. One-handed, one-tap optimized.

**Dashboard** — Current month total spent, remaining budget, top spending category, per-category budget progress bars, and weekly spending summary at a glance.

**Category budgets** — Set monthly spending limits per category. Visual indicators shift from green → amber → red as you approach or exceed limits. Budgets are informational — they never block expense entry.

**Spending insights** — Category breakdown pie chart and 6-month trend bar chart to spot patterns over time.

**Student workflows** — Split expenses with friends, track lent and borrowed money with settle/unsettled states, and set up recurring expenses (subscriptions, rent) that auto-create on app open.

**Export** — Generate CSV or formatted PDF reports for any month and share via the native share sheet.

**Accessibility** — Comprehensive `accessibilityLabel`, `accessibilityRole`, and `accessibilityValue` attributes across all screens and components. Progress bars use semantic roles; decorative elements are hidden from screen readers.

## Try it out

> [!IMPORTANT]
> This is a **pre-release** build to demonstrate that the app works. It is debug-signed and not intended for production use.

A pre-built Android APK is available from the [GitHub Releases page](https://github.com/McFuzzySquirrel/mcfuzzy-test-personal-finance-app/releases/tag/v1.0.0) — no development setup required.

### Install on an Android device

1. Download `student-finance.apk` from the [latest release](https://github.com/McFuzzySquirrel/mcfuzzy-test-personal-finance-app/releases/tag/v1.0.0)
2. Open the file and allow installation from unknown sources when prompted
3. Launch **"Student Finance"** from the app drawer

### Install on an Android emulator

```bash
adb install release/student-finance.apk
```

---

## Getting started (development)

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ (20+ recommended)
- npm 9+

### Installation

```bash
git clone <repo-url>
cd student-finance-app
npm install
```

### Running the app

```bash
# Start the Expo development server
npm start

# Run on a specific platform
npm run android
npm run ios
npm run web
```

> [!TIP]
> The app uses SQLite for local storage — the database is created and seeded with default categories automatically on first launch. No additional setup needed.

### Available scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start Expo Metro bundler |
| `npm run android` | Launch on Android emulator or device |
| `npm run ios` | Launch on iOS simulator |
| `npm run web` | Launch in web browser |
| `npm run typecheck` | Run TypeScript type checker |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests with coverage |

## Testing

### Unit and integration tests

```bash
npm test
```

Runs 132 tests across 16 test suites covering the database layer, custom hooks, state providers, and utility functions. Coverage thresholds are enforced:

- **Global**: 35% lines/functions/statements
- **`db/`** and **`hooks/`**: 80% lines/functions/statements

Current coverage: **87.7% statements** overall.

### E2E tests (Detox)

> [!IMPORTANT]
> E2E tests require Java 21 and Android SDK tooling (API 35 recommended).

```bash
# Validate your environment
npm run e2e:doctor

# Build test artifacts
npm run e2e:build:android

# Run 11 E2E scenarios
npm run e2e:test:android

# Or build + test in one step
npm run e2e:android
```

The E2E suite covers all core user flows: dashboard navigation, expense entry, budget setting, split expense logging, export modal, and tab navigation.

Set `DETOX_AVD_NAME` to override the default emulator name (`detox-api35`):

```bash
export DETOX_AVD_NAME=your-avd-name
```

Failure artifacts (logs, screenshots, videos) are written to `artifacts/detox/`.

## Project structure

```text
app/                    Screens and navigation
├── navigation/         Tab + stack navigator setup and type definitions
├── dashboard.tsx       Main dashboard with budget summary
├── transactions.tsx    Monthly expense list with filters
├── insights.tsx        Pie chart and trend bar chart
├── budget.tsx          Per-category budget configuration
├── add-expense.tsx     Quick expense entry form
├── edit-expense.tsx    Edit or delete an expense
└── splits.tsx          Split expense and debt management

components/             Reusable UI components
├── CategoryGrid.tsx    Category selection interface
├── BudgetProgressBar   Visual budget indicator (green/amber/red)
├── SpendingPieChart    Category breakdown chart
├── MonthlyBarChart     6-month trend chart
├── ExportModal.tsx     CSV/PDF export dialog
└── ...                 Forms, list items, summaries

db/                     SQLite data layer
├── migrations/         Schema migrations (versioned)
├── expenses.ts         Expense CRUD queries
├── categories.ts       Category queries
├── budgets.ts          Budget queries
├── recurring.ts        Recurring expense logic
└── seeds.ts            Default category seeding

hooks/                  Feature hooks over the db layer
store/                  React Context providers (DatabaseProvider)
utils/                  Currency formatting, date helpers, export generators
types/                  Shared TypeScript interfaces
__tests__/              Jest unit and integration tests
e2e/                    Detox E2E test suite
scripts/                Build, setup, and environment scripts
```

## Architecture

### Data flow

```
Screens → Hooks → DB queries → SQLite
   ↑                              |
   └──── React Context ←──────────┘
```

Screens consume custom hooks (`useExpenses`, `useBudgets`, `useInsights`, etc.) that encapsulate all database operations. The `DatabaseProvider` initializes SQLite on app launch, runs migrations, seeds default categories, and provides the database connection via React Context.

### Database design

The SQLite schema uses 5 tables: `categories`, `expenses`, `budgets`, `app_state`, and `schema_version`. Key conventions:

- **Amounts stored in cents** (integers) to avoid floating-point precision errors
- **Dates as ISO 8601 strings** for locale-independent storage
- **Months as `YYYY-MM`** keys for consistent budget and query grouping
- **Foreign key constraints** enabled for data integrity

### Navigation

Bottom tabs for the four main screens (Dashboard, Transactions, Insights, Budget) with stack overlays for Add Expense, Edit Expense, and Splits. The Insights screen is lazy-loaded to optimize initial startup time.

## References

| Document | Path |
|----------|------|
| Product Requirements | [`docs/prd/student-finance-app-prd.md`](docs/prd/student-finance-app-prd.md) |
| Accessibility Checklist | [`docs/accessibility-checklist.md`](docs/accessibility-checklist.md) |
| Toolchain ADR | [`ejs-docs/adr/0001-java21-gradle813-detox-toolchain.md`](ejs-docs/adr/0001-java21-gradle813-detox-toolchain.md) |
