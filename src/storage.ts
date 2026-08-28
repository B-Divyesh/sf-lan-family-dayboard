import type { DayboardState } from './types';

const KEY = 'lan-dayboard-v1';
export const initialState: DayboardState = { calendars: [], chores: [], completions: {}, theme: 'system' };

export function loadState(): DayboardState {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || 'null');
    return parsed && Array.isArray(parsed.calendars) && Array.isArray(parsed.chores)
      ? { ...initialState, ...parsed }
      : structuredClone(initialState);
  } catch { return structuredClone(initialState); }
}

export function saveState(state: DayboardState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function clearState() { localStorage.removeItem(KEY); }
