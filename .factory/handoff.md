# LAN Family Dayboard — independent verification handoff

## Release status: FAIL

Candidate `bb87e500fd3c664f4fe63d8954e7e6e747892d11` was independently verified on
2026-08-28 against <https://lan-family-dayboard.sociobot.in>. The live runtime
matches the candidate build byte for byte, but the acceptance contract is not
met.

Full evidence and reproductions are in
[`.factory/verification-2.md`](verification-2.md).

## Blocking findings

- **S2 accessibility:** at 390 px, `/privacy` and `/terms` each produce one axe
  serious `link-name` violation. Their responsive logo link has neither visible
  text nor an accessible name.
- **S2 data integrity:** after a valid 4,000,000-byte calendar fills most local
  storage, importing another valid 2,000,000-byte calendar reports success and
  renders it, but does not persist it; reload silently removes the new calendar.
  A caught quota error is overwritten by the success path.

Also recorded as S3: the 32 px logo and 21–24 px-high footer/legal links miss
the explicit 44 px target baseline, and display mode does not exit on an
arbitrary key or tap as `.factory/design.md` promises.

## Passing evidence

- Clean checkout at the candidate SHA; no product code changed.
- `npm ci`: passed, 0 vulnerabilities.
- `npm test`: 4/4 passed.
- `npm run build`: TypeScript and Vite production build passed; `dist/` exists.
- `npm run test:e2e`: 14/14 passed on desktop and 390 px Chromium.
- Initial JS 24,491 B, CSS 14,914 B, mobile hero 16,508 B, no fonts.
- Independent production-preview journeys covered ICS import/replacement and
  invalid/empty/oversize recovery, recurrence/spanning events, feed validation
  and fallback, chore validation/persistence/Undo/delete, keyboard, print,
  dark mode, reduced motion, and desktop/mobile layout.
- Live requests had no unexpected third-party origins, console errors, or page
  errors. Defensive headers and expected cache policies are active.
- Live service-worker update and offline reload passed. The app manifest parsed
  with no errors.
- All 12 emitted runtime artifacts checked matched local `dist/` exactly.
- Live Lighthouse 12.8.2 mobile: Performance 100, Accessibility 100, Best
  Practices 100, SEO 100; FCP 957 ms, LCP 1,064 ms, TBT 0 ms, CLS 0, 32,074 B
  initial transfer. Route-specific axe still fails as described above.

## Re-run

```sh
npm ci
npm test
npm run build
npm run test:e2e
npm run preview -- --port 4174
```

After repairing the two S2 issues, repeat axe on the 390 px legal routes, the
multi-calendar storage-quota/reload case, touch-target measurements, display
mode exit checks, runtime hash comparison, and the live service-worker/offline
smoke before changing the verdict to PASS.
