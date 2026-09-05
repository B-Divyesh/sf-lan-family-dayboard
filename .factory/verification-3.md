# Verification 3 — Show today’s family schedule and responsibilities

## Verdict: PASS

- Findings: **0** (S1: 0, S2: 0, S3: 0)
- Untested public claims: **0**
- Implementation reviewed: `6547272dad0ce008e35828a23fca95d9be9f3a7b`
- Documentation baseline reviewed: `f3a22c7d490261bd7216cbfabcdac6cd8b935f64`
- Live URL: <https://lan-family-dayboard.sociobot.in>
- Verification date: 5 September 2026

The implementation candidate is unchanged from the documentation baseline;
that later commit changes only `.factory/handoff.md`. A fresh production build
from that source matched all 16 publicly served runtime files byte-for-byte.
`staticwebapp.config.json` deliberately returns HTTP 404 because it is deploy
configuration, not a public runtime file.

## Job, audience, and first action before scrolling

- **Job:** show today’s family events and chores.
- **Audience:** households using one shared display for daily plans and
  responsibilities.
- **First action:** **Try it with sample data**. It is visible without
  scrolling on fresh 1366 × 900 desktop and 390 × 844 phone contexts, beside
  the real **Import a calendar** action.

The first screen’s headline is “Show today’s family events and chores.” Its
audience sentence is visible before scrolling on both devices. It also shows
the short facts “No accounts,” “Imported files stay in this browser,” and
“Free to use.” Screenshots and machine-readable observations are in
`/work/.evidence/lan-dayboard-verify-3-live/`.

## Clean checkout and declared commands

The checkout began clean at documentation SHA `f3a22c7`. Dependencies were
installed with the documented `npm ci`; no product code was changed.

| Command | Result |
| --- | --- |
| `npm ci` | Passed; 60 packages installed, 0 vulnerabilities |
| `npm test` | Passed; 4/4 Vitest tests |
| `npm run build` | Passed; produced `dist/index.html` |
| `npm run test:e2e` | Passed; 20/20 Playwright tests |
| `npm run test:claims` | Passed; 21/21 production-preview claim tests |
| every exact `test` command in `.factory/claims.json` | Passed individually; 21/21 commands, one test each |
| `git diff --check` | Passed before report edits |

The registry contains 21 IDs and the claim spec contains exactly 21
`@claim:<id>` tags: no duplicate IDs or tags, missing tests, or unregistered
tests. Manual cross-check of the landing page, legal pages, and README found no
additional visitor promise without a registered test.

The individual claim commands covered: `shared-display-layout`,
`local-ics-import`, `calendar-export-import`, `common-recurrence`,
`lan-feed-refresh`, `feed-recovery`, `local-storage`, `today-tomorrow`,
`display-mode`, `light-dark`, `offline-reload`, `weekly-print`,
`installable-offline`, `no-accounts-or-payment`, `replace-import`,
`recurring-responsibility`, `completion-undo`, `direct-feed-request`,
`file-size-limit`, `erase-data`, and `demo-isolation`.

Production output is 31.21 KB JavaScript raw (10.84 KB gzip) and 16.52 KB CSS
raw (4.35 KB gzip), within the static-product budgets.

## Fresh live product exercise

Fresh desktop and phone browser contexts opened the live root and `/demo`.
The one-click sample immediately showed school drop-off, library books, family
dinner, and recurring responsibilities. The persistent banner said “Demo —
sample data, nothing is saved to your real dayboard.”

In each context, a real-storage task was seeded first, a demo-only task was
added, and storage was inspected. The real key retained only the real task and
the `demo:lan-dayboard-v1` key held the demo task. **Reset demo** removed the
demo task and restored the realistic sample. **Start for real** deleted the
demo key and restored the real task. This proves the sample flow does not read
or change real dayboard data.

Normal, invalid, boundary, and recovery paths were exercised independently in
the live demo:

