import type { CalendarEvent } from './types';

type Property = { name: string; params: Record<string, string>; value: string };
type RawEvent = Record<string, Property[]>;

const DAY_CODES: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

function unfold(input: string) {
  return input.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '').split(/\r?\n/);
}

function property(line: string): Property | null {
  const separator = line.indexOf(':');
  if (separator < 1) return null;
  const [rawName, ...rawParams] = line.slice(0, separator).split(';');
  const params: Record<string, string> = {};
  for (const part of rawParams) {
    const equals = part.indexOf('=');
    if (equals > 0) params[part.slice(0, equals).toUpperCase()] = part.slice(equals + 1).replace(/^"|"$/g, '');
  }
  return { name: rawName.toUpperCase(), params, value: line.slice(separator + 1) };
}

function unescapeText(value = '') {
  return value.replace(/\\[nN]/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\').trim();
}

function zonedDate(parts: number[], timeZone?: string) {
  const [year, month, day, hour = 0, minute = 0, second = 0] = parts;
  if (!timeZone) return new Date(year, month - 1, day, hour, minute, second);
  try {
    let guess = Date.UTC(year, month - 1, day, hour, minute, second);
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
    });
    for (let i = 0; i < 2; i += 1) {
      const found = Object.fromEntries(formatter.formatToParts(new Date(guess)).map(item => [item.type, item.value]));
      const shown = Date.UTC(+found.year, +found.month - 1, +found.day, +found.hour, +found.minute, +found.second);
      guess += Date.UTC(year, month - 1, day, hour, minute, second) - shown;
    }
    return new Date(guess);
  } catch {
    return new Date(year, month - 1, day, hour, minute, second);
  }
}

function parseDate(prop?: Property): { date: Date; allDay: boolean } | null {
  if (!prop) return null;
  const raw = prop.value.trim();
  const match = raw.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?)?(Z)?$/);
  if (!match) return null;
  const parts = match.slice(1, 7).map(value => +(value || 0));
  const allDay = !match[4] || prop.params.VALUE?.toUpperCase() === 'DATE';
  const date = match[7]
    ? new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5]))
    : zonedDate(parts, prop.params.TZID);
  return { date, allDay };
}

function add(date: Date, unit: 'day' | 'week' | 'month' | 'year', amount: number) {
  const next = new Date(date);
  if (unit === 'year') next.setFullYear(next.getFullYear() + amount);
  else if (unit === 'month') next.setMonth(next.getMonth() + amount);
  else next.setDate(next.getDate() + amount * (unit === 'week' ? 7 : 1));
  return next;
}

