# Student Personal Finance App

## 1. Overview

**Product Name:** Student Finance — Personal Budget & Expense Tracker  
**Summary:** A React Native mobile app that helps university students track daily spending, manage category budgets, and understand where their money goes — all stored locally on-device with no account required. The guiding principle is speed: logging an expense must take no longer than 5 seconds.  
**Target Platform:** Android (latest / API 35+); React Native (cross-platform codebase)  
**Key Constraints:**
- Local-first storage — all data lives on-device (SQLite); no backend or cloud sync required
- Single-user — no login, registration, or multi-profile support
- Speed-first UX — every interaction must be optimised for one-handed, quick entry
- Currency: ZAR (South African Rand) — see Open Questions

---

## 2. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-13 | — | Initial PRD |

---

## 3. Goals and Non-Goals

### 3.1 Goals
- Enable a student to log an expense in under 5 seconds
- Show a clear breakdown of spending by category for the current month
- Allow per-category monthly budget limits with live progress indicators
- Surface simple spending trends (pie chart, monthly bar chart)
- Support student-specific workflows: split expenses, borrowed/lent money tracking, recurring subscriptions
- Operate fully offline with no account, no sign-in, and no internet dependency

### 3.2 Non-Goals
- Bank account integration or automatic transaction import (v2)
- Receipt / photo scanning (v2)
- AI-powered spending insights (v2)
- Gamification or savings goal badges (v2)
- Multi-currency support (v2)
- Cloud backup or cross-device sync (v2)
- iOS support as a primary target (nice to have — codebase is RN so it is possible)
- Full accounting or invoicing features

---

## 4. User Stories / Personas

### 4.1 Personas

| Persona | Description | Key Needs |
|---------|-------------|-----------|
| Sam (the student) | Full-time university student, living on a monthly allowance or part-time job income | Log expenses fast, know remaining budget at a glance, track who owes whom |
| Refilwe (the sharer) | Student who regularly splits costs with housemates and friends | Track split expenses and borrowed money without using a separate app |

### 4.2 User Stories

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|-----------|----------|
| US-01 | student | log an expense (amount, category, optional note) in one tap flow | I can record spending before I forget it | Must |
| US-02 | student | see total spent and remaining budget for the current month on a dashboard | I know my financial position at a glance | Must |
| US-03 | student | set a monthly budget limit per category | I can avoid overspending in any area | Must |
| US-04 | student | view a list of all my transactions for the month | I can review and verify my spending | Must |
| US-05 | student | see a pie chart of spending by category | I can understand where my money goes visually | Must |
| US-06 | student | see a monthly trend bar chart | I can track whether I am improving month-over-month | Should |
| US-07 | student | add custom categories | I can personalise the app to my lifestyle | Should |
| US-08 | student | log a split expense and record what a friend owes me | I track shared costs without a separate app | Should |
| US-09 | student | record money I lent or borrowed | I never forget informal debts | Should |
| US-10 | student | set up recurring expenses (subscriptions) | They are automatically included in my monthly view | Should |
| US-11 | student | see a weekly spending summary | I catch overspending early in the week | Should |
| US-12 | student | delete or edit an expense | I can correct mistakes | Must |
| US-13 | student | export a monthly report as PDF or CSV | I can share it with a parent or review it offline | Could |

---

## 5. Research Findings

### 5.1 Core Insight
Students drop budgeting apps primarily because expense entry is too slow or complex. Every design decision should be evaluated against the 5-second entry rule.

### 5.2 Tech Stack Evaluation

| Option | Stack | Pros | Cons | Decision |
|--------|-------|------|------|----------|
| A | Kotlin + Jetpack Compose + Room | Native perf, best Android tooling | Android-only, steeper learning curve | Not selected |
| B | Flutter + SQLite | Cross-platform, good perf | Dart ecosystem, less JS-familiar tooling | Not selected |
| **C** | **React Native + SQLite** | Cross-platform (iOS later), large ecosystem, JS/TS | Slightly lower perf than native (acceptable for this scope) | **Selected** |

### 5.3 Storage Strategy
Local-first SQLite via `expo-sqlite` (if using Expo) or `@op-engineering/op-sqlite` (bare RN). All data remains on-device. No network calls required for core functionality.

### 5.4 Key Libraries (recommended)