- A valid local ICS import showed its event and survived reload without an
  upload request.
- A 5,000,001-byte ICS file was rejected while the dialog stayed usable.
- A whitespace-only responsibility was rejected with the labelled live error.
- The production tests separately verify transactional quota rollback, feed
  failure retaining the last good copy, same-name replacement, recurrence,
  completion/Undo, printing, display-mode key/tap exit, and browser-data
  erasure.
- A controlled service worker reloaded `/demo` offline and showed both
  “Offline · showing saved copy” and sample content.

Normal automatic page traffic stayed same-origin in each fresh context. The
only potential external operation is the explicit user-selected feed, which
the registered direct-request test intercepts and verifies has neither Cookie
nor Authorization headers.

## Accessibility, responsive behavior, routes, and links

`/opt/fleet/lib/verify-url.sh` passed against the live root: HTTPS 200, title,
`lang`, one `h1`, a `main` landmark, image alt text, labelled buttons, and no
load-time console errors. Its desktop and mobile screenshots are retained in
the evidence directory.

Fresh mobile axe scans found zero serious or critical violations on `/`,
`/demo`, `/privacy`, and `/terms`. Keyboard smoke testing put the skip link
first and Enter moved focus to `#main`. Reduced-motion CSS reduced transition
duration to `0.00001s`. E2E coverage also verifies named 44 px legal links,
dialog focus, 200% text behavior, and the repaired feed target.

Browser route checks returned the expected rendered title and one `h1` for
root, demo, Privacy, Terms, and the not-found page. Every normal internal and
external navigation link returned HTTP 200. The skip link on the intentionally
missing route returns its expected HTTP 404; it is not a broken page. The
missing route has a designed page, `Page not found — LAN Family Dayboard`, a
clear `h1`, and a working return action. `robots.txt` and `sitemap.xml` include
the applicable public routes.

The live root served defensive headers including `nosniff`, no-referrer,
restricted permissions, CSP with response-header `frame-ancestors`, and HSTS.
No backend, tenant, restart, health, rate-limit, CLI, library, or desktop
artifact checks apply to this static-web product.

## Earlier finding disposition

| Earlier finding | Current disposition | Current evidence |
| --- | --- | --- |
| F1 sample sandbox absent | Resolved | Fresh desktop and phone `/demo` isolation, reset, and start-for-real exercise passed |
| F2 claims registry absent | Resolved | 21 registry entries, exact 21 tagged tests, aggregate and every individual command passed |
| F3 unnamed mobile legal home link | Resolved | Mobile axe on both legal routes: 0 serious/critical; named-link E2E passed |
| F4 quota error reported success | Resolved | Transactional-save recovery E2E passed; prior data remains after forced storage failure |
| F5 first screen lacked job/audience/action | Resolved | Fresh desktop and phone before-scroll inspection passed |
| F6 missing route served ordinary app | Resolved | Live designed HTTP 404 passed |
| F7 mobile links under 44 px | Resolved | Mobile target-size E2E passed |
| F8 display mode could not exit by ordinary key/tap | Resolved | Registered display-mode claim passed |
| F9 titles and metadata incomplete | Resolved | Browser title checks plus live canonical, OG/Twitter, manifest, and touch-icon inspection passed |
| F10 site skeleton and copy evidence incomplete | Resolved | Header/footer, How it works, Privacy and limits, copy audit, and external-link label inspected |
| Prior Undo, blank-task, refresh-target issues | Resolved | Current e2e regression coverage passed |

## Evidence

- `/work/.evidence/lan-dayboard-verify-3-live/verify.json` — live smoke
  result.
- `/work/.evidence/lan-dayboard-verify-3-live/independent-live.json` — fresh
  desktop/phone, demo isolation, axe, offline, keyboard, and route observations.
- `/work/.evidence/lan-dayboard-verify-3-live/fresh-*-*.png` — fresh root and
  populated demo screenshots.

There are zero findings and zero untested claims. **PASS.**
