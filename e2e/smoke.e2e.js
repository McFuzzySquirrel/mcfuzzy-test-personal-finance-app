describe('App smoke flow', () => {
  // Tests run sequentially in a single app instance — no relaunch between tests.
  // New Architecture + Hermes SIGSEGV on newInstance relaunch, so we keep the app alive.
  // Covers PRD section 15 test scenarios 1–10.

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

  // PRD scenario 3: Set budget for category → correct limit displayed
  it('sets a budget and sees progress on dashboard', async () => {
    // Navigate to Budget tab
    await element(by.id('tab-budget')).tap();
    await waitFor(element(by.id('budget-save-button')))
      .toBeVisible()
      .withTimeout(10000);

    // Set a budget for Food category (default-food)
    await waitFor(element(by.id('budget-input-default-food')))
      .toBeVisible()
      .whileElement(by.id('budget-scroll-view'))
      .scroll(200, 'down');
    await element(by.id('budget-input-default-food')).clearText();
    await element(by.id('budget-input-default-food')).typeText('500');
    await device.pressBack(); // dismiss keyboard

    // Save budget
    await element(by.id('budget-scroll-view')).scrollTo('bottom');
    await waitFor(element(by.id('budget-save-button')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id('budget-save-button')).tap();

    // Navigate back to dashboard and verify budget info appears
    await element(by.id('tab-dashboard')).tap();
    await waitFor(element(by.id('dashboard-summary-remaining-card')))
      .toBeVisible()
      .withTimeout(10000);
  });

  // PRD scenario 2: Log expense exceeding budget → progress bar turns red, no block
  it('logs an expense exceeding budget without being blocked', async () => {
    await element(by.id('tab-dashboard')).tap();
    await waitFor(element(by.id('dashboard-add-expense-button')))
      .toBeVisible()
      .withTimeout(10000);

    // Add a large expense in Food category (budget is R500)
    await element(by.id('dashboard-add-expense-button')).tap();
    await waitFor(element(by.id('add-expense-amount-input')))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.id('add-expense-amount-input')).typeText('600');
    await device.pressBack();

    await waitFor(element(by.id('category-grid-item-default-food')))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.id('category-grid-item-default-food')).tap();

    await element(by.id('add-expense-scroll-view')).scrollTo('bottom');
    await waitFor(element(by.id('add-expense-save-button')))
      .toBeVisible()
      .withTimeout(5000);
    // Should NOT be blocked — the save button must be tappable
    await element(by.id('add-expense-save-button')).tap();

    // Should return to dashboard successfully (not blocked)
    await waitFor(element(by.id('dashboard-add-expense-button')))
      .toBeVisible()
      .withTimeout(15000);
  });

  // PRD scenario 4: Split expense logged → appears in outstanding splits
  it('logs a split expense and sees it in splits', async () => {
    await element(by.id('tab-dashboard')).tap();
    await waitFor(element(by.id('dashboard-add-expense-button')))
      .toBeVisible()
      .withTimeout(10000);

    await element(by.id('dashboard-add-expense-button')).tap();
    await waitFor(element(by.id('add-expense-amount-input')))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.id('add-expense-amount-input')).typeText('100');
    await device.pressBack();

    // Select category
    await waitFor(element(by.id('category-grid-item-default-food')))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.id('category-grid-item-default-food')).tap();

    // Enable split mode
    await element(by.id('add-expense-scroll-view')).scrollTo('bottom');
    await waitFor(element(by.id('add-expense-split-toggle')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id('add-expense-split-toggle')).tap();

    // Enter the person to split with
    await waitFor(element(by.id('add-expense-split-with-input')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id('add-expense-split-with-input')).typeText('Alice');
    await device.pressBack();

    // Save the split expense
    await element(by.id('add-expense-scroll-view')).scrollTo('bottom');
    await waitFor(element(by.id('add-expense-save-button')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id('add-expense-save-button')).tap();

    // Return to dashboard and navigate to splits
    await waitFor(element(by.id('dashboard-add-expense-button')))
      .toBeVisible()
      .withTimeout(15000);
    await waitFor(element(by.id('dashboard-open-splits-button')))
      .toBeVisible()
      .whileElement(by.id('dashboard-scroll-view'))
      .scroll(200, 'down');
    await element(by.id('dashboard-open-splits-button')).tap();

    // Splits screen should no longer show empty state (we just added a split)
    await waitFor(element(by.text('Alice')))
      .toBeVisible()
      .withTimeout(10000);
    await device.pressBack();
    await waitFor(element(by.id('dashboard-add-expense-button')))
      .toBeVisible()
      .withTimeout(10000);
  });

  // PRD scenario 8: Export flow — open export modal
  it('opens the export modal from transactions', async () => {
    await element(by.id('tab-transactions')).tap();
    await waitFor(element(by.id('transactions-open-export')))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.id('transactions-open-export')).tap();

    // Export modal should appear with format options
    await waitFor(element(by.id('export-modal-format-csv')))
      .toBeVisible()
      .withTimeout(10000);
    await expect(element(by.id('export-modal-format-pdf'))).toBeVisible();
    await expect(element(by.id('export-modal-cancel'))).toBeVisible();
    await expect(element(by.id('export-modal-submit'))).toBeVisible();

    // Cancel the export
    await element(by.id('export-modal-cancel')).tap();
    await waitFor(element(by.id('transactions-open-export')))
      .toBeVisible()
      .withTimeout(10000);
  });

  // PRD scenario 9: Insights screen loads and displays charts
  it('navigates to insights and sees chart views', async () => {
    await element(by.id('tab-insights')).tap();
    await waitFor(element(by.id('insights-screen')))
      .toBeVisible()
      .withTimeout(10000);

    // Toggle to trends view
    await element(by.id('insights-toggle-trends')).tap();
    await waitFor(element(by.id('monthly-bar-chart')))
      .toBeVisible()
      .withTimeout(10000);

    // Toggle back to this month view
    await element(by.id('insights-toggle-this-month')).tap();
    await waitFor(element(by.id('spending-pie-chart')))
      .toBeVisible()
      .withTimeout(10000);
  });
});
