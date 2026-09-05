# Review 1 — Show today’s family schedule and responsibilities

## Verdict: FAIL

- Findings: **10** (S1: 0, S2: 6, S3: 4)
- Untested public claim groups: **20**
- Implementation reviewed: `b42ab4f029aac5381f58a88f6cbfd5a463adcf6a`
- Documentation baseline reviewed: `dbab698b2f8f5812b836079db53c89734126e9aa`
- Live URL: <https://lan-family-dayboard.sociobot.in>
- Review date: 5 September 2026

The product cannot pass while any finding or untested claim remains. The live
files match the implementation candidate, so the failures are current product
failures rather than a stale deployment.

## Job, audience, and first action before scrolling

- **Job:** show today’s and tomorrow’s family events and responsibilities on a
  shared display.
- **Audience:** a household using a shared tablet, e-ink browser, or wall
  screen without separate accounts.
- **First action shown:** desktop starts with **Add responsibility** in the
  header; phone shortens it to **Add**. There is no **Try it with sample data**
  action. On the 390 × 844 first screen, the empty-state import action is below
  the fold.

Fresh desktop and phone contexts started with empty local storage. Screenshots
are in `/work/.evidence/desktop-first-screen.png` and
`/work/.evidence/phone-first-screen.png`.

## Findings

### F1 — S2 — The required one-click sample sandbox does not exist

There is no **Try it with sample data** action on the first screen. `/demo`
returns the ordinary empty app with the ordinary title. It has no sample
events or responsibilities, no persistent demo label, no **Reset demo**, and
no **Start for real**. Adding “Pack school bags” on `/demo` wrote the production
key `lan-dayboard-v1`; no `demo:` key existed, and the change survived reload.
`.factory/demo.md` is also missing.

This fails the demo-sandbox contract and prevents claim verification from a
clean, realistic sample without touching the real namespace.

### F2 — S2 — Public claims have no registry or claim commands

`.factory/claims.json` is missing. Therefore zero claim commands are declared,
none can be run from the required demo entry point, and all 20 public claim
groups below remain untested under the claims contract. Existing unit and
browser tests have no `@claim:<id>` tags and cannot substitute for the missing
registry.

### F3 — S2 — Mobile Privacy and Terms pages have an unnamed home link

At 390 × 844, axe reports one serious `link-name` violation on `/privacy` and
one on `/terms`. The visible wordmark is hidden by the responsive rule and the
remaining 32 px mark is `aria-hidden`; the link has no `aria-label`. This is the
same defect reported in `.factory/verification-2.md`.

### F4 — S2 — Storage exhaustion reports success and then loses data

In a fresh live context, importing a valid 4,000,000-byte `one.ics` succeeded.
Importing a separate valid 2,000,000-byte `two.ics` then said “two.ics is now on
the board” and showed both events. Local storage remained 4,000,157 characters.
After reload, the second event disappeared while the first remained.

The save error is caught, but the import path continues to close, render, and
announce success. This is the same data-integrity defect reported in
`.factory/verification-2.md`.

### F5 — S2 — The first screen does not state the required job, audience, and sample action

The `<h1>` is “Today at home,” not a job in the user’s words. The household
context and import explanation appear later in an `<h2>` block, and no
one-sentence audience statement appears. The required sample action is absent;
on phone, the empty-state real import action also falls below the first
viewport. “Shared view,” “Private by design,” and “Made for the room, not the
cloud” are label/slogan copy rather than section names or instructions.

This fails the attached plain-words first-screen shape and the explicit request
to state the job, audience, and first action before scrolling.

### F6 — S2 — Unknown URLs do not produce a designed 404

`/not-a-real-route-qa` returns HTTP 200 and renders the normal dayboard with
the root title and `<h1>`. There is no `404.html`, no 404 application state,
and no Static Web Apps 404 response override. A deliberate 404 response would
be expected; serving the ordinary app as a successful page is the defect.

### F7 — S3 — Mobile links remain below the 44 px touch baseline

Measured on the live 390 px layout:

| Control | Size |
| --- | ---: |
| Home logo | 32 × 32 px |
| Privacy | 50.70 × 21 px |
| Terms | 41.23 × 21 px |
| Source | 48.09 × 21 px |
| Legal “Back to dayboard” | 159.20 × 24 px |

The repaired **Refresh LAN feeds** control meets 44 px; these earlier findings
remain unresolved.

