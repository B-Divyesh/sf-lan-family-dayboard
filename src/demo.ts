import type { DayboardState } from './types';

function dayStamp(date: Date) {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** A deliberately opinionated household sample, regenerated for today. */
export function sampleDayboardState(now = new Date()): DayboardState {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const tomorrow = addDays(today, 1);
  const calendarText = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//LAN Family Dayboard//Sample//EN',
    'BEGIN:VEVENT', 'UID:sample-school-dropoff', `DTSTART:${dayStamp(today)}T081500`, `DTEND:${dayStamp(today)}T084500`, 'SUMMARY:School drop-off', 'LOCATION:North gate', 'END:VEVENT',
    'BEGIN:VEVENT', 'UID:sample-library', `DTSTART:${dayStamp(today)}T163000`, `DTEND:${dayStamp(today)}T173000`, 'SUMMARY:Library books due', 'LOCATION:Maple Library', 'END:VEVENT',
    'BEGIN:VEVENT', 'UID:sample-dinner', `DTSTART:${dayStamp(tomorrow)}T180000`, `DTEND:${dayStamp(tomorrow)}T193000`, 'SUMMARY:Family dinner', 'LOCATION:Grandma’s house', 'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  return {
    calendars: [{ name: 'Family sample', ics: calendarText, source: 'file', importedAt: now.toISOString() }],
    chores: [
      { id: 'sample-pack-bags', title: 'Pack school bags', person: 'Everyone', days: [today.getDay()], createdAt: now.toISOString() },
      { id: 'sample-recycling', title: 'Put out recycling', person: 'Sam', days: [today.getDay(), tomorrow.getDay()], createdAt: now.toISOString() },
      { id: 'sample-lunches', title: 'Make lunches', person: 'Alex', days: [tomorrow.getDay()], createdAt: now.toISOString() }
    ],
    completions: {},
    theme: 'system'
  };
}
