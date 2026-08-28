import './style.css';
import { parseICS } from './ics';
import { clearState, loadState, saveState } from './storage';
import type { CalendarEvent, Chore, DayboardState, StoredCalendar } from './types';

const app = document.querySelector<HTMLDivElement>('#app')!;
const dateTime = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
const shortDate = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
const timeOnly = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
let state: DayboardState = loadState();
let selectedDate = startOfDay(new Date());
let lastCompleted: { choreId: string; date: string } | null = null;
let feedBusy = false;

function escapeHTML(value = '') {
  return value.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]!));
}

function startOfDay(date: Date) { const next = new Date(date); next.setHours(0, 0, 0, 0); return next; }
function addDays(date: Date, days: number) { const next = new Date(date); next.setDate(next.getDate() + days); return next; }
function dayKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function hash(value = '') { return [...value].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) | 0, 0); }
function sameDay(a: Date, b: Date) { return dayKey(a) === dayKey(b); }

function persist(message?: string) {
  try { saveState(state); if (message) announce(message); }
  catch { announce('This browser could not save the change. Free some local storage and try again.', true); }
}

function announce(message: string, isError = false, undo = false) {
  const region = document.querySelector<HTMLElement>('#status');
  if (!region) return;
  region.className = `toast ${isError ? 'is-error' : ''}`;
  region.innerHTML = `<span>${escapeHTML(message)}</span>${undo ? '<button type="button" data-action="undo-chore">Undo</button>' : ''}`;
  region.hidden = false;
  window.setTimeout(() => { if (region.textContent?.includes(message)) region.hidden = true; }, 6000);
}

function themeClass() {
  document.documentElement.dataset.theme = state.theme;
}

function parseAll(from = selectedDate, days = 8) {
  const events: CalendarEvent[] = [];
  const errors: string[] = [];
  const rangeEnd = addDays(startOfDay(from), days);
  for (const calendar of state.calendars) {
    try { events.push(...parseICS(calendar.ics, startOfDay(from), rangeEnd, calendar.name)); }
    catch (error) { errors.push(`${calendar.name}: ${error instanceof Error ? error.message : 'Could not read calendar.'}`); }
  }
  return { events: events.sort((a, b) => a.start.getTime() - b.start.getTime()), errors };
}

function eventsForDay(events: CalendarEvent[], date: Date) {
  const start = startOfDay(date);
  const end = addDays(start, 1);
  return events.filter(event => event.start < end && event.end > start);
}

function choresForDay(date: Date) { return state.chores.filter(chore => chore.days.includes(date.getDay())); }
function isComplete(chore: Chore, date: Date) { return state.completions[dayKey(date)]?.includes(chore.id) ?? false; }

function eventTime(event: CalendarEvent, date: Date) {
  if (event.allDay) return 'All day';
  const prefix = event.start < startOfDay(date) ? 'Continues · ' : '';
  return `${prefix}${timeOnly.format(event.start)}–${timeOnly.format(event.end)}`;
}

function eventMarkup(event: CalendarEvent, date: Date) {
  const owner = Math.abs(hash(event.calendar)) % 5;
  return `<li class="event owner-${owner}">
    <div class="event-time">${escapeHTML(eventTime(event, date))}</div>
    <div class="event-body">
      <strong>${escapeHTML(event.title)}</strong>
      ${event.location ? `<span class="event-detail"><span aria-hidden="true">↗</span> ${escapeHTML(event.location)}</span>` : ''}
      <span class="calendar-label"><span class="owner-dot" aria-hidden="true"></span>${escapeHTML(event.calendar)}</span>
    </div>
  </li>`;
}

function choreMarkup(chore: Chore, date: Date, compact = false) {
  const complete = isComplete(chore, date);
  return `<li class="chore ${complete ? 'is-complete' : ''}">
    <label>
      <input type="checkbox" data-action="toggle-chore" data-id="${escapeHTML(chore.id)}" data-date="${dayKey(date)}" ${complete ? 'checked' : ''}>
      <span class="checkmark" aria-hidden="true"></span>
      <span><strong>${escapeHTML(chore.title)}</strong>${chore.person ? `<small>${escapeHTML(chore.person)}</small>` : ''}</span>
    </label>
    ${compact ? '' : `<button class="icon-button" type="button" data-action="delete-chore" data-id="${escapeHTML(chore.id)}" aria-label="Delete ${escapeHTML(chore.title)}">×</button>`}
  </li>`;
}