### F8 — S3 — Display mode does not exit on the promised key or tap behavior

After entering display mode, pressing `A` and tapping the main board both left
`display-mode` active. `Escape` exited. This contradicts `.factory/design.md`,
which says any key or tap reveals setup controls, and leaves no discoverable
touch exit while those controls are hidden.

### F9 — S3 — Required titles and metadata are incomplete

The root title is only “LAN Family Dayboard,” rather than “Product name — what
it does.” Legal titles use `Privacy ·` and `Terms ·`, not the required route
form. `/demo` and unknown URLs reuse the root title. The document has no
canonical link, Open Graph metadata, Twitter card metadata, 1200 × 630 social
image, or 180 px Apple touch icon. `sitemap.xml` omits the required demo route.

### F10 — S3 — The standard site skeleton and copy evidence are incomplete

The home page has no **How it works** section and no home-page plain-language
limits/privacy section. Legal headers omit the normal navigation. Legal footers
omit Privacy, Terms, Param Factory attribution, and a build/version identifier;
the home footer also lacks the factory attribution and build/version. The
external Source link does not identify itself as external. Required
`.factory/copy-audit.md` is missing.

## Untested public claims

These are counted as 20 distinct outcome groups. Ad hoc observations in this
review do not satisfy the contract: each group needs a `.factory/claims.json`
entry and exactly one tagged test command that starts from the sample sandbox.

| # | Public claim group | Public location | Ad hoc disposition |
| ---: | --- | --- | --- |
| 1 | Works for a tablet, e-ink browser, or wall screen | README opening | No e-ink/installed-device claim test |
| 2 | Imports standard ICS entirely in the browser and never uploads it | README, import dialog, Privacy | Local import and origin log passed |
| 3 | Accepts exports from Google Calendar, Apple Calendar, Outlook, and other apps | README Use step 1 | No provider fixtures |
| 4 | Supports common daily, weekly, and monthly recurrence | README | Unit coverage is partial and untagged |
| 5 | Connects to a user-run HTTP(S) ICS feed and refreshes manually | README, app | Mocked HTTPS flow passed |
| 6 | Keeps the last good feed response when refresh fails | README, app | Mocked 503 recovery passed |
| 7 | Stores listed household data only in local storage | README, Privacy | Storage inspection passed for exercised data |
| 8 | Shows today and tomorrow | README | Populated rendering passed in prior/current-byte evidence |
| 9 | Provides display mode | README, app | Entry/Escape passed; promised tap/key exit failed |
| 10 | Provides light and dark treatments | README, app | Existing local axe browser suite passed |
| 11 | Shows offline status and reloads offline | README, app | Live controlled offline reload passed |
| 12 | Prints a landscape seven-day sheet | README, app | Seven columns; 25,765-byte PDF produced |
| 13 | Is installable offline after the first successful load | README | Manifest/SW passed; no registered install claim test |
| 14 | Has no accounts, analytics, ads, third-party scripts, hosted sync, credentials, messaging, payment, or remote database | README, Privacy | Fresh automatic traffic stayed same-origin |
| 15 | Re-importing the same filename replaces its saved copy | README | Passed in prior current-byte verification |
| 16 | Adds recurring responsibilities | README, app | Live add and persistence passed |
| 17 | Tracks completion and can undo it immediately | README | Live Undo and reload passed |
| 18 | Makes only own-asset or explicit feed requests, omits credentials, and does not proxy feeds | README, Privacy | Same-origin load and mocked feed headers passed |
| 19 | Rejects calendar files over 5 MB | README, app error | 5,000,001-byte rejection passed |
| 20 | Removing calendars or clearing browser site data erases stored data | Privacy | No registered erase claim test |

## Earlier finding disposition

| Earlier finding | Current disposition | Evidence |
| --- | --- | --- |
| Undo did not undo completion | Resolved | Completion became unchecked and stayed unchecked after reload |
| Whitespace-only responsibility was accepted | Resolved | Announced error, `aria-invalid=true`, no mutation |
| Refresh LAN feeds was 32 px high | Resolved | Existing regression passed; live control meets 44 px |
| Legal home link lacked a name on phone | Open | Axe serious `link-name` on both legal routes |
| Quota failure was overwritten by success | Open | Reproduced with 4 MB + 2 MB valid calendars |
| Mobile links were under 44 px | Open | Same measurements reproduced |
| Any key/tap did not exit display mode | Open | `A` and main-board tap left mode active |

