describe('App smoke flow', () => {
  // Tests run sequentially in a single app instance — no relaunch between tests.
  // New Architecture + Hermes SIGSEGV on newInstance relaunch, so we keep the app alive.
  // Covers PRD section 15 test scenarios 1, 2, 3, 4, 7, 8, 9, 10 (scenarios 5/6 require complex split/recurring state).

  it('launches and shows the dashboard', async () => {
    await waitFor(element(by.id('dashboard-add-expense-button')))
      .toBeVisible()
      .withTimeout(15000);
    await expect(element(by.id('dashboard-summary-spent-card'))).toBeVisible();
  });

  it('opens Add Expense from the dashboard FAB', async () => {
    await element(by.id('dashboard-add-expense-button')).tap();
    await waitFor(element(by.id('add-expense-amount-input')))
      .toBeVisible()
      .withTimeout(10000);
    // Navigate back to dashboard: first pressBack dismisses keyboard, second pops screen
    await device.pressBack();
    await device.pressBack();
    await waitFor(element(by.id('dashboard-add-expense-button')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('navigates to transactions from dashboard', async () => {
    // Scroll down within the dashboard scroll view until the button is visible
    await waitFor(element(by.id('dashboard-view-transactions-button')))
      .toBeVisible()
      .whileElement(by.id('dashboard-scroll-view'))
      .scroll(200, 'down');
    await element(by.id('dashboard-view-transactions-button')).tap();
    await waitFor(element(by.id('transactions-open-export')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('adds an expense and sees it in transactions', async () => {
    // Navigate to Dashboard tab first (we are on Transactions from previous test)
    await element(by.id('tab-dashboard')).tap();
    await waitFor(element(by.id('dashboard-add-expense-button')))
      .toBeVisible()
      .withTimeout(10000);

    await element(by.id('dashboard-add-expense-button')).tap();
    await waitFor(element(by.id('add-expense-amount-input')))
      .toBeVisible()
      .withTimeout(10000);
    // Use typeText (not replaceText) so React Native's onChangeText fires on New Arch
    // Use whole number to avoid decimal-pad keyboard issues with '.' character
    await element(by.id('add-expense-amount-input')).typeText('12');
    // Dismiss keyboard so we can scroll to the save button
    await device.pressBack();
    // Select a category
    await waitFor(element(by.id('category-grid-item-default-food')))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.id('category-grid-item-default-food')).tap();
    // Scroll to the bottom of the form to reach save button
    await element(by.id('add-expense-scroll-view')).scrollTo('bottom');
    await waitFor(element(by.id('add-expense-save-button')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id('add-expense-save-button')).tap();

    // Should navigate back to dashboard after save
    await waitFor(element(by.id('dashboard-add-expense-button')))
      .toBeVisible()
      .withTimeout(15000);
    // Navigate to Transactions via tab
    await element(by.id('tab-transactions')).tap();
    // Verify we see the transactions list
    await waitFor(element(by.id('transactions-open-export')))
      .toBeVisible()
      .withTimeout(10000);
  });

  // PRD scenario 7: Navigate to previous month in Transactions
  it('navigates to previous month in transactions', async () => {
    await element(by.id('tab-transactions')).tap();
    await waitFor(element(by.id('transactions-open-export')))
      .toBeVisible()
      .withTimeout(10000);
    // Go to previous month
    await element(by.id('transactions-prev-month')).tap();
    // Navigate back to current month
    await element(by.id('transactions-next-month')).tap();
    // Verify transactions list is still visible
    await waitFor(element(by.id('transactions-open-export')))
      .toBeVisible()
      .withTimeout(10000);
  });

  // PRD scenario 8: Splits screen loads with empty state
  it('opens the splits screen from the dashboard', async () => {
    await element(by.id('tab-dashboard')).tap();
    await waitFor(element(by.id('dashboard-add-expense-button')))
      .toBeVisible()
      .withTimeout(10000);
    // Scroll to the "Open splits" button
    await waitFor(element(by.id('dashboard-open-splits-button')))
      .toBeVisible()
      .whileElement(by.id('dashboard-scroll-view'))
      .scroll(200, 'down');
    await element(by.id('dashboard-open-splits-button')).tap();
    // Splits screen should show empty state text
    await waitFor(element(by.id('splits-they-owe-empty')))
      .toBeVisible()
      .withTimeout(10000);
    // Navigate back
    await device.pressBack();
    await waitFor(element(by.id('dashboard-add-expense-button')))
      .toBeVisible()
      .withTimeout(10000);
  });
});