function dayPanel(date: Date, events: CalendarEvent[], label: string) {
  const headingId = `${label.toLowerCase().replace(/\s+/g, '-')}-heading`;
  const todayEvents = eventsForDay(events, date);
  const chores = choresForDay(date);
  return `<section class="day-panel" aria-labelledby="${headingId}">
    <div class="day-heading">
      <p class="eyebrow">${label}</p>
      <h2 id="${headingId}">${dateTime.format(date)}</h2>
      ${sameDay(date, new Date()) ? '<span class="now-badge">Now</span>' : ''}
    </div>
    <div class="schedule-block">
      <h3>On the calendar <span>${todayEvents.length}</span></h3>
      ${todayEvents.length ? `<ol class="event-list">${todayEvents.map(event => eventMarkup(event, date)).join('')}</ol>` : `<div class="quiet-state"><span aria-hidden="true">○</span><p>No shared events. The day is open.</p></div>`}
    </div>
    <div class="chore-block">
      <h3>Responsibilities <span>${chores.filter(chore => !isComplete(chore, date)).length} left</span></h3>
      ${chores.length ? `<ul class="chore-list">${chores.map(chore => choreMarkup(chore, date)).join('')}</ul>` : '<p class="muted">Nothing assigned for this day.</p>'}
    </div>
  </section>`;
}

function emptyState() {
  return `<section class="empty-state" aria-labelledby="empty-title">
    <picture>
      <source media="(max-width: 720px)" srcset="/assets/day-orbit-720.webp" type="image/webp">
      <source srcset="/assets/day-orbit.webp" type="image/webp">
      <img src="/assets/day-orbit.jpg" width="1200" height="800" alt="Paper-cut circles and household symbols meeting in one shared orbit" fetchpriority="high" decoding="async">
    </picture>
    <div class="empty-copy">
      <p class="eyebrow">Private by design</p>
      <h2 id="empty-title">Put the household day in one place.</h2>
      <p>Import a calendar file, add recurring responsibilities, or connect a calendar feed running on your own network. Everything stays in this browser.</p>
      <div class="button-row">
        <button class="primary" type="button" data-action="open-import">Import a calendar</button>
        <button type="button" data-action="open-chore">Add a responsibility</button>
      </div>
    </div>
  </section>`;
}

function weekPrint(events: CalendarEvent[]) {
  const monday = startOfDay(selectedDate);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const days = Array.from({ length: 7 }, (_, index) => addDays(monday, index));
  return `<section class="print-week" aria-hidden="true"><header><strong>Our week</strong><span>${shortDate.format(monday)} – ${shortDate.format(days[6])}</span></header>
    <div class="print-grid">${days.map(date => {
      const dayEvents = eventsForDay(events, date);
      const chores = choresForDay(date);
      return `<article><h2>${shortDate.format(date)}</h2>${dayEvents.length ? `<ul>${dayEvents.map(event => `<li><b>${escapeHTML(event.allDay ? 'All day' : timeOnly.format(event.start))}</b> ${escapeHTML(event.title)}</li>`).join('')}</ul>` : '<p>Open day</p>'}${chores.length ? `<h3>Responsibilities</h3><ul>${chores.map(chore => `<li>□ ${escapeHTML(chore.title)}${chore.person ? ` — ${escapeHTML(chore.person)}` : ''}</li>`).join('')}</ul>` : ''}</article>`;
    }).join('')}</div><footer>Printed from LAN Family Dayboard · ${new Date().toLocaleString()}</footer></section>`;
}

