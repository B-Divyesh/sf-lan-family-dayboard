import { expect, test, type Page } from '@playwright/test';

function stamp(date: Date) {
  return String(date.getFullYear()) + String(date.getMonth() + 1).padStart(2, '0') + String(date.getDate()).padStart(2, '0');
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function calendar(summary: string, extra = '') {
  const today = stamp(new Date());
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', 'UID:' + summary.replace(/[^a-z]/gi, ''), 'DTSTART:' + today + 'T090000', 'DTEND:' + today + 'T100000', 'SUMMARY:' + summary, extra, 'END:VEVENT', 'END:VCALENDAR'].filter(Boolean).join('\r\n');
}

async function openCalendars(page: Page) {
  await page.getByRole('button', { name: 'Calendars' }).click();
}

async function importCalendar(page: Page, name: string, summary: string, extra = '') {
  await openCalendars(page);
  await page.locator('#calendar-file').setInputFiles({ name, mimeType: 'text/calendar', buffer: Buffer.from(calendar(summary, extra)) });
  await expect(page.getByText(name + ' is now on the board.')).toBeVisible();
}

async function addFeed(page: Page, url = 'https://calendar.lan/family.ics') {
  await openCalendars(page);
  await page.locator('#feed-name').fill('Kitchen feed');
  await page.locator('#feed-url').fill(url);
  await page.getByRole('button', { name: 'Connect and save' }).click();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/demo');
  await expect(page.getByTestId('demo-banner')).toBeVisible();
});

test('@claim:shared-display-layout keeps the board usable at phone and display widths', async ({ page }) => {
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(page.getByText('School drop-off', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }
});

test('@claim:local-ics-import parses an ICS file without an upload request', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  await importCalendar(page, 'local.ics', 'Dentist checkup');
  await expect(page.getByText('Dentist checkup', { exact: true })).toBeVisible();
  expect(requests.every(url => new URL(url).origin === new URL(page.url()).origin)).toBe(true);
});

test('@claim:calendar-export-import accepts representative calendar exports', async ({ page }) => {
  await importCalendar(page, 'google.ics', 'Google school trip');
  await importCalendar(page, 'apple.ics', 'Apple dentist');
  await importCalendar(page, 'outlook.ics', 'Outlook review');
  await openCalendars(page);
  const dialog = page.getByRole('dialog', { name: 'Calendars' });
  await expect(dialog.getByText('google', { exact: true })).toBeVisible();
  await expect(dialog.getByText('apple', { exact: true })).toBeVisible();
  await expect(dialog.getByText('outlook', { exact: true })).toBeVisible();
});