| Library | Purpose |
|---------|---------|
| `react-navigation` | Screen navigation |
| `expo-sqlite` or `op-sqlite` | Local database |
| `react-native-gifted-charts` or `victory-native` | Pie and bar charts |
| `react-native-paper` or `NativeWind` | UI component library / styling |
| `dayjs` | Date manipulation |
| `jest` + `@testing-library/react-native` | Unit and component testing |
| `detox` | End-to-end testing on Android |
| `expo-sharing` + `expo-print` | PDF/CSV export (Could) |

---

## 6. Concept

### 6.1 Core User Flow

```
App opens → Dashboard
     │
     ├─ Tap "+" → Add Expense screen
     │      ├── Enter amount (numpad auto-focused)
     │      ├── Select category (single tap from grid)
     │      ├── Optional: add note
     │      └── Tap "Save" → back to Dashboard (< 5 seconds total)
     │
     ├─ Tap "Transactions" → full list, filterable by month/category
     │
     ├─ Tap "Insights" → charts (pie by category, monthly trend bar)
     │
     └─ Tap "Budget" → set/edit per-category limits
```

### 6.2 Success / Completion Criteria
- A student can open the app cold and log an expense within 5 seconds
- The dashboard correctly reflects total spent, remaining budget, and top category for the current month
- All data persists across app restarts
- Charts render correctly with real data
- All must-have user stories pass acceptance tests

---

## 7. Technical Architecture

### 7.1 Technology Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | React Native (bare or Expo) | Expo recommended for faster setup |
| Language | TypeScript | Strict mode enabled |
| Navigation | React Navigation v7 | Bottom tab + stack navigators |
| Database | SQLite (expo-sqlite v2) | Local only, no ORM required |
| State Management | React Context + useReducer | Sufficient for single-user local app; no Redux needed |
| Styling | NativeWind (Tailwind CSS for RN) | Or React Native StyleSheet |
| Charts | react-native-gifted-charts | Lightweight, supports pie and bar |
| Testing (unit) | Jest + React Native Testing Library | |
| Testing (E2E) | Detox | Android |
| CI | GitHub Actions | Lint, test, build on push |

### 7.2 Project Structure

```
/
├── app/                     # Expo Router pages (or screens/ for bare RN)
│   ├── index.tsx            # Dashboard
│   ├── add-expense.tsx      # Quick entry screen
│   ├── transactions.tsx     # Transaction list
│   ├── insights.tsx         # Charts
│   └── budget.tsx           # Budget settings
├── components/              # Shared UI components
├── db/                      # SQLite schema, migrations, query helpers
├── hooks/                   # Custom hooks (useExpenses, useBudget, etc.)
├── store/                   # Context providers
├── utils/                   # Formatting, date helpers, export
├── types/                   # Shared TypeScript types
├── __tests__/               # Unit and component tests
└── e2e/                     # Detox E2E tests
```

### 7.3 Key Data Interfaces

```ts
interface Expense {
  id: string;
  amount: number;           // stored in cents to avoid float errors
  categoryId: string;
  note?: string;
  date: string;             // ISO 8601
  type: 'expense' | 'split' | 'lent' | 'borrowed';
  splitWith?: string;       // name of person
  splitAmount?: number;     // amount they owe / you owe
  isRecurring?: boolean;
  recurringInterval?: 'monthly';
}

interface Category {
  id: string;
  name: string;
  icon?: string;
  isCustom: boolean;
}

interface Budget {
  categoryId: string;
  limitAmount: number;      // in cents
  month: string;            // YYYY-MM
}
```

---

## 8. Functional Requirements

### 8.1 Expense Entry

| ID | Requirement | Priority |
|----|-------------|----------|
| FE-01 | User can log an expense with amount, category, optional note, and auto-filled date | Must |
| FE-02 | Numeric keypad is auto-focused when Add Expense screen opens | Must |
| FE-03 | Category can be selected in a single tap from a visible grid (no dropdowns) | Must |
| FE-04 | Expense is saved and user returns to Dashboard in under 5 seconds total | Must |
| FE-05 | User can edit any existing expense | Must |
| FE-06 | User can delete any existing expense (with confirmation prompt) | Must |
| FE-07 | Date defaults to today but can be changed | Should |

### 8.2 Categories

| ID | Requirement | Priority |
|----|-------------|----------|
| FC-01 | App ships with default categories: Food, Transport, Rent, Entertainment, Books, Subscriptions, Other | Must |
| FC-02 | User can add custom categories with a name and optional icon/emoji | Should |
| FC-03 | User can rename or delete custom categories | Should |
| FC-04 | System categories cannot be deleted | Must |