function recurStarts(start: Date, ruleValue: string, rangeStart: Date, rangeEnd: Date) {
  const rule = Object.fromEntries(ruleValue.split(';').map(bit => bit.split('=', 2).map(v => v.toUpperCase()))) as Record<string, string>;
  const frequency = rule.FREQ;
  if (!['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(frequency)) return [start].filter(date => date >= rangeStart && date <= rangeEnd);
  const interval = Math.max(1, Number(rule.INTERVAL) || 1);
  const count = Math.min(Number(rule.COUNT) || 1000, 1000);
  const until = rule.UNTIL ? parseDate({ name: 'UNTIL', params: {}, value: rule.UNTIL })?.date : undefined;
  const byDays = rule.BYDAY?.split(',').map((code: string) => DAY_CODES[code.slice(-2)]).filter((day: number | undefined): day is number => day !== undefined);
  const starts: Date[] = [];
  let made = 0;
  let cursor = new Date(start);
  const hardEnd = new Date(Math.min(rangeEnd.getTime(), until?.getTime() ?? rangeEnd.getTime()));

  if (frequency === 'WEEKLY' && byDays?.length) {
    let week = new Date(start);
    week.setDate(start.getDate() - start.getDay());
    while (week <= hardEnd && made < count) {
      for (const day of byDays) {
        const candidate = new Date(week);
        candidate.setDate(week.getDate() + day);
        candidate.setHours(start.getHours(), start.getMinutes(), start.getSeconds(), start.getMilliseconds());
        if (candidate < start) continue;
        made += 1;
        if (candidate > hardEnd || made > count) break;
        if (candidate >= rangeStart) starts.push(candidate);
      }
      week = add(week, 'week', interval);
    }
    return starts;
  }

  const unit = frequency === 'YEARLY' ? 'year' : frequency === 'MONTHLY' ? 'month' : frequency === 'WEEKLY' ? 'week' : 'day';
  while (cursor <= hardEnd && made < count) {
    made += 1;
    const correctDay = frequency !== 'DAILY' || !byDays?.length || byDays.includes(cursor.getDay());
    if (cursor >= rangeStart && correctDay) starts.push(new Date(cursor));
    cursor = add(cursor, unit, interval);
  }
  return starts;
}

export function parseICS(input: string, rangeStart: Date, rangeEnd: Date, calendarName = 'Imported') {
  if (!/BEGIN:VCALENDAR/i.test(input)) throw new Error('This does not look like an ICS calendar. Choose a file exported by your calendar app.');
  const rawEvents: RawEvent[] = [];
  let current: RawEvent | null = null;
  for (const line of unfold(input)) {
    if (line.trim().toUpperCase() === 'BEGIN:VEVENT') { current = {}; continue; }
    if (line.trim().toUpperCase() === 'END:VEVENT') { if (current) rawEvents.push(current); current = null; continue; }
    if (!current) continue;
    const found = property(line);
    if (found) (current[found.name] ||= []).push(found);
  }
  if (!rawEvents.length) throw new Error('No events were found in this calendar file.');

  const events: CalendarEvent[] = [];
  let invalid = 0;
  for (const raw of rawEvents) {
    if (raw.STATUS?.[0]?.value.toUpperCase() === 'CANCELLED') continue;
    const parsedStart = parseDate(raw.DTSTART?.[0]);
    if (!parsedStart) { invalid += 1; continue; }
    const parsedEnd = parseDate(raw.DTEND?.[0]);
    const fallbackEnd = parsedStart.allDay ? add(parsedStart.date, 'day', 1) : new Date(parsedStart.date.getTime() + 60 * 60 * 1000);
    const duration = Math.max(1, (parsedEnd?.date.getTime() ?? fallbackEnd.getTime()) - parsedStart.date.getTime());
    const uid = unescapeText(raw.UID?.[0]?.value) || `event-${events.length}-${parsedStart.date.getTime()}`;
    const title = unescapeText(raw.SUMMARY?.[0]?.value) || 'Untitled event';
    const base = {
      uid, title, allDay: parsedStart.allDay,
      location: unescapeText(raw.LOCATION?.[0]?.value),
      notes: unescapeText(raw.DESCRIPTION?.[0]?.value),
      calendar: calendarName,
      color: raw.COLOR?.[0]?.value || undefined
    };
    const exdates = new Set((raw.EXDATE || []).flatMap(item => item.value.split(',').map(value => parseDate({ ...item, value })?.date.getTime())).filter(Boolean));
    const starts = raw.RRULE?.[0]
      ? recurStarts(parsedStart.date, raw.RRULE[0].value, new Date(rangeStart.getTime() - duration), rangeEnd)
      : [parsedStart.date];
    for (const start of starts) {
      const end = new Date(start.getTime() + duration);
      if (!exdates.has(start.getTime()) && start < rangeEnd && end > rangeStart) {
        events.push({ ...base, id: `${uid}-${start.getTime()}`, start, end });
      }
    }
  }
  if (!events.length && invalid) throw new Error(`${invalid} event${invalid === 1 ? '' : 's'} had an unreadable date. Export the calendar as standard ICS and try again.`);
  return events.sort((a, b) => a.start.getTime() - b.start.getTime() || a.title.localeCompare(b.title));
}
