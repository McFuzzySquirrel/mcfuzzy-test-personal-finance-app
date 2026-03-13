describe('App smoke flow', () => {
  it('launches and shows the dashboard', async () => {
    await expect(element(by.id('dashboard-add-expense-button'))).toBeVisible();
    await expect(element(by.id('dashboard-summary-spent-card'))).toBeVisible();
  });

  it('opens Add Expense from the dashboard FAB', async () => {
    await element(by.id('dashboard-add-expense-button')).tap();
    await expect(element(by.id('add-expense-amount-input'))).toBeVisible();
  });
});
