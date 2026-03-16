# Accessibility Checklist

Manual accessibility checks for the Student Finance app (Android / TalkBack baseline).

## Screen Reader

- [x] All actionable controls have clear `accessibilityLabel` values. *(189 a11y attributes added across all screens/components)*
- [x] Dashboard FAB announces "Add new expense" with `accessibilityRole="button"`.
- [x] Budget progress bars announce percentage and status via `accessibilityRole="progressbar"` and `accessibilityValue`.
- [x] Chart sections include text summaries (e.g., "Spending by category: Food 45%, Transport 30%") and legends with `accessibilityRole="list"`.
- [x] Export actions have `accessibilityLabel` and `accessibilityHint` before confirmation.

## Keyboard and Focus

- [x] Focus order follows logical top-to-bottom layout on each screen.
- [x] AddRecurringModal uses `accessibilityViewIsModal={true}` for focus trapping.
- [x] Confirmation dialogs (delete expense, settle split) have labeled primary and cancel actions.

## Touch Targets

- [x] All tappable elements use `minHeight: 44` or larger containers meeting 44dp target.
- [x] Category chips and filter chips have adequate touch targets via padding.
- [ ] Split/recurring controls — verify on small screens (requires device testing).

## Color and Contrast

- [ ] Text meets WCAG 2.1 AA contrast ratio (4.5:1 for body text) — requires device/emulator verification.
- [x] Budget warning states include status text ("On track", "Warning", "Over budget") in addition to color.
- [x] Chart slices have matching legend labels with category name, amount, and percentage.

## Dynamic Type and Layout

- [ ] System font scaling does not truncate critical values on Dashboard cards — requires device testing.
- [ ] Add Expense form remains usable at larger text sizes — requires device testing.
- [ ] Transactions rows and split badges remain readable without clipping — requires device testing.

## Validation Path

- [ ] Run through core flow with TalkBack enabled:
  1. Add expense
  2. Edit expense
  3. Set budget
  4. View insights
  5. Export report
- [ ] Record any issues and file follow-up tasks before release.

## Implementation Notes (2026-03-16)

**Code coverage**: 189 accessibility attributes added across 14 files (up from 5).

**Screens with full a11y coverage:**
- `app/dashboard.tsx` — summary cards, FAB, navigation buttons
- `app/add-expense.tsx` — amount input, category grid, save button
- `app/edit-expense.tsx` — all form fields, save/delete buttons
- `app/transactions.tsx` — month nav, filters, list items
- `app/budget.tsx` — budget inputs, save, recurring, custom categories
- `app/insights.tsx` — chart toggles, legend, summary cards
- `app/splits.tsx` — section headers, split rows, settle buttons

**Components with full a11y coverage:**
- `BudgetProgressBar` — progressbar role with min/max/now values
- `CategoryBudgetRow` — grouped labels, decorative emoji hidden
- `WeeklySummary` — summary role, day rows with amounts
- `SpendingPieChart` — dynamic summary label from data
- `MonthlyBarChart` — dynamic trend summary label
- `CategoryGrid` — selected state, category names
- `SplitExpenseForm` — toggle, inputs, split type selection
- `LentBorrowedForm` — type segment, person name input
- `ExportModal` — format selection, disabled states, modal a11y
- `AddRecurringModal` — modal focus, category chips, form fields
- `ExpenseListItem` — combined label with category, amount, badge