function renderApp() {
  themeClass();
  const { events, errors } = parseAll(addDays(selectedDate, -6), 15);
  const hasContent = state.calendars.length || state.chores.length;
  const next = addDays(selectedDate, 1);
  app.innerHTML = `<header class="site-header">
    <div class="brand"><a href="/" aria-label="LAN Family Dayboard home"><span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span><span>LAN <b>Family Dayboard</b></span></a><small>No account · saved on this display</small></div>
    <nav aria-label="Dayboard actions">
      <button type="button" data-action="open-chore"><span aria-hidden="true">＋</span> Add responsibility</button>
      <button type="button" data-action="open-import"><span aria-hidden="true">↥</span> Calendars</button>
      <button type="button" data-action="print"><span aria-hidden="true">▤</span> Print week</button>
      <button class="display-button" type="button" data-action="display"><span aria-hidden="true">⌗</span> Display mode</button>
    </nav>
  </header>
  <main id="main" tabindex="-1">
    <div class="date-toolbar" aria-label="Choose day">
      <div><p class="eyebrow">Shared view</p><h1>${sameDay(selectedDate, new Date()) ? 'Today at home' : shortDate.format(selectedDate)}</h1></div>
      <div class="date-controls">
        <button class="icon-button" type="button" data-action="previous" aria-label="Previous day">←</button>
        <button type="button" data-action="today">Today</button>
        <button class="icon-button" type="button" data-action="next" aria-label="Next day">→</button>
      </div>
    </div>
    <div class="connection-line"><span class="connection-dot" aria-hidden="true"></span><span id="connection-text">Available offline</span><span>·</span><time id="clock">${timeOnly.format(new Date())}</time>${state.calendars.some(c => c.source === 'feed') ? `<button type="button" class="text-button" data-action="refresh" ${feedBusy ? 'disabled' : ''}>${feedBusy ? 'Refreshing…' : 'Refresh LAN feeds'}</button>` : ''}</div>
    ${errors.length ? `<div class="error-banner" role="alert"><strong>Some calendar items could not be shown.</strong><ul>${errors.map(error => `<li>${escapeHTML(error)}</li>`).join('')}</ul><button type="button" data-action="open-import">Review calendars</button></div>` : ''}
    ${hasContent ? `<div class="day-grid">${dayPanel(selectedDate, events, sameDay(selectedDate, new Date()) ? 'Today' : 'Selected day')}${dayPanel(next, events, sameDay(next, addDays(new Date(), 1)) ? 'Tomorrow' : 'Following day')}</div>` : emptyState()}
  </main>
  <footer class="site-footer"><p>Made for the room, not the cloud.</p><nav aria-label="Legal and project information"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="https://github.com/B-Divyesh/sf-lan-family-dayboard">Source</a></nav><small>Illustration generated for this project.</small></footer>
  ${dialogs()}
  <div id="status" class="toast" role="status" aria-live="polite" hidden></div>
  ${weekPrint(events)}`;
  bindEvents();
  updateConnectivity();
}

