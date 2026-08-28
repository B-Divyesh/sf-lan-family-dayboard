# Verification report — LAN Family Dayboard

**Verdict: FAIL**

Verified 2026-08-28 against candidate commit
[`9bb5f119a56c76c80f006261c2b3cdc763e42ab2`](https://github.com/B-Divyesh/sf-lan-family-dayboard/commit/9bb5f119a56c76c80f006261c2b3cdc763e42ab2)
and the live URL <https://lan-family-dayboard.sociobot.in>.

The deployment is the candidate: SHA-256 matched the locally built `index.html`,
hashed JS and CSS, all shipped raster assets, `sw.js`, manifest, icon, robots,
and sitemap. This was a fresh clean working tree at the specified commit before
`npm ci`; only this report and the handoff were changed for verification.

## Blocking defects

### S2 — The advertised Undo action does not undo a completed responsibility

**Reproduction:** add a responsibility, complete it, then activate the visible
`Undo` button in the confirmation toast. The checkbox remains checked and the
completion remains saved. The toast is injected after event listeners are bound,
so its `data-action="undo-chore"` button has no click listener.

**Impact:** the advertised recovery path for a completion is inert. This fails
the required reversible/actionable feedback behaviour.

### S2 — Whitespace-only responsibility names are accepted and persisted

**Reproduction:** open Add responsibility, enter three spaces in “What needs
doing?”, leave the default day selected, and submit. The dialog closes and a
blank responsibility is created; it remains after reload. The native `required`
constraint accepts whitespace and the submit handler trims only after it has
already accepted the value.

**Impact:** a representative invalid input creates an unusable, effectively
unnamed household responsibility rather than showing an error and allowing
recovery.

### S3 — “Refresh LAN feeds” is only 32 CSS px high on the 390 px touch layout

**Reproduction:** add a valid LAN feed and inspect the visible Refresh LAN feeds
button at 390 × 844. Its `getBoundingClientRect().height` is 32 px.

**Impact:** this misses the stated 44 × 44 px minimum touch target requirement.

## Passing evidence

### Clean install, checks, and build

- `npm ci`: completed; audit reported 0 vulnerabilities.
- `npm test`: 4/4 Vitest unit tests passed.
- `npm run build`: passed (`tsc --noEmit && vite build`), produced `dist/`.
- `npm run test:e2e`: 8/8 Playwright tests passed on desktop and the configured
  390 × 844 mobile project.
- There is no standalone lint or type-check script. `npm run build` is the
  available TypeScript check and passed.
- Production output: JS 24.05 KB (9.07 KB gzip), CSS 14.97 KB (4.08 KB gzip),
  under the 200 KB JS and 50 KB CSS budgets. The responsive hero is 44,272 B
  desktop WebP / 16,508 B mobile WebP.
- Local Lighthouse 12.8.2 mobile result: Performance 100, Accessibility 100,
  Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.4 s, CLS 0, TBT 80 ms.

### End-to-end and boundary checks

- Normal local ICS import rendered a date-only event; a timed recurring event
  was parsed; chores persisted across reload.
- Invalid non-ICS input showed an actionable parse error and kept the dialog
  open. A 5,000,001-byte file was rejected with the stated 5 MB error. A valid
  file imported successfully after each error.
- Missing feed URL, unsupported scheme, and credential-bearing URL all showed
  actionable validation errors without fetching.
- A CORS-enabled mocked user-run HTTPS feed was fetched directly without Cookie
  or Authorization headers. A deliberate 503 on manual refresh displayed the
  last-good-copy message and retained the existing event. (The browser logged
  the expected failed 503 resource; normal loads had no errors.)
- Missing chore days displayed the inline alert. Deletion uses a named native
  confirmation. The functional undo and whitespace cases above failed.
- Print control, date controls, display mode, normal keyboard navigation,
  skip link, checkbox Space operation, privacy route, and local persistence
  were exercised. The skip link focused `#main`; visible focus styling is
  present in the normal keyboard path.

### Accessibility, visual, and motion checks

- Axe serious/critical findings: 0 on empty desktop, populated desktop, dark
  dialog, 390 px mobile, and the live deployment.
- Live page had `lang="en"`, one `h1`, a `main` landmark, title, and no
  load-time console or page errors.
- Visual review at 1440 × 1000 and 390 × 844 found no clipping or horizontal
  overflow. The desktop empty state and populated phone schedule remain
  legible; the 32 px refresh control is the exception recorded above.
- `prefers-reduced-motion: reduce` reduced button transition duration to
  `0.00001s`.

### PWA, privacy, network, and response policy

- Service worker registered, controlled the page, and `registration.update()`
  completed. Cache `dayboard-v1` was present. After a cached initial load, an
  offline reload rendered “Today at home”. The identical live service worker
  also controlled the live page.
- A fresh live load made requests only to
  `https://lan-family-dayboard.sociobot.in`; no analytics, fonts, scripts, or
  other automatic third-party requests were observed. The only product-initiated
  external request is a user-entered feed, fetched with `credentials: 'omit'`.
- Live response policies were present: HTTPS/HSTS, `X-Content-Type-Options:
  nosniff`, `Referrer-Policy: no-referrer`, restrictive camera/microphone/
  geolocation Permissions-Policy, and CSP limiting script/style/image sources
  to self. `connect-src` permits HTTP(S) specifically to support an explicitly
  user-selected LAN feed.
- HTML uses `max-age=30`; hashed `/assets/*` use `public, max-age=31536000,
  immutable`; `sw.js` uses `no-cache`.
- `/privacy` and `/terms` both return the SPA and render their intended pages.

## Required next steps

1. Bind or delegate the toast Undo action and add a regression test that proves
   completion becomes unchecked after Undo.
2. Reject a trimmed-empty responsibility title with an announced inline error;
   add a whitespace-only regression test.
3. Make Refresh LAN feeds at least 44 px in both dimensions (or provide an
   equivalent 44 px target) and recheck the 390 px layout.
4. Re-run this verification after the fixes. Do not mark the candidate PASS
   until all three defects are resolved.