## Functional and recovery evidence

- Fresh live desktop and phone loads returned 200, had `lang="en"`, one `<h1>`,
  one `<main>`, a skip link that focused `#main`, no horizontal overflow, and
  no console or page errors.
- A malformed file, an ICS file with no events, and a 5,000,001-byte file each
  produced a specific error. A valid file then imported and survived reload.
- Missing feed URL, unsupported scheme, and credential-bearing URL were
  rejected. A mocked HTTPS feed used GET without Cookie or Authorization. A
  later 503 retained the event and named the last-saved-copy recovery.
- Whitespace responsibility validation, valid add, completion, Undo, and reload
  persistence passed. Existing named delete confirmation evidence remains
  applicable because deployed runtime bytes are unchanged.
- Print media exposed seven day columns and produced a 25,765-byte landscape
  PDF.
- Reduced motion changed the tested transition to `0.00001s`. A 200% text-size
  smoke had no horizontal overflow.
- Root axe had zero violations in fresh desktop and phone contexts. The legal
  route serious failures are recorded in F3.
- The live service worker controlled the page, updated, used `dayboard-v1`, and
  reloaded offline with “Offline · showing saved copy.”
- A fresh live journey contacted only the product origin until the explicit
  mocked feed action. No analytics or remote fonts/scripts were observed.
- Root, Privacy, Terms, and the GitHub Source link returned 200. The unexpected
  unknown-route result is F6.
- Backend tenant, restart, health, and 429 checks do not apply to this
  `static-web` product. CLI/library/desktop consumer checks do not apply.

## Clean checkout and command evidence

The checkout began clean at documentation SHA `dbab698b`. Dependencies were
installed before tests. No product code was changed.

| Command | Result |
| --- | --- |
| `npm ci` | Passed; 60 packages, 0 vulnerabilities |
| `npm test` | Passed; 4/4 Vitest tests |
| `npm run build` | Passed; `dist/index.html` produced |
| `npm run test:e2e` | Passed; 14/14 Playwright tests |
| `npm run preview -- --port 4174` | Passed; served bytes matched `dist/index.html` |
| `/opt/fleet/lib/verify-url.sh <live> <evidence>` | Passed root smoke; no console errors |
| Claim commands | None exist because `.factory/claims.json` is missing |

Production sizes: JavaScript 24,491 B raw / 9.20 KB gzip; CSS 14,914 B raw /
4.06 KB gzip; mobile hero 16,508 B; no font files. These meet the stated
budgets.

Live Lighthouse 12.8.2, successful retry: Performance 100, Accessibility 100,
Best Practices 100, SEO 100; FCP 0.8 s, LCP 1.1 s, TBT 40 ms, CLS 0, total
transfer 31 KiB. Lighthouse covers the root route and does not supersede the
legal-route axe failure.

## Deployment identity and response policy

The locally built and live copies of all 12 emitted runtime files matched by
SHA-256: HTML, hashed JavaScript/CSS and source map, three image renditions,
icon, manifest, robots, sitemap, and service worker. Key hashes:

```text
index.html                  0d96e437191a0893cae1595231abb332d15c05ac68c9adfc13e5e275cd595c9d
assets/index-BmifYPoG.js   b767006dfb1ccb3914844f18750762227c5eedf965b24161d0a84824a54d4d2e
assets/index-wO9_q8Eg.css  f9628cd3395e9d249f41ceece7a53352b36e9eccb8610e265164df652c7332eb
sw.js                       6430b320309bc337de944b284aa11986e7e23771238b0bf2343597d35cfb5c5e
```

Responses retain HSTS, `nosniff`, `no-referrer`, restricted device
permissions, and the repository CSP. HTML is `max-age=30`, hashed assets are
one-year immutable, and `sw.js` is `no-cache`.

## Required before another review

1. Build the isolated one-click sample and its documentation.
2. Register and tag every public claim, then run every claim command from the
   sample entry point.
3. Repair all four open findings from the prior verification, including quota
   rollback/honest failure behavior.
4. Make the first screen, 404, metadata, navigation/footer skeleton, and copy
   evidence meet the attached contracts.
5. Re-run the full live desktop/phone, legal-route axe, offline/update, claim,
   and deployment-identity review.
