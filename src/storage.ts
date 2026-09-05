import type { DayboardState } from './types';

export const REAL_STORAGE_KEY = 'lan-dayboard-v1';
export const DEMO_STORAGE_KEY = 'demo:lan-dayboard-v1';
export const initialState: DayboardState = { calendars: [], chores: [], completions: {}, theme: 'system' };

function storageKey(demo = false) { return demo ? DEMO_STORAGE_KEY : REAL_STORAGE_KEY; }

export function loadState(demo = false): DayboardState {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(demo)) || 'null');
    return parsed && Array.isArray(parsed.calendars) && Array.isArray(parsed.chores)
      ? { ...initialState, ...parsed }
      : structuredClone(initialState);
  } catch { return structuredClone(initialState); }
}

export function saveState(state: DayboardState, demo = false) {
  localStorage.setItem(storageKey(demo), JSON.stringify(state));
}

export function clearState(demo = false) { localStorage.removeItem(storageKey(demo)); }