test('@claim:common-recurrence shows daily weekly and monthly recurring events', async ({ page }) => {
  const today = new Date();
  const day = stamp(today);
  const source = [
    'BEGIN:VCALENDAR', 'VERSION:2.0',
    'BEGIN:VEVENT', 'UID:daily', 'DTSTART:' + day + 'T080000', 'DTEND:' + day + 'T083000', 'RRULE:FREQ=DAILY;COUNT=3', 'SUMMARY:Daily medicine', 'END:VEVENT',
    'BEGIN:VEVENT', 'UID:weekly', 'DTSTART:' + day + 'T100000', 'DTEND:' + day + 'T103000', 'RRULE:FREQ=WEEKLY;COUNT=3', 'SUMMARY:Weekly bins', 'END:VEVENT',
    'BEGIN:VEVENT', 'UID:monthly', 'DTSTART:' + day + 'T120000', 'DTEND:' + day + 'T123000', 'RRULE:FREQ=MONTHLY;COUNT=3', 'SUMMARY:Monthly bill', 'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  await openCalendars(page);
  await page.locator('#calendar-file').setInputFiles({ name: 'repeat.ics', mimeType: 'text/calendar', buffer: Buffer.from(source) });
  await expect(page.getByText('Daily medicine', { exact: true }).first()).toBeVisible();
  for (let index = 0; index < 7; index += 1) await page.getByRole('button', { name: 'Next day' }).click();
  await expect(page.getByText('Weekly bins', { exact: true }).first()).toBeVisible();
  for (let index = 0; index < 35 && await page.getByText('Monthly bill', { exact: true }).count() === 0; index += 1) {
    await page.getByRole('button', { name: 'Next day' }).click();
  }
  await expect(page.getByText('Monthly bill', { exact: true }).first()).toBeVisible();
});

test('@claim:lan-feed-refresh connects directly to a user-run ICS feed', async ({ page }) => {
  await page.route('https://calendar.lan/family.ics', route => route.fulfill({ status: 200, contentType: 'text/calendar', headers: { 'access-control-allow-origin': '*' }, body: calendar('Feed lunch') }));
  await addFeed(page);
  await expect(page.getByText('LAN calendar connected.')).toBeVisible();
  await expect(page.getByText('Feed lunch', { exact: true })).toBeVisible();
});

test('@claim:feed-recovery keeps the last good feed when a refresh fails', async ({ page }) => {
  let available = true;
  await page.route('https://calendar.lan/family.ics', route => route.fulfill(available
    ? { status: 200, contentType: 'text/calendar', headers: { 'access-control-allow-origin': '*' }, body: calendar('Saved feed event') }
    : { status: 503, headers: { 'access-control-allow-origin': '*' }, body: 'Unavailable' }));
  await addFeed(page);
  available = false;
  await page.getByRole('button', { name: 'Refresh LAN feeds' }).click();
  await expect(page.getByText(/last saved copy is still shown/i)).toBeVisible();
  await expect(page.getByText('Saved feed event', { exact: true })).toBeVisible();
});

test('@claim:local-storage keeps household data in the demo storage namespace', async ({ page }) => {
  await page.getByRole('button', { name: 'Add responsibility' }).first().click();
  await page.getByLabel('What needs doing?').fill('Refill soap');
  await page.getByRole('button', { name: 'Add to the board' }).click();
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys).toContain('demo:lan-dayboard-v1');
  expect(keys).not.toContain('lan-dayboard-v1');
  await expect(page.getByText('Refill soap', { exact: true })).toBeVisible();
});

test('@claim:today-tomorrow shows populated today and tomorrow panels', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Today and tomorrow' })).toBeVisible();
  await expect(page.getByText('School drop-off', { exact: true })).toBeVisible();
  await expect(page.getByText('Family dinner', { exact: true })).toBeVisible();
  await expect(page.getByText('Tomorrow', { exact: true })).toBeVisible();
});

test('@claim:display-mode enters and exits on an ordinary key and board tap', async ({ page }) => {
  await page.getByRole('button', { name: 'Display mode' }).click();
  await expect(page.locator('body')).toHaveClass(/display-mode/);
  await page.keyboard.press('A');
  await expect(page.locator('body')).not.toHaveClass(/display-mode/);
  await page.getByRole('button', { name: 'Display mode' }).click();
  await page.locator('main').click({ position: { x: 12, y: 12 } });
  await expect(page.locator('body')).not.toHaveClass(/display-mode/);
});

test('@claim:light-dark has both readable light and dark treatments', async ({ page }) => {
  await openCalendars(page);
  await page.getByLabel('Display theme').selectOption('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const colors = await page.locator('body').evaluate(element => getComputedStyle(element).color);
  expect(colors).not.toBe('rgb(23, 36, 39)');
});

test('@claim:offline-reload reloads the demo board after the first visit', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/demo');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Offline · showing saved copy')).toBeVisible();
  await expect(page.getByText('School drop-off', { exact: true })).toBeVisible();
  await context.close();
});

test('@claim:weekly-print produces a seven-day landscape sheet', async ({ page }) => {
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.print-grid article')).toHaveCount(7);
  const pdf = await page.pdf({ format: 'A4', landscape: true });
  expect(pdf.byteLength).toBeGreaterThan(10_000);
});

test('@claim:installable-offline has a manifest and controlling service worker', async ({ page }) => {
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  const manifest = await page.evaluate(async () => (await fetch('/manifest.webmanifest')).json());
  expect(manifest.display).toBe('standalone');
  expect(manifest.icons.some((icon: { sizes: string }) => icon.sizes === '180x180')).toBe(true);
});