### 8.3 Budget

| ID | Requirement | Priority |
|----|-------------|----------|
| FB-01 | User can set a monthly spending limit per category | Must |
| FB-02 | Dashboard shows progress bar: amount spent vs. budget limit per category | Must |
| FB-03 | Progress bar turns amber at 80% usage and red at 100%+ | Should |
| FB-04 | Budgets are set per month; previous month's budgets persist as defaults for new months | Should |

### 8.4 Dashboard

| ID | Requirement | Priority |
|----|-------------|----------|
| FD-01 | Shows total spent this month | Must |
| FD-02 | Shows total remaining budget this month | Must |
| FD-03 | Shows the largest spending category this month | Must |
| FD-04 | Shows per-category budget progress bars | Must |
| FD-05 | Shows weekly spending summary (current week totals by day or category) | Should |

### 8.5 Transactions

| ID | Requirement | Priority |
|----|-------------|----------|
| FT-01 | Full list of all expenses, sorted by date descending | Must |
| FT-02 | Filterable by month | Must |
| FT-03 | Filterable by category | Should |
| FT-04 | Shows split/lent/borrowed entries distinctly labelled | Should |

### 8.6 Insights / Charts

| ID | Requirement | Priority |
|----|-------------|----------|
| FI-01 | Pie chart showing spending distribution by category for the current month | Must |
| FI-02 | Bar chart showing total spending by month (last 6 months) | Should |
| FI-03 | Charts are interactive (tap slice/bar to see detail) | Could |

### 8.7 Student-Specific Features

| ID | Requirement | Priority |
|----|-------------|----------|
| FS-01 | User can log a split expense: total amount, who paid, and what each party owes | Should |
| FS-02 | App shows outstanding splits (who owes the user, and what the user owes others) | Should |
| FS-03 | User can mark a split as settled | Should |
| FS-04 | User can log a lent/borrowed money entry (separate from regular expenses) | Should |
| FS-05 | User can add recurring expenses; the app auto-creates the entry each month on the set date | Should |
| FS-06 | Recurring expenses are listed and manageable in Budget / Settings | Should |

### 8.8 Export

| ID | Requirement | Priority |
|----|-------------|----------|
| FX-01 | User can export the current month's transactions as CSV | Could |
| FX-02 | User can export the current month's transactions as a formatted PDF report | Could |
| FX-03 | Export can be shared via the native share sheet (email, messaging, etc.) | Could |

---

## 9. Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NF-01 | App cold-start to interactive dashboard in under 2 seconds on a mid-range Android device | Must |
| NF-02 | Expense entry (open screen → save) completes in under 5 seconds | Must |
| NF-03 | App functions fully offline; no network permission required for core features | Must |
| NF-04 | All data persists correctly across app restarts and device reboots | Must |
| NF-05 | Charts render within 500ms for up to 500 expense records | Should |
| NF-06 | TypeScript strict mode — no `any` types in production code | Should |
| NF-07 | App targets Android API 35+; graceful degradation to API 28+ is acceptable | Should |

---

## 10. Security and Privacy

| ID | Requirement | Priority |
|----|-------------|----------|
| SP-01 | All data is stored locally on-device in SQLite; no data is transmitted to any server | Must |
| SP-02 | The app requests no network permissions for core functionality | Must |
| SP-03 | No analytics, telemetry, or crash reporting that transmits PII to external services | Must |
| SP-04 | Exported files (CSV/PDF) contain financial data — user must confirm before sharing | Should |
| SP-05 | No sensitive data is logged to the console or crash logs in production builds | Must |

**Privacy statement:** This app collects no personal information, has no user accounts, and transmits no data off-device. All financial records exist solely in the device's local SQLite database.

---

## 11. Accessibility

| ID | Requirement | Priority |
|----|-------------|----------|
| ACC-01 | All interactive elements have accessible labels (`accessibilityLabel`) | Must |
| ACC-02 | Minimum touch target size of 44×44 dp for all tappable elements | Must |
| ACC-03 | Text meets WCAG 2.1 AA colour contrast ratio (4.5:1 for normal text) | Must |
| ACC-04 | App is navigable via TalkBack (Android screen reader) | Should |
| ACC-05 | No information conveyed by colour alone (e.g., budget warnings also use icons or text) | Should |
| ACC-06 | Font sizes respect system font-size settings | Should |

---

## 12. User Interface / Interaction Design

### 12.1 Screen Summary

