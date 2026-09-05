# Handoff — LAN Family Dayboard verification 3

## Status

PASS. Independent verification 3 found zero findings and zero untested public
claims. The product shows today’s and tomorrow’s family events and recurring
responsibilities on a shared display without household accounts.

Implementation candidate: 6547272dad0ce008e35828a23fca95d9be9f3a7b.
Documentation baseline: f3a22c7d490261bd7216cbfabcdac6cd8b935f64.
The live product at https://lan-family-dayboard.sociobot.in matches this
implementation candidate byte-for-byte for every emitted runtime file.

## What changed

- Added a one-click /demo sandbox with a realistic current-day sample, a
  persistent demo notice, Reset demo, Start for real, and the separate
  demo:lan-dayboard-v1 storage namespace. Demo mode never reads or writes the
  real lan-dayboard-v1 key.
- Added claims.json, demo documentation, and 21 production-browser claim
  checks. Each public product claim has one tagged, outcome-based command.
- Made saves transactional. A failed browser storage write now retains the
  previous saved state, leaves the import dialog open, and never announces a
  false success.
- Repaired mobile legal link names and all measured navigation touch targets.
  Added legal-route axe coverage at 390 px.
- Reworked the first screen around the job, audience, sample action, real
  import action, and three short facts. Added How it works and Privacy and
  limits sections, consistent navigation/footer structure, and copy audit.
- Added real Azure 404 handling with a designed 404.html page, route titles,
  canonical/OG/Twitter metadata, a 1200 × 630 original-art social image, and
  a 180 px touch icon.
- Made display mode leave on any ordinary key or a tap on the board. It now
  tells the visitor how to reveal controls.
- Updated the service-worker cache version and validated live controlled
  offline reload.

## Verification

Clean prerequisites and declared commands:

~~~sh
npm ci
npm test
npm run build
npm run test:e2e
npm run test:claims
~~~

Results: unit tests 4/4 passed; browser tests 20/20 passed; claim checks 21/21
passed; and every one of the 21 exact registered claim commands passed when
run separately. Build passed and produced dist/index.html. The claim command
runs from a production preview and its fresh /demo entry point.

Additional checks:

- Local and live verify-url smoke: title, language, main landmark, one h1,
  image alt text, labelled buttons, and zero load-time console errors.
- Live fresh desktop and 390 px phone contexts: the job headline, household
  audience, and sample action were visible before scrolling. The demo showed
  school drop-off, library books, family dinner, and responsibilities. A
  seeded real task stayed separate while a demo-only task was added; Reset
  restored the sample and Start for real discarded demo storage and restored
  the real task.
- Live Privacy and Terms at 390 px: axe serious/critical findings 0.
- Live unknown URL: HTTP 404, designed page, route-specific title, and return
  action.
- Live service worker: controller active and offline /demo reload showed
  Offline · showing saved copy with sample content.
- Live Lighthouse mobile: Performance 100, Accessibility 100, Best Practices
  100, SEO 100; LCP 1,103 ms, CLS 0, TBT 49 ms.
- Initial JavaScript is 31.21 KB raw and 10.84 KB gzip. CSS is 16.52 KB raw
  and 4.35 KB gzip.

Verification-3 evidence is under `/work/.evidence/lan-dayboard-verify-3-live/`.
The complete report is `.factory/verification-3.md`.

## Earlier findings

All F1–F10 review findings are resolved. Earlier verification issues for Undo,
blank responsibilities, refresh target size, legal-link naming, storage
exhaustion, mobile targets, and display-mode exit are covered by current
browser tests.

## Known gaps and dependencies

There are no known product defects. A user-run calendar feed remains an
external dependency: it must serve valid ICS and allow the browser request via
CORS. The product does not host, proxy, or receive that feed.
