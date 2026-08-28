import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ics = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:family-dinner\r\nDTSTART;VALUE=DATE:20260828\r\nDTEND;VALUE=DATE:20260829\r\nSUMMARY:Family dinner\r\nLOCATION:At home\r\nEND:VEVENT\r\nEND:VCALENDAR`;

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('imports a calendar and adds/completes a responsibility', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await page.getByRole('button', { name: 'Import a calendar' }).click();
  await page.locator('#calendar-file').setInputFiles({ name: 'family.ics', mimeType: 'text/calendar', buffer: Buffer.from(ics) });
  await expect(page.getByText('family.ics is now on the board.')).toBeVisible();

  await page.getByRole('button', { name: 'Add responsibility' }).first().click();
  await page.getByLabel('What needs doing?').fill('Feed the cat');
  await page.getByLabel('Who is it for? Optional').fill('Everyone');
  await page.getByRole('button', { name: 'Add to the board' }).click();
  const checkbox = page.getByRole('checkbox', { name: /Feed the cat/ }).first();
  await page.getByText('Feed the cat', { exact: true }).first().click();
  await expect(checkbox).toBeChecked();
  await expect(page.getByText('Marked complete.')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('checkbox', { name: /Feed the cat/ }).first()).toBeChecked();
});

test('has useful privacy and empty mobile views', async ({ page }) => {
  await expect(page.getByText('Put the household day in one place.')).toBeVisible();
  await page.goto('/privacy');
  await expect(page.getByRole('heading', { name: 'Your household data stays here.' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
});

test('has no serious accessibility violations', async ({ page }) => {
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter(item => ['serious', 'critical'].includes(item.impact || ''));
  expect(blocking, blocking.map(item => `${item.id}: ${item.help}`).join('\n')).toEqual([]);

  await page.getByRole('button', { name: 'Calendars' }).click();
  await page.getByLabel('Display theme').selectOption('dark');
  await page.getByRole('button', { name: 'Close calendars' }).click();
  const darkResults = await new AxeBuilder({ page }).analyze();
  const darkBlocking = darkResults.violations.filter(item => ['serious', 'critical'].includes(item.impact || ''));
  expect(darkBlocking, darkBlocking.map(item => `${item.id}: ${item.help}`).join('\n')).toEqual([]);
});

test('loads without browser errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(errors).toEqual([]);
});