function dialogs() {
  const calendars = state.calendars.map((calendar, index) => `<li><span><strong>${escapeHTML(calendar.name)}</strong><small>${calendar.source === 'feed' ? 'LAN feed' : 'Imported file'} · ${new Date(calendar.importedAt).toLocaleString()}</small></span><button class="icon-button" type="button" data-action="remove-calendar" data-index="${index}" aria-label="Remove ${escapeHTML(calendar.name)}">×</button></li>`).join('');
  return `<dialog id="import-dialog" aria-labelledby="import-title"><form method="dialog" class="dialog-shell"><div class="dialog-heading"><div><p class="eyebrow">Local calendar</p><h2 id="import-title">Calendars</h2></div><button class="icon-button" value="cancel" aria-label="Close calendars">×</button></div>
    <div class="import-drop"><label for="calendar-file"><span class="import-icon" aria-hidden="true">↥</span><strong>Choose an ICS file</strong><small>It is read here and never uploaded.</small></label><input id="calendar-file" type="file" accept=".ics,text/calendar"></div>
    <div class="or"><span>or connect a user-run LAN feed</span></div>
    <div class="field"><label for="feed-name">Calendar name</label><input id="feed-name" name="feed-name" autocomplete="off" placeholder="Kitchen calendar"></div>
    <div class="field"><label for="feed-url">ICS feed address</label><input id="feed-url" name="feed-url" type="url" inputmode="url" autocomplete="off" placeholder="http://home-server.local/family.ics"><small>The feed must allow browser access. Credentials are not supported.</small></div>
    <button class="primary" type="button" data-action="add-feed">Connect and save</button>
    <div class="field"><label for="display-theme">Display theme</label><select id="display-theme"><option value="system" ${state.theme === 'system' ? 'selected' : ''}>Follow this device</option><option value="light" ${state.theme === 'light' ? 'selected' : ''}>Light paper</option><option value="dark" ${state.theme === 'dark' ? 'selected' : ''}>Dim room</option></select></div>
    ${calendars ? `<div class="saved-list"><h3>On this display</h3><ul>${calendars}</ul></div>` : ''}
  </form></dialog>
  <dialog id="chore-dialog" aria-labelledby="chore-title"><form id="chore-form" class="dialog-shell"><div class="dialog-heading"><div><p class="eyebrow">Shared responsibility</p><h2 id="chore-title">Add a responsibility</h2></div><button class="icon-button" type="button" data-action="close-chore" aria-label="Close responsibility form">×</button></div>
    <div class="field"><label for="chore-name">What needs doing?</label><input id="chore-name" name="title" required maxlength="80" autocomplete="off" placeholder="Water the plants"></div>
    <div class="field"><label for="chore-person">Who is it for? <span>Optional</span></label><input id="chore-person" name="person" maxlength="40" autocomplete="off" placeholder="Sam or everyone"></div>
    <fieldset><legend>Repeat on</legend><div class="day-checks">${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day, index) => `<label><input type="checkbox" name="days" value="${index}" ${index === selectedDate.getDay() ? 'checked' : ''}><span>${day}</span></label>`).join('')}</div><p class="field-error" id="days-error" role="alert" hidden>Choose at least one day.</p></fieldset>
    <button class="primary" type="submit">Add to the board</button>
  </form></dialog>`;
}

function legalPage(kind: 'privacy' | 'terms') {
  const privacy = kind === 'privacy';
  document.title = `${privacy ? 'Privacy' : 'Terms'} · LAN Family Dayboard`;
  app.innerHTML = `<header class="site-header"><div class="brand"><a href="/"><span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span><span>LAN <b>Family Dayboard</b></span></a></div></header><main id="main" class="legal"><a class="back-link" href="/">← Back to dayboard</a><p class="eyebrow">Plain-language ${kind}</p><h1>${privacy ? 'Your household data stays here.' : 'Terms of use'}</h1>${privacy ? `<p class="lede">LAN Family Dayboard has no accounts, analytics, advertising, or remote database.</p><h2>What is stored</h2><p>Imported calendar contents, LAN feed addresses, responsibilities, completion history, and display preferences are stored only in this browser’s local storage. Calendar files are parsed on the device.</p><h2>Network access</h2><p>The app contacts an address only when you ask it to refresh a LAN feed. Your browser sends that request directly. We do not proxy it or receive its contents. Installing the app may request its own static files for offline use.</p><h2>Your control</h2><p>Remove individual calendars from Calendars, or clear site data in your browser to erase everything. Exported or printed copies are yours to manage.</p>` : `<p class="lede">This free, open-source utility is provided for household coordination.</p><h2>Use</h2><p>You may use, copy, and modify the software under the MIT license. You are responsible for the calendar files and feed addresses you choose to open.</p><h2>No warranty</h2><p>The dayboard is provided “as is,” without warranties. Check the source calendar before relying on it for safety-critical, medical, travel, or legal appointments.</p><h2>Feed compatibility</h2><p>LAN feeds must be valid ICS and allow browser requests. Browser security may block insecure HTTP feeds when the dayboard itself is served over HTTPS.</p>`}<p class="legal-date">Effective 28 August 2026</p></main><footer class="site-footer"><p>Made for the room, not the cloud.</p></footer>`;
}

function bindEvents() {
  app.querySelectorAll<HTMLElement>('[data-action]').forEach(element => element.addEventListener('click', handleAction));
  document.querySelector<HTMLInputElement>('#calendar-file')?.addEventListener('change', importFile);
  document.querySelector<HTMLSelectElement>('#display-theme')?.addEventListener('change', changeTheme);
  document.querySelector<HTMLFormElement>('#chore-form')?.addEventListener('submit', addChore);
}

