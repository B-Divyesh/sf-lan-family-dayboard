# Independent verification 2 — LAN Family Dayboard

## Verdict: FAIL

Verified on 2026-08-28 against candidate commit
`bb87e500fd3c664f4fe63d8954e7e6e747892d11` and
<https://lan-family-dayboard.sociobot.in>.

The candidate builds and its runtime output is deployed exactly. The main
calendar/chore workflows, privacy posture, offline reload, response policies,
and performance budgets pass. Release acceptance nevertheless fails because
the deployed legal pages have an axe **serious** accessible-name violation and
the app can falsely report that a calendar was saved when browser storage is
full, then silently lose it on reload. Two lower-severity interaction/target
size contract defects are also present.

The checkout was clean and at the requested SHA before installation. No
product code was modified during this verification.

## Defects

### S2 — Mobile Privacy and Terms pages contain an unnamed home link

At a 390 × 844 viewport, open `/privacy` or `/terms` and run axe. Both local
production output and the live deployment report:

```text
serious: link-name (1 node)
<a href="/"><span class="brand-mark" aria-hidden="true">…</span>
  <span>LAN <b>Family Dayboard</b></span></a>
```

The responsive rule hides the textual span below 520 px, while the remaining
brand mark is `aria-hidden`. Unlike the home-page version, the legal-page link
has no `aria-label`. A screen-reader user therefore encounters a nameless link.
This directly fails the required zero serious/critical axe findings.

### S2 — Storage exhaustion is reported as success and loses the new calendar

Reproduced in Chromium against the production build:

1. Import a valid 4,000,000-byte `one.ics`.
2. Import a separate valid 2,000,000-byte `two.ics`. Both are below the stated
   5 MB per-file limit.
3. The board shows both events and says `two.ics is now on the board.`
4. `localStorage['lan-dayboard-v1']` remains 4,000,157 characters—the second
   import was not saved.
5. Reload. The second calendar/event disappears without warning.

`persist()` catches the quota error and announces a save failure, but
`importFile()` continues, closes the dialog, renders the unsaved in-memory
state, and immediately replaces that error with a success toast. This violates
the local-first persistence promise and provides neither an honest error nor a
usable recovery path. The same unchecked `persist()` contract can affect other
mutations near quota.

### S3 — Several mobile links miss the required 44 × 44 CSS px target

Measured on the live 390 px layout:

| Route/control | Measured box |
| --- | ---: |
| Home logo link | 32 × 32 px |
| Privacy | 50.70 × 21 px |
| Terms | 41.23 × 21 px |
| Source | 48.09 × 21 px |
| Legal-page “Back to dayboard” | 159.20 × 24 px |

Buttons, including **Refresh LAN feeds**, meet the 44 px minimum. These links
do not meet the explicit product/design accessibility contract.

### S3 — Display mode does not exit on “any key or tap” as specified

The visual thesis says that any key or tap reveals setup chrome after entering
display mode. On desktop, activate **Display mode**, press `A`, then click the
main board. The `display-mode` class remains after both actions and the controls
stay hidden. Only `D` or `Escape` exits. This is recoverable, but the shipped
interaction contradicts the product-specific interaction contract and is less
discoverable on a touch display.

## Clean install and repository gates

Environment: Node `v22.23.2`, npm `10.9.8`, Playwright `1.58.2` with the
preinstalled Chromium.

- `npm ci`: passed; 60 packages installed, 0 vulnerabilities.
- `npm test`: passed; 4/4 Vitest tests.
- `npm run build`: passed; exact command ran `tsc --noEmit && vite build` and
  produced `dist/index.html`.
- `npm run test:e2e`: passed; 14/14 Playwright cases across desktop Chromium
  and the configured 390 × 844 mobile project.
- No separate lint script exists. The available TypeScript check is part of
  the production build and passed.
- `git diff --check` passed before report changes.
- Library/CLI consumer packaging and backend checks are not applicable to this
  `static-web` artifact.

Production output sizes:

| Resource | Raw | Gzip reported by Vite |
| --- | ---: | ---: |
| Initial JS | 24,491 B | 9.20 KB |
| CSS | 14,914 B | 4.06 KB |
| Mobile hero WebP | 16,508 B | n/a |
| Desktop hero WebP | 44,272 B | n/a |
| Fonts | 0 B | n/a |

The initial JS and CSS are well below the 200 KB and 50 KB budgets.

## Independent product exercise

The following was run against `npm run preview -- --port 4174`, not merely the
repository's development-server suite:

- Imported a calendar containing date-only, timed, daily recurring, and
  overnight events. Today/tomorrow placement and spanning-event display were
  correct; calendar-controlled markup characters were safely rendered as text.