| Screen | Purpose | Key Elements |
|--------|---------|-------------|
| Dashboard | Financial overview | Total spent, remaining, category progress bars, weekly summary, FAB "+" button |
| Add Expense | Fast entry | Auto-focused numpad, category grid, note field, Save button |
| Transactions | Full history | Chronological list, month selector, category filter |
| Insights | Visual analytics | Pie chart (category), bar chart (monthly trend) |
| Budget | Set limits | Per-category limit inputs, list of recurring expenses |

### 12.2 Interaction Principles
- **Speed over features:** Add Expense screen opens with the numpad already visible
- **One-handed use:** Primary actions reachable in the lower 2/3 of screen
- **Progressive disclosure:** Advanced options (split, recurring) are accessible but not in the default flow
- **Consistent feedback:** Every save/delete action provides immediate visual confirmation (toast or inline)

### 12.3 Navigation
- Bottom tab bar: Dashboard | Transactions | Insights | Budget
- Floating Action Button (FAB) on Dashboard and Transactions for quick expense entry

---

## 13. System States / Lifecycle

| State | Description |
|-------|-------------|
| First Launch | Database initialised with default categories; budget screen nudged if no budgets set |
| No Data | Dashboard shows zero-state illustration and prompt to add first expense |
| Normal Use | Standard dashboard with data |
| Budget Exceeded | Category progress bar turns red; no blocking — user can still log expenses |
| New Month | Budgets roll over from previous month defaults; monthly totals reset |
| Export in Progress | Loading indicator shown; native share sheet opened on complete |

---

## 14. Implementation Phases

### Phase 1: Core Expense Tracking
- [ ] Project bootstrap (Expo + TypeScript + React Navigation)
- [ ] SQLite database setup: schema, migrations
- [ ] Add Expense screen (amount, category, note, date)
- [ ] Default categories seeded on first launch
- [ ] Transaction list screen (current month, date-sorted)
- [ ] Edit and delete expense

### Phase 2: Budget & Dashboard
- [ ] Budget settings screen (per-category monthly limits)
- [ ] Dashboard: total spent, remaining, top category
- [ ] Per-category progress bars with amber/red states
- [ ] Month navigation (view previous months)

### Phase 3: Insights & Charts
- [ ] Pie chart by category (current month)
- [ ] Monthly trend bar chart (last 6 months)
- [ ] Weekly spending summary on dashboard

### Phase 4: Student Features
- [ ] Custom categories (add, rename, delete)
- [ ] Split expense entry and outstanding splits view
- [ ] Lent / borrowed money tracking
- [ ] Recurring expense setup and auto-creation

### Phase 5: Polish & Export
- [ ] CSV export
- [ ] PDF report generation and share sheet
- [ ] Accessibility audit (TalkBack, contrast)
- [ ] Performance profiling and optimisation
- [ ] E2E test suite (Detox)

---

## 15. Testing Strategy

| Level | Scope | Tools / Approach |
|-------|-------|-----------------|
| Unit | Utility functions (formatting, date helpers, amount calculations), DB query helpers | Jest |
| Component | UI components render correctly, form interactions, navigation flows | Jest + React Native Testing Library |
| Integration | Data flows: add expense → dashboard totals update, budget progress recalculates | Jest + RNTL with mocked SQLite |
| E2E | Full user journeys: log expense, view dashboard, set budget, view chart | Detox on Android emulator |
| Manual | First-launch experience, 5-second entry timing, TalkBack navigation, export flow | Manual on physical device |

### Key Test Scenarios
1. Log an expense → appears in transaction list and dashboard totals update
2. Log expense that exceeds budget → progress bar turns red, no block
3. Set budget for category → correct limit displayed on dashboard
4. Split expense logged → appears in outstanding splits with correct amount
5. Mark split as settled → removed from outstanding list
6. Recurring expense → auto-created on configured date
7. Navigate to previous month → correct historical totals shown
8. Export CSV → file contains correct data and share sheet opens
9. App restart → all data persists from SQLite
10. 200 expenses in DB → dashboard loads in under 2 seconds

---

## 16. Analytics / Success Metrics

This app has no telemetry or analytics by design (see SP-03). Success is evaluated manually:

| Metric | Target | Measurement Method |
|--------|--------|--------------------|
| Expense entry time | < 5 seconds from tap to save | Manual timing on physical device |
| Cold-start time | < 2 seconds to interactive dashboard | Manual timing / React Native Perf Monitor |
| All Must user stories | Pass | Acceptance test checklist |
| E2E test pass rate | 100% on CI | Detox + GitHub Actions |
| Unit/component test coverage | ≥ 80% of business logic | Jest coverage report |

