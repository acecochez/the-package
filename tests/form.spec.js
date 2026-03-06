import { test, expect } from '@playwright/test';

test.describe('Multi-step form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // ─── Step 1: Personal Info ────────────────────────────────────────────────

  test('Step 1 – shows validation errors for empty fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Next Step' }).click();

    await expect(page.locator('#name')).toHaveClass(/is-danger/);
    await expect(page.locator('#email')).toHaveClass(/is-danger/);
    await expect(page.locator('#phone')).toHaveClass(/is-danger/);
    await expect(page.locator('.help.is-danger').first()).toBeVisible();
  });

  test('Step 1 – shows validation error for malformed email', async ({ page }) => {
    await page.fill('#name', 'Test User');
    await page.fill('#email', 'not-an-email');
    await page.fill('#phone', '+1 234 567 890');
    await page.getByRole('button', { name: 'Next Step' }).click();

    await expect(page.locator('#email')).toHaveClass(/is-danger/);
    await expect(page.locator('.help.is-danger')).toContainText('not formatted correctly');
  });

  test('Step 1 – advances to Step 2 with valid inputs', async ({ page }) => {
    await fillStep1(page);

    await expect(page.locator('#step-1')).toHaveClass(/hidden/);
    await expect(page.locator('#step-2')).not.toHaveClass(/hidden/);
    await expect(page.locator('.sidebar-step[data-step="2"]')).toHaveClass(/active/);
  });

  // ─── Step 2: Select Plan ──────────────────────────────────────────────────

  test('Step 2 – default plan is Arcade (monthly)', async ({ page }) => {
    await fillStep1(page);

    await expect(page.locator('.plan-box[data-plan="Arcade"]')).toHaveClass(/is-selected/);
    await expect(page.locator('#monthly-label')).toHaveClass(/has-text-weight-bold/);
  });

  test('Step 2 – can select a different plan', async ({ page }) => {
    await fillStep1(page);

    await page.locator('.plan-box[data-plan="Pro"]').click();

    await expect(page.locator('.plan-box[data-plan="Pro"]')).toHaveClass(/is-selected/);
    await expect(page.locator('.plan-box[data-plan="Arcade"]')).not.toHaveClass(/is-selected/);
  });

  test('Step 2 – billing toggle switches to yearly and shows free labels', async ({ page }) => {
    await fillStep1(page);

    // The checkbox is hidden behind a CSS custom toggle — click the label
    await page.locator('label.switch:has(#billing-toggle)').click();

    await expect(page.locator('#yearly-label')).toHaveClass(/has-text-weight-bold/);
    await expect(page.locator('.free-label').first()).toBeVisible();
    await expect(page.locator('.plan-box[data-plan="Arcade"] p.has-text-grey')).toContainText('£90');
  });

  test('Step 2 – Go Back returns to Step 1', async ({ page }) => {
    await fillStep1(page);

    await page.getByRole('button', { name: 'Go Back' }).click();

    await expect(page.locator('#step-1')).not.toHaveClass(/hidden/);
    await expect(page.locator('#step-2')).toHaveClass(/hidden/);
  });

  test('Step 2 – advances to Step 3', async ({ page }) => {
    await fillStep1(page);
    await page.getByRole('button', { name: 'Next Step' }).click();

    await expect(page.locator('#step-3')).not.toHaveClass(/hidden/);
  });

  // ─── Step 3: Add-ons ─────────────────────────────────────────────────────

  test('Step 3 – all add-ons pre-selected by default', async ({ page }) => {
    await navigateTo(page, 3);

    const onlineCheckbox = page.locator('.addon-row[data-addon="Online service"] input[type="checkbox"]');
    const storageCheckbox = page.locator('.addon-row[data-addon="Larger storage"] input[type="checkbox"]');
    const profileCheckbox = page.locator('.addon-row[data-addon="Customizable Profile"] input[type="checkbox"]');

    await expect(onlineCheckbox).toBeChecked();
    await expect(storageCheckbox).toBeChecked();
    await expect(profileCheckbox).toBeChecked();
  });

  test('Step 3 – can toggle add-ons', async ({ page }) => {
    await navigateTo(page, 3);

    const onlineRow = page.locator('.addon-row[data-addon="Online service"]');
    const onlineCheckbox = onlineRow.locator('input[type="checkbox"]');

    await onlineRow.click();
    await expect(onlineCheckbox).not.toBeChecked();

    await onlineRow.click();
    await expect(onlineCheckbox).toBeChecked();
  });

  test('Step 3 – advances to Step 4', async ({ page }) => {
    await navigateTo(page, 3);
    await page.getByRole('button', { name: 'Next Step' }).click();

    await expect(page.locator('#step-4')).not.toHaveClass(/hidden/);
  });

  // ─── Step 4: Summary ─────────────────────────────────────────────────────

  test('Step 4 – shows correct plan and add-on totals (default)', async ({ page }) => {
    await navigateTo(page, 4);

    const summaryBox = page.locator('.summary-box');
    await expect(summaryBox).toContainText('Arcade (Monthly)');
    await expect(summaryBox).toContainText('£9');
    await expect(summaryBox).toContainText('Online service');
    await expect(summaryBox).toContainText('Larger storage');

    // Total: £9 + £1 + £2 + £2 = £14 (all 3 add-ons selected by default)
    await expect(page.locator('.total-row')).toContainText('£14');
  });

  test('Step 4 – Change link navigates back to Step 2', async ({ page }) => {
    await navigateTo(page, 4);

    await page.locator('#change-plan').click();

    await expect(page.locator('#step-2')).not.toHaveClass(/hidden/);
  });

  test('Step 4 – Go Back returns to Step 3', async ({ page }) => {
    await navigateTo(page, 4);
    await page.getByRole('button', { name: 'Go Back' }).click();

    await expect(page.locator('#step-3')).not.toHaveClass(/hidden/);
  });

  // ─── Step 5: Confirmation ─────────────────────────────────────────────────

  test('Full happy path – confirm shows thank you screen', async ({ page }) => {
    await navigateTo(page, 4);
    await page.getByRole('button', { name: 'Confirm' }).click();

    await expect(page.locator('#step-5')).not.toHaveClass(/hidden/);
    await expect(page.locator('#step-5')).toContainText('Thank you!');
    await expect(page.locator('#step-5')).toContainText('support@loremgaming.com');
  });

  // ─── Full flow with custom selections ────────────────────────────────────

  test('Full flow – Pro plan, yearly, all add-ons, GBP', async ({ page }) => {
    // Step 1
    await fillStep1(page);

    // Step 2: pick Pro, switch to yearly (click label — checkbox is CSS-hidden)
    await page.locator('.plan-box[data-plan="Pro"]').click();
    await page.locator('label.switch:has(#billing-toggle)').click();
    await page.getByRole('button', { name: 'Next Step' }).click();

    // Step 3: all add-ons already selected by default — just advance
    await page.getByRole('button', { name: 'Next Step' }).click();

    // Step 4: verify summary
    const summaryBox = page.locator('.summary-box');
    await expect(summaryBox).toContainText('Pro (Yearly)');
    await expect(summaryBox).toContainText('Online service');
    await expect(summaryBox).toContainText('Larger storage');
    await expect(summaryBox).toContainText('Customizable Profile');

    // Total: £150 + £10 + £20 + £20 = £200/yr
    await expect(page.locator('.total-row')).toContainText('£200');

    // Confirm
    await page.getByRole('button', { name: 'Confirm' }).click();
    await expect(page.locator('#step-5')).toContainText('Thank you!');
  });
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function fillStep1(page) {
  await page.fill('#name', 'Stephen King');
  await page.fill('#email', 'stephenking@lorem.com');
  await page.fill('#phone', '+1 234 567 890');
  await page.getByRole('button', { name: 'Next Step' }).click();
}

/** Navigate to a target step using default selections at each prior step. */
async function navigateTo(page, targetStep) {
  // Step 1
  if (targetStep < 2) return;
  await fillStep1(page);

  // Step 2
  if (targetStep < 3) return;
  await page.getByRole('button', { name: 'Next Step' }).click();

  // Step 3
  if (targetStep < 4) return;
  await page.getByRole('button', { name: 'Next Step' }).click();
}