- Re-imported the same filename and confirmed replacement, not duplication.
- Rejected malformed text, a valid calendar with no events, and a 5,000,001
  byte file; a subsequent valid file succeeded after each error. A separate
  exact 5,000,000-byte valid calendar imported and survived reload.
- Rejected missing feed URLs, unsupported schemes, and credential-bearing
  URLs without making a request. A mocked valid HTTPS feed connected without
  Cookie or Authorization headers. A later mocked 503 produced the
  last-saved-copy message and retained the existing event.
- Rejected a whitespace-only responsibility name and an empty repeat-day set.
  A valid responsibility persisted. Space toggled its checkbox, Undo reversed
  completion and that reversal survived reload. Cancel and accept paths of the
  named delete confirmation both behaved correctly.
- Previous/next/today navigation worked. Print media contained seven day
  columns and generated a one-page 28,791-byte landscape PDF.
- Light/dark layouts showed no clipping or horizontal overflow at 1440 × 1000
  and 390 × 844. Desktop and mobile populated screenshots were reviewed.
- The skip link was first in keyboard order and focused `#main`; the tested
  button had a visible 3 px purple focus outline. Native modal focus entered
  the dialog and Escape returned it to the invoker. Reduced-motion transition
  duration was `0.00001s`.
- Normal journeys emitted no page/console errors and no automatic request left
  the app origin.

## Accessibility

Axe covered empty and populated states, desktop/mobile, light/dark, the
calendar dialog, and both legal routes.

- Empty, populated, and dialog states: 0 serious/critical findings.
- `/privacy` at 390 px: 1 serious `link-name` finding.
- `/terms` at 390 px: 1 serious `link-name` finding.
- The same two findings reproduce on the live deployment.

The worker `verify-url.sh` passed locally and live: title, `lang="en"`, one
`h1`, `main`, image alt text, named buttons, and zero load-time console errors.
It does not inspect the separate legal routes, so its pass does not supersede
the axe failure.

## PWA, privacy, and response policies

- The live service worker controlled the page; `registration.update()`
  completed with `/sw.js` active and cache `dayboard-v1` present.
- A forced-offline reload rendered **Today at home** and **Offline · showing
  saved copy**. Chromium parsed the standalone web-app manifest with no errors.
- A fresh live load contacted only the deployed origin. There are no analytics,
  remote fonts/scripts, advertising, account, credential, or payment requests.
  User-entered feeds are fetched directly with `credentials: 'omit'`.
- `/privacy` and `/terms` return HTTPS 200 and render their intended pages.
- HTTP redirects to HTTPS with 301. Responses include HSTS
  (`max-age=10886400; includeSubDomains; preload`), `nosniff`,
  `Referrer-Policy: no-referrer`, camera/microphone/geolocation denial, and a
  CSP restricted to self except HTTP(S) `connect-src` for user-selected feeds.
- HTML is `public, must-revalidate, max-age=30`; hashed assets are one-year
  `immutable`; `sw.js` is `no-cache`. Conditional HTML and JS requests returned
  304. Missing `/assets/*` and `.svg` resources returned 404.

## Deployment identity and performance

All 12 emitted runtime files checked—HTML, hashed JS/CSS and source map, three
raster assets, icon, manifest, robots, sitemap, and service worker—were
byte-for-byte identical between local `dist/` and the live origin. Key hashes:

```text
index.html                  0d96e437191a0893cae1595231abb332d15c05ac68c9adfc13e5e275cd595c9d
assets/index-BmifYPoG.js   b767006dfb1ccb3914844f18750762227c5eedf965b24161d0a84824a54d4d2e
assets/index-wO9_q8Eg.css  f9628cd3395e9d249f41ceece7a53352b36e9eccb8610e265164df652c7332eb
sw.js                       6430b320309bc337de944b284aa11986e7e23771238b0bf2343597d35cfb5c5e
```

`staticwebapp.config.json` is consumed by Azure Static Web Apps and is not a
public runtime file; its effective policies were checked through responses.
The candidate's only change after the runtime repair is documentation, so the
exact runtime-file match proves the live site matches this candidate's build.

Lighthouse 12.8.2 mobile against the live URL completed without runtime error:

| Category/metric | Result |
| --- | ---: |
| Performance | 100 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |
| FCP | 957 ms |
| LCP | 1,064 ms |
| TBT | 0 ms |
| CLS | 0 |
| Initial transfer | 32,074 B |

Lighthouse's root-page score does not cover the route-specific legal-page
defect.

## Required before PASS

1. Give the legal-page home link a persistent accessible name and re-run axe
   on `/privacy` and `/terms` at 390 px.
2. Do not close the dialog or show success when a mutation was not stored. Add
   a quota-exhaustion/reload regression.
3. Enlarge the measured mobile link targets to at least 44 × 44 CSS px.
4. Make arbitrary key/tap exit display mode as promised, or revise the source
   of truth and provide an equally discoverable touch exit.