---

## 17. Acceptance Criteria

1. A new user can open the app, log their first expense, and see it reflected on the dashboard — all within 30 seconds of first launch
2. Logging a single expense (amount + category) takes no more than 5 seconds on a physical device
3. All Must-priority functional requirements (FE, FC, FB, FD, FT, FI) are implemented and verifiable
4. The app works fully offline; no internet connection is required at any point for core features
5. Data persists correctly across app kills and device reboots
6. All unit and component tests pass on CI (`jest --coverage` ≥ 80% for `hooks/` and `db/`)
7. All Detox E2E scenarios listed in section 15 pass on an Android emulator (API 35)
8. No TypeScript errors in strict mode (`tsc --noEmit` exits with code 0)
9. No accessibility violations for Must-priority ACC requirements (verified via manual TalkBack test)
10. Export produces a valid CSV file containing all expenses for the selected month

---

## 18. Dependencies and Risks

### 18.1 Dependencies

| Dependency | Type | Risk if Unavailable | Mitigation |
|------------|------|---------------------|------------|
| expo-sqlite v2 | npm / Expo SDK | Data layer broken | Pin version; alternative: op-sqlite |
| react-native-gifted-charts | npm | Charts unavailable | Alternative: victory-native |
| react-navigation | npm | Navigation broken | Stable, widely used; low risk |
| detox | npm / E2E tooling | E2E tests cannot run | Fall back to RNTL integration tests |
| expo-print / expo-sharing | npm | Export unavailable | Feature is "Could" priority — defer |

### 18.2 Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| SQLite migration errors corrupt data | Low | High | Write migration tests; keep schema simple; version migrations |
| React Native perf issues on budget screen with many categories | Low | Medium | Virtualised lists (FlatList); profile early |
| 5-second entry target not met due to chart library load | Medium | High | Lazy-load Insights screen; keep Add Expense screen lightweight |
| Detox flakiness in CI | Medium | Low | Retry on failure; use stable emulator image |
| Expo SDK breaking change during development | Low | Medium | Pin Expo SDK version; upgrade deliberately |

---

## 19. Future Considerations

| Item | Description | Potential Version |
|------|-------------|-------------------|
| Bank integration | Auto-import transactions from bank APIs | v2 |
| Receipt scanner | Photo → parsed amount and category via OCR | v2 |
| AI spending insights | Natural language queries ("Can I afford dinner?") | v2 |
| Gamification | Savings streaks, budget-adherence badges | v2 |
| Cloud backup | Optional encrypted backup to Google Drive or custom server | v2 |
| iOS support | Codebase is React Native; iOS build is low-effort addition | v2 |
| Multi-currency | Support currencies beyond ZAR | v2 |
| Widgets | Android home screen widget showing remaining budget | v3 |

---

## 20. Open Questions

| # | Question | Default Assumption |
|---|----------|--------------------|
| 1 | Is ZAR the only currency, or should the symbol be configurable? | ZAR (R) hardcoded in v1 |
| 2 | Should amounts be stored with two decimal places or cents (integers)? | Cents (integers) to avoid float errors |
| 3 | Is the project using Expo (managed / bare) or a bare React Native CLI project? | Expo (bare workflow) recommended |
| 4 | Should the weekly summary reset on Monday or Sunday? | Monday (ISO week) |
| 5 | Is there a minimum Android API level below API 35 to target? | API 28+ graceful degradation |
| 6 | Should recurring expenses create entries automatically on device wake-up, or only when the app is opened? | On app open (simpler, no background task needed) |
| 7 | Are split/lent amounts tracked as separate ledger entries or as metadata on an expense? | Metadata on the expense record |

---

## 21. Glossary

| Term | Definition |
|------|------------|
| Expense | A single spending record: amount, category, date, optional note |
| Category | A label used to group expenses (e.g., Food, Transport) |
| Budget | A monthly spending limit set by the user per category |
| Split expense | An expense shared between the user and one or more friends |
| Recurring expense | An expense that repeats on a fixed interval (e.g., monthly subscription) |
| Dashboard | The main home screen showing the current month's financial summary |
| ZAR | South African Rand — the default currency for this app |
| Local-first | Architecture where all data is stored on-device by default, with no required server |