async function handleAction(event: Event) {
  const target = event.currentTarget as HTMLElement;
  const action = target.dataset.action;
  if (action === 'open-import') (document.querySelector('#import-dialog') as HTMLDialogElement).showModal();
  if (action === 'open-chore') (document.querySelector('#chore-dialog') as HTMLDialogElement).showModal();
  if (action === 'close-chore') (document.querySelector('#chore-dialog') as HTMLDialogElement).close();
  if (action === 'previous' || action === 'next') { selectedDate = addDays(selectedDate, action === 'next' ? 1 : -1); renderApp(); }
  if (action === 'today') { selectedDate = startOfDay(new Date()); renderApp(); }
  if (action === 'print') window.print();
  if (action === 'display') toggleDisplay();
  if (action === 'refresh') await refreshFeeds();
  if (action === 'add-feed') await addFeed();
  if (action === 'toggle-chore') toggleChore(target as HTMLInputElement);
  if (action === 'delete-chore') deleteChore(target.dataset.id!);
  if (action === 'remove-calendar') removeCalendar(Number(target.dataset.index));
  if (action === 'undo-chore' && lastCompleted) { toggleCompletion(lastCompleted.choreId, lastCompleted.date); lastCompleted = null; renderApp(); announce('Completion undone.'); }
}

async function importFile(event: Event) {
  const input = event.currentTarget as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  if (file.size > 5_000_000) { announce('That file is over 5 MB. Export a smaller calendar range and try again.', true); return; }
  try {
    const ics = await file.text();
    parseICS(ics, startOfDay(selectedDate), addDays(selectedDate, 366), file.name);
    const name = file.name.replace(/\.ics$/i, '') || 'Imported calendar';
    const replacement = { name, ics, source: 'file' as const, importedAt: new Date().toISOString() };
    const existing = state.calendars.findIndex(calendar => calendar.source === 'file' && calendar.name === name);
    if (existing >= 0) state.calendars.splice(existing, 1, replacement);
    else state.calendars.push(replacement);
    persist();
    (document.querySelector('#import-dialog') as HTMLDialogElement).close();
    renderApp(); announce(`${file.name} is now on the board.`);
  } catch (error) { announce(error instanceof Error ? error.message : 'The calendar could not be read.', true); }
}

function changeTheme(event: Event) {
  state.theme = (event.currentTarget as HTMLSelectElement).value as DayboardState['theme'];
  persist('Display theme saved.');
  themeClass();
}

async function fetchFeed(url: string) {
  const response = await fetch(url, { cache: 'no-store', credentials: 'omit', redirect: 'follow' });
  if (!response.ok) throw new Error(`The feed answered with ${response.status}. Check its address and sharing settings.`);
  const text = await response.text();
  parseICS(text, startOfDay(selectedDate), addDays(selectedDate, 366));
  return text;
}

async function addFeed() {
  const name = (document.querySelector<HTMLInputElement>('#feed-name')?.value || '').trim();
  const url = (document.querySelector<HTMLInputElement>('#feed-url')?.value || '').trim();
  if (!url) { announce('Enter the address of an ICS feed on your network.', true); return; }
  let parsed: URL;
  try { parsed = new URL(url); } catch { announce('Enter a complete feed address, such as http://home-server.local/family.ics.', true); return; }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) { announce('Use an HTTP or HTTPS address without a username or password.', true); return; }
  try {
    const ics = await fetchFeed(parsed.href);
    state.calendars.push({ name: name || parsed.hostname, ics, source: 'feed', feedUrl: parsed.href, importedAt: new Date().toISOString() });
    persist(); (document.querySelector('#import-dialog') as HTMLDialogElement).close(); renderApp(); announce('LAN calendar connected.');
  } catch (error) { announce(`${error instanceof Error ? error.message : 'Could not reach that feed'} Your server may need an Access-Control-Allow-Origin header.`, true); }
}

