export type CalendarEvent = {
  id: string;
  uid: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  location?: string;
  notes?: string;
  calendar?: string;
  color?: string;
};

export type Chore = {
  id: string;
  title: string;
  person: string;
  days: number[];
  createdAt: string;
};

export type StoredCalendar = {
  name: string;
  ics: string;
  source: 'file' | 'feed';
  importedAt: string;
  feedUrl?: string;
};

export type DayboardState = {
  calendars: StoredCalendar[];
  chores: Chore[];
  completions: Record<string, string[]>;
  theme: 'system' | 'light' | 'dark';
};
