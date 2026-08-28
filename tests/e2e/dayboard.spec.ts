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

test('undoes a completed responsibility and persists the reversal', async ({ page }) => {
  await page.getByRole('button', { name: 'Add responsibility' }).first().click();
  await page.getByLabel('What needs doing?').fill('Put out recycling');
  await page.getByRole('button', { name: 'Add to the board' }).click();

  const checkbox = page.getByRole('checkbox', { name: /Put out recycling/ }).first();
  await page.getByText('Put out recycling', { exact: true }).first().click();
  await expect(checkbox).toBeChecked();
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByRole('checkbox', { name: /Put out recycling/ }).first()).not.toBeChecked();

  await page.reload();
  await expect(page.getByRole('checkbox', { name: /Put out recycling/ }).first()).not.toBeChecked();
});

test('rejects and announces a whitespace-only responsibility name', async ({ page }) => {
  await page.getByRole('button', { name: 'Add responsibility' }).first().click();
  const name = page.getByLabel('What needs doing?');
  await name.fill('   ');
  await page.getByRole('button', { name: 'Add to the board' }).click();

  await expect(page.getByRole('alert').filter({ hasText: 'Enter a name for this responsibility.' })).toBeVisible();
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByRole('dialog', { name: 'Add a responsibility' })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('lan-dayboard-v1') || '{"chores":[]}').chores)).toEqual([]);

  await page.reload();
  await expect(page.getByText('Put the household day in one place.')).toBeVisible();
});

test('keeps the LAN feed refresh control at least 44px in both dimensions', async ({ page }) => {
  await page.evaluate(calendarText => localStorage.setItem('lan-dayboard-v1', JSON.stringify({
    calendars: [{ name: 'Kitchen', ics: calendarText, source: 'feed', feedUrl: 'https://calendar.lan/family.ics', importedAt: new Date().toISOString() }],
    chores: [], completions: {}, theme: 'system'
  })), ics);
  await page.reload();

  const size = await page.getByRole('button', { name: 'Refresh LAN feeds' }).evaluate(element => {
    const rect = element.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });
  expect(size.width).toBeGreaterThanOrEqual(44);
  expect(size.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
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
