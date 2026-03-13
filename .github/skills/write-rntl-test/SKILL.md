---
name: write-rntl-test
description: >
  Creates a component test file using React Native Testing Library (RNTL) with
  the correct project mock setup for SQLite, navigation, and context providers.
  Use this skill whenever a new React Native component or screen needs a test file.
---

# Skill: Write a React Native Testing Library Test

You are writing a component test for a React Native (Expo) + TypeScript project using Jest and `@testing-library/react-native`. The project uses React Navigation, expo-sqlite, and a `DatabaseProvider` context.

## Reference

PRD: [docs/prd/student-finance-app-prd.md](../../../docs/prd/student-finance-app-prd.md)

- §15 Testing Strategy (component level)
- §17 Acceptance Criteria (#6 — 80% coverage on `hooks/` and `db/`)
- qa-engineer agent: [.github/agents/qa-engineer.md](../../agents/qa-engineer.md)

---

## Step 1: Identify the Component

Determine:

1. **Component file** — Which component or screen is being tested? (e.g., `components/BudgetProgressBar.tsx`)
2. **Props** — What props does the component accept?
3. **Behaviours to test** — What should it render? What interactions should it respond to?
4. **Dependencies** — Does it use hooks that call the DB? Does it use navigation? Does it need providers?

---

## Step 2: Create the Test File

Create `__tests__/components/{ComponentName}.test.tsx` (or `__tests__/screens/{ScreenName}.test.tsx`):

```tsx
import React from 'react';
import { screen, fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../utils/test-utils';
import { {ComponentName} } from '@/components/{ComponentName}';
// OR for screens:
// import {ScreenName}Screen from '@/app/{screen-name}';

describe('{ComponentName}', () => {
  it('renders correctly with default props', () => {
    renderWithProviders(
      <{ComponentName} {/* required props */} />
    );

    expect(screen.getByText('{expected text}')).toBeTruthy();
  });

  it('calls {handler} when {element} is pressed', () => {
    const onPress = jest.fn();

    renderWithProviders(
      <{ComponentName} onPress={onPress} {/* other props */} />
    );

    fireEvent.press(screen.getByRole('button', { name: '{label}' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when data is empty', () => {
    // test empty/zero/null prop states
  });
});
```

---

## Step 3: Use `renderWithProviders`

Import and use the shared test utility from `__tests__/utils/test-utils.tsx`:

```tsx
import { renderWithProviders } from '../utils/test-utils';
```

This wraps the component with:
- `NavigationContainer` (with a mock navigation state)
- `DatabaseProvider` (with a mocked in-memory SQLite connection)
- Any other global providers

Do **not** create one-off provider wrappers in individual test files — use `renderWithProviders`.

---

## Step 4: Mock External Dependencies

If the component calls a hook that uses SQLite, mock the hook at the module level:

```ts
jest.mock('@/hooks/useExpenses', () => ({
  useExpenses: () => ({
    expenses: [
      { id: '1', amount: 4500, categoryId: 'food', note: 'Coffee', date: '2026-03-13', type: 'expense' },
    ],
    insertExpense: jest.fn(),
    deleteExpense: jest.fn(),
  }),
}));
```

If the component calls `useNavigation`, it is automatically provided by the `NavigationContainer` in `renderWithProviders` — no additional mock needed.

---

## Step 5: Test Accessibility Labels

For every interactive element, verify the `accessibilityLabel`:

```ts
it('has accessible label on save button', () => {
  renderWithProviders(<{ComponentName} />);
  expect(screen.getByRole('button', { name: 'Save expense' })).toBeTruthy();
});
```

---

## Step 6: Async Queries

For components that load data asynchronously (data appears after a re-render):

```ts
import { waitFor } from '@testing-library/react-native';

it('displays expense after load', async () => {
  renderWithProviders(<TransactionsScreen />);
  await waitFor(() => {
    expect(screen.getByText('R45.00')).toBeTruthy();
  });
});
```

---

## Step 7: Verify

1. `jest __tests__/components/{ComponentName}.test.tsx` — all tests pass
2. `jest --coverage` — coverage for the component file meets the project threshold

---

## Common Pitfalls

| Pitfall | Fix |
|---------|-----|
| `Element type is invalid` | Check that the component is a default export and the import path is correct |
| Navigation context errors | Use `renderWithProviders` — it includes `NavigationContainer` |
| SQLite not mocked | Mock the hook, not the DB directly; or use the in-memory DB in `renderWithProviders` |
| `act()` warnings | Wrap state-updating interactions in `await act(async () => { ... })` or use `waitFor` |
| `testID` not found | Ensure the component under test has a `testID` prop on the target element |

---

## Output

- `__tests__/components/{ComponentName}.test.tsx` (or `__tests__/screens/`) — created with tests for: default render, interaction, empty/null state, accessibility label
- All tests pass with `jest`
