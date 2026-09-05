import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const calendar = (name: string) => {
  const today = new Date();
  const day = String(today.getFullYear()) + String(today.getMonth() + 1).padStart(2, '0') + String(today.getDate()).padStart(2, '0');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', 'UID:' + name, 'DTSTART:' + day + 'T090000', 'DTEND:' + day + 'T100000', 'SUMMARY:' + name, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
};

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('keeps a prior calendar after browser storage rejects a later save', async ({ page }) => {
  await page.evaluate(() => {
    const nativeSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key: string, value: string) {
      if (key === 'lan-dayboard-v1' && value.includes('"second"')) throw new DOMException('Quota exceeded', 'QuotaExceededError');
      return nativeSetItem.call(this, key, value);
    };
  });
  await page.getByRole('button', { name: 'Import a calendar' }).first().click();
  await page.locator('#calendar-file').setInputFiles({ name: 'first.ics', mimeType: 'text/calendar', buffer: Buffer.from(calendar('First appointment')) });
  await expect(page.getByText('first.ics is now on the board.')).toBeVisible();

  await page.getByRole('button', { name: 'Calendars' }).click();
  await page.locator('#calendar-file').setInputFiles({ name: 'second.ics', mimeType: 'text/calendar', buffer: Buffer.from(calendar('Second appointment')) });
  await expect(page.getByText(/could not save the change/i)).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Calendars' })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('lan-dayboard-v1') || '{}').calendars.map((item: { name: string }) => item.name))).toEqual(['first']);

  await page.reload();
  await expect(page.getByText('First appointment', { exact: true })).toBeVisible();
  await expect(page.getByText('Second appointment', { exact: true })).toHaveCount(0);
});

test('has named, full-size mobile legal links without serious axe violations', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ['/privacy', '/terms']) {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter(item => ['serious', 'critical'].includes(item.impact || ''));
    expect(serious, serious.map(item => item.id).join(', ')).toEqual([]);
    for (const link of [page.getByRole('link', { name: 'LAN Family Dayboard home' }), page.getByRole('link', { name: 'Privacy' }).last(), page.getByRole('link', { name: 'Terms' }), page.getByRole('link', { name: 'Back to dayboard' })]) {
      const box = await link.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  }
});

test('renders a designed not-found page with its own title', async ({ page }) => {
  await page.goto('/not-a-real-route-qa');
  await expect(page).toHaveTitle('Page not found — LAN Family Dayboard');
  await expect(page.getByRole('heading', { name: 'This page is not on the dayboard' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Go to the dayboard' })).toBeVisible();
});