async function refreshFeeds() {
  const feeds = state.calendars.filter(calendar => calendar.source === 'feed' && calendar.feedUrl);
  if (!feeds.length) return;
  feedBusy = true; renderApp();
  let updated = 0; const failures: string[] = [];
  await Promise.all(feeds.map(async calendar => {
    try { calendar.ics = await fetchFeed(calendar.feedUrl!); calendar.importedAt = new Date().toISOString(); updated += 1; }
    catch { failures.push(calendar.name); }
  }));
  feedBusy = false; persist(); renderApp();
  if (failures.length) announce(`Could not refresh ${failures.join(', ')}. The last saved copy is still shown.`, true);
  else announce(`${updated} LAN ${updated === 1 ? 'calendar' : 'calendars'} refreshed.`);
}

function addChore(event: SubmitEvent) {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const data = new FormData(form);
  const days = data.getAll('days').map(Number);
  const error = form.querySelector<HTMLElement>('#days-error')!;
  if (!days.length) { error.hidden = false; return; }
  error.hidden = true;
  state.chores.push({ id: crypto.randomUUID(), title: String(data.get('title')).trim(), person: String(data.get('person')).trim(), days, createdAt: new Date().toISOString() });
  persist(); (document.querySelector('#chore-dialog') as HTMLDialogElement).close(); renderApp(); announce('Responsibility added.');
}

function toggleCompletion(id: string, date: string) {
  const done = state.completions[date] ||= [];
  state.completions[date] = done.includes(id) ? done.filter(item => item !== id) : [...done, id];
  if (!state.completions[date].length) delete state.completions[date];
  persist();
}

function toggleChore(input: HTMLInputElement) {
  const id = input.dataset.id!; const date = input.dataset.date!;
  toggleCompletion(id, date);
  if (input.checked) { lastCompleted = { choreId: id, date }; renderApp(); announce('Marked complete.', false, true); }
  else { lastCompleted = null; renderApp(); announce('Marked not complete.'); }
}

function deleteChore(id: string) {
  const chore = state.chores.find(item => item.id === id);
  if (!chore || !window.confirm(`Remove “${chore.title}” from every day?`)) return;
  state.chores = state.chores.filter(item => item.id !== id);
  for (const key of Object.keys(state.completions)) state.completions[key] = state.completions[key].filter(item => item !== id);
  persist(); renderApp(); announce('Responsibility removed.');
}

function removeCalendar(index: number) {
  const calendar = state.calendars[index];
  if (!calendar || !window.confirm(`Remove “${calendar.name}” and its events from this display?`)) return;
  state.calendars.splice(index, 1); persist(); renderApp(); announce('Calendar removed.');
}

function toggleDisplay() {
  document.body.classList.toggle('display-mode');
  if (document.body.classList.contains('display-mode')) document.documentElement.requestFullscreen?.().catch(() => undefined);
  else if (document.fullscreenElement) document.exitFullscreen?.().catch(() => undefined);
}

function updateConnectivity() {
  const text = document.querySelector('#connection-text');
  const dot = document.querySelector('.connection-dot');
  if (text) text.textContent = navigator.onLine ? 'Available offline' : 'Offline · showing saved copy';
  dot?.classList.toggle('is-offline', !navigator.onLine);
}

const route = location.pathname.replace(/\/$/, '');
if (route === '/privacy' || route === '/terms') legalPage(route.slice(1) as 'privacy' | 'terms');
else renderApp();

window.addEventListener('online', updateConnectivity);
window.addEventListener('offline', updateConnectivity);
window.addEventListener('keydown', event => {
  if ((event.target as HTMLElement).matches('input, textarea, select')) return;
  if (event.key.toLowerCase() === 'd') toggleDisplay();
  if (event.key === 'Escape' && document.body.classList.contains('display-mode')) toggleDisplay();
});
window.setInterval(() => {
  const clock = document.querySelector('#clock');
  if (clock) clock.textContent = timeOnly.format(new Date());
}, 30_000);
if ('serviceWorker' in navigator && import.meta.env.PROD) navigator.serviceWorker.register('/sw.js').catch(() => undefined);

// Exposed only for the privacy page's future local erase affordance and automated smoke tests.
export function eraseLocalData() { clearState(); state = loadState(); renderApp(); }