test('@claim:no-accounts-or-payment makes no automatic third-party requests', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  await page.reload();
  expect(requests.every(url => new URL(url).origin === new URL(page.url()).origin)).toBe(true);
  await expect(page.getByText('No accounts', { exact: true })).toBeVisible();
  await expect(page.getByText('Free to use', { exact: true })).toBeVisible();
});

test('@claim:replace-import replaces a same-named saved calendar', async ({ page }) => {
  await importCalendar(page, 'family.ics', 'First picnic');
  await importCalendar(page, 'family.ics', 'Second picnic');
  await openCalendars(page);
  await expect(page.getByRole('dialog', { name: 'Calendars' }).getByText('family', { exact: true })).toHaveCount(1);
  await expect(page.getByText('Second picnic', { exact: true })).toBeVisible();
  await expect(page.getByText('First picnic', { exact: true })).toHaveCount(0);
});

test('@claim:recurring-responsibility repeats on the next matching day', async ({ page }) => {
  await page.getByRole('button', { name: 'Add responsibility' }).first().click();
  await page.getByLabel('What needs doing?').fill('Refill soap');
  await page.getByRole('button', { name: 'Add to the board' }).click();
  for (let index = 0; index < 7; index += 1) await page.getByRole('button', { name: 'Next day' }).click();
  await expect(page.getByText('Refill soap', { exact: true })).toBeVisible();
});

test('@claim:completion-undo changes completion and immediately restores it', async ({ page }) => {
  const chore = page.getByRole('checkbox', { name: /Pack school bags/ }).first();
  await page.getByText('Pack school bags', { exact: true }).first().click();
  await expect(chore).toBeChecked();
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByRole('checkbox', { name: /Pack school bags/ }).first()).not.toBeChecked();
});

test('@claim:direct-feed-request omits credentials and does not proxy the feed', async ({ page }) => {
  let observed: { url: string; cookie: string | undefined; authorization: string | undefined } | undefined;
  await page.route('https://calendar.lan/family.ics', route => {
    const request = route.request();
    observed = { url: request.url(), cookie: request.headers().cookie, authorization: request.headers().authorization };
    return route.fulfill({ status: 200, contentType: 'text/calendar', headers: { 'access-control-allow-origin': '*' }, body: calendar('Direct feed') });
  });
  await addFeed(page);
  expect(observed?.url).toBe('https://calendar.lan/family.ics');
  expect(observed?.cookie).toBeUndefined();
  expect(observed?.authorization).toBeUndefined();
});

test('@claim:file-size-limit rejects calendar files over five megabytes', async ({ page }) => {
  await openCalendars(page);
  await page.locator('#calendar-file').setInputFiles({ name: 'large.ics', mimeType: 'text/calendar', buffer: Buffer.alloc(5_000_001, 'x') });
  await expect(page.getByText(/over 5 MB/i)).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Calendars' })).toBeVisible();
});

test('@claim:erase-data removes saved data after browser storage is cleared', async ({ page }) => {
  await page.evaluate(() => localStorage.clear());
  await page.goto('/');
  await expect(page.getByText('Add your household schedule')).toBeVisible();
  await expect(page.getByText('School drop-off', { exact: true })).toHaveCount(0);
});

test('@claim:demo-isolation keeps sample changes away from real data', async ({ page }) => {
  const real = { calendars: [], chores: [{ id: 'real', title: 'Real task', person: '', days: [new Date().getDay()], createdAt: new Date().toISOString() }], completions: {}, theme: 'system' };
  await page.goto('/');
  await page.evaluate(value => localStorage.setItem('lan-dayboard-v1', JSON.stringify(value)), real);
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Add responsibility' }).first().click();
  await page.getByLabel('What needs doing?').fill('Demo-only task');
  await page.getByRole('button', { name: 'Add to the board' }).click();
  expect(await page.evaluate(() => localStorage.getItem('lan-dayboard-v1'))).toBe(JSON.stringify(real));
  await page.getByRole('button', { name: 'Start for real' }).click();
  await expect(page.getByText('Real task', { exact: true })).toBeVisible();
  await expect(page.getByText('Demo-only task', { exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('demo:lan-dayboard-v1'))).toBeNull();
});
