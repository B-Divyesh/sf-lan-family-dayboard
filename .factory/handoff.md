# LAN Family Dayboard — build handoff

## Shipped

- A finished Vite + vanilla TypeScript static application for household tablets and wall displays.
- Local ICS file import with safe text rendering, date-only/timed events, TZID/UTC dates, common recurrence rules, exclusions, cancelled-event filtering, and actionable parse errors.
- Re-importing the same filename replaces its saved calendar, providing the required offline/manual-refresh path.
- Optional user-run LAN ICS feeds with manual refresh, no credentials, no proxy, CORS/mixed-content guidance, and last-good-copy behavior on failure.
- Today/tomorrow view, date navigation, calendar identity markers, recurring responsibilities, per-day completion with undo, explicit deletion confirmations, dark/light/system themes, live offline state, keyboard display mode (`D` / `Escape`), and landscape weekly printing.
- Local-only persistence, `/privacy` and `/terms`, no analytics, no third-party runtime assets, an installable service worker, and Azure Static Web Apps navigation/security/cache configuration.
- Original “household day orbit” empty-state art generated through the factory image deployment, visually reviewed and optimized to 44 KB desktop / 17 KB mobile WebP. Prompt and provenance are in `.factory/design.md` and `assets/src/day-orbit.json`.

## Verification

Run from `/work/repo`:

```sh
npm install
npm test
npm run build
npm run test:e2e
```

Verified on 2026-08-28:

- `npm test`: 4 unit tests passed.
- `npm run test:e2e`: 8 Chromium tests passed across desktop and 390 × 844 mobile, including ICS import, chore add/complete/persistence, empty/privacy routes, console-error checks, and axe-core scanning in both themes.
- Axe-core: zero serious or critical violations in both tested viewports.
- `npm run build`: passes; output lands in `dist/` with `index.html` at the root.
- Production payload: 24.02 KB JS / 14.97 KB CSS uncompressed (9.06 KB / 4.08 KB gzip); hero 44 KB desktop and 17 KB mobile WebP.
- Lighthouse 12.8.2 mobile: Performance 99, Accessibility 100, Best Practices 100, SEO 100. FCP 0.9 s, LCP 1.5 s, CLS 0, TBT 140 ms.
- Visual review completed at 1440 × 1000 and 390 × 844. No console errors were observed during end-to-end runs.

## Known limits

- Advanced RFC 5545 recurrence features such as `BYSETPOS`, detached recurrence overrides, and arbitrary `RDATE` sets are not expanded. Common `DAILY`, `WEEKLY`, `MONTHLY`, `BYDAY`, `INTERVAL`, `COUNT`, `UNTIL`, and `EXDATE` forms are supported.
- Browser security determines whether a LAN feed can be fetched. HTTPS mixed-content rules and missing CORS headers cannot be bypassed by a static app.
- E-ink refresh behavior varies by device browser; the UI avoids ambient animation and provides manual refresh/display controls, but device-specific ghosting modes are outside the web app's control.

## Next steps

Run the success-measure household trial. Based on actual calendars encountered, add targeted recurrence fixtures before expanding RFC 5545 support. A future preconfigured device image can reuse this static build without adding cloud accounts.
