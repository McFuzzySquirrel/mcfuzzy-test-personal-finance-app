# Accessibility Checklist

Manual accessibility checks for the Student Finance app (Android / TalkBack baseline).

## Screen Reader

- [ ] All actionable controls have clear `accessibilityLabel` values.
- [ ] Dashboard FAB announces "Add expense".
- [ ] Budget progress bars announce both percentage and status text (not only color).
- [ ] Chart sections include text summaries and legends in addition to visuals.
- [ ] Export actions announce intent before confirmation dialogs.

## Keyboard and Focus

- [ ] Focus order is logical from top to bottom on each screen.
- [ ] Modal focus starts on the modal title/first field and does not leak behind the modal.
- [ ] Confirmation dialogs have clearly labeled primary and cancel actions.

## Touch Targets

- [ ] All tappable elements meet minimum 44x44 dp touch target size.
- [ ] Category chips and filter chips remain tappable on small screens.
- [ ] Split/recurring controls are not crowded or overlapping with system UI.

## Color and Contrast

- [ ] Text meets WCAG 2.1 AA contrast ratio (4.5:1 for body text).
- [ ] Budget warning states include icon/text in addition to color.
- [ ] Chart slices are distinguishable and have matching legend labels.

## Dynamic Type and Layout

- [ ] System font scaling does not truncate critical values on Dashboard cards.
- [ ] Add Expense form remains usable at larger text sizes.
- [ ] Transactions rows and split badges remain readable without clipping.

## Validation Path

- [ ] Run through core flow with TalkBack enabled:
  1. Add expense
  2. Edit expense
  3. Set budget
  4. View insights
  5. Export report
- [ ] Record any issues and file follow-up tasks before release.
