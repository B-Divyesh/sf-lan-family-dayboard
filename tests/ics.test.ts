import { describe, expect, it } from 'vitest';
import { parseICS } from '../src/ics';

const calendar = (body: string) => `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Dayboard tests//EN\r\n${body}\r\nEND:VCALENDAR`;

describe('parseICS', () => {
  it('reads timed, escaped and folded event fields', () => {
    const input = calendar(`BEGIN:VEVENT\r\nUID:school-1\r\nDTSTART:20260828T090000Z\r\nDTEND:20260828T100000Z\r\nSUMMARY:School\\, assembly\r\nDESCRIPTION:Bring the blue\r\n  folder\r\nLOCATION:Main hall\r\nEND:VEVENT`);
    const events = parseICS(input, new Date('2026-08-28T00:00:00Z'), new Date('2026-08-29T00:00:00Z'), 'Family');
    expect(events).toHaveLength(1);
    expect(events[0].title).toBe('School, assembly');
    expect(events[0].notes).toBe('Bring the blue folder');
    expect(events[0].calendar).toBe('Family');
    expect(events[0].end.getTime() - events[0].start.getTime()).toBe(3_600_000);
  });

  it('makes date-only events span the full day', () => {
    const input = calendar(`BEGIN:VEVENT\r\nUID:holiday\r\nDTSTART;VALUE=DATE:20260828\r\nSUMMARY:Family day\r\nEND:VEVENT`);
    const events = parseICS(input, new Date(2026, 7, 28), new Date(2026, 7, 29));
    expect(events[0].allDay).toBe(true);
    expect(events[0].end.getTime() - events[0].start.getTime()).toBe(86_400_000);
  });

  it('expands weekly recurrence and honors EXDATE', () => {
    const input = calendar(`BEGIN:VEVENT\r\nUID:bins\r\nDTSTART:20260803T070000Z\r\nDTEND:20260803T073000Z\r\nRRULE:FREQ=WEEKLY;BYDAY=MO,WE;COUNT=8\r\nEXDATE:20260805T070000Z\r\nSUMMARY:Bins\r\nEND:VEVENT`);
    const events = parseICS(input, new Date('2026-08-01T00:00:00Z'), new Date('2026-08-20T00:00:00Z'));
    expect(events.map(event => event.start.toISOString().slice(0, 10))).toEqual([
      '2026-08-03', '2026-08-10', '2026-08-12', '2026-08-17', '2026-08-19'
    ]);
  });

  it('rejects a non-calendar and explains an unreadable date', () => {
    expect(() => parseICS('hello', new Date(), new Date())).toThrow(/does not look like an ICS/);
    const input = calendar(`BEGIN:VEVENT\r\nDTSTART:not-a-date\r\nSUMMARY:Broken\r\nEND:VEVENT`);
    expect(() => parseICS(input, new Date(), new Date())).toThrow(/unreadable date/);
  });
});
