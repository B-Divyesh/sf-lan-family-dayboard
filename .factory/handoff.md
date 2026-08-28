# LAN Family Dayboard — repair handoff

## Release status

The three release-blocking findings in the independent verification report at
commit `e501425adfa6408671450dddde5bca24c66be9c4` have been repaired without
changing the researched scope or the static-web deployment class.

## Repairs

1. The completion toast now binds its dynamically inserted **Undo** control.
   Undo reverses the per-day completion in memory and local storage, rerenders
   the responsibility as unchecked, and confirms the reversal.
2. Responsibility submission now validates the trimmed name before mutation.
   A whitespace-only name leaves the dialog open, focuses the field, sets
   `aria-invalid="true"`, and exposes the linked inline `role="alert"` message.
   Nothing is persisted.
3. **Refresh LAN feeds** is now at least 44 CSS px high. The toast recovery
   control follows the same touch baseline. The 390 px header retains 8 px
   target spacing, drops its redundant wordmark, and has no horizontal
   overflow.

Exact Playwright regressions cover Undo plus reload persistence, whitespace-only
validation plus storage, and the refresh control's measured width/height plus
390 px overflow. They run in both desktop Chromium and the 390 × 844 mobile
project.

## Verification evidence

Run from `/work/repo`:

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

Results on 2026-08-28:

- Clean `npm ci`: 60 packages installed, 0 vulnerabilities.
- `npm test`: 4/4 Vitest unit tests passed.
- `npm run build`: TypeScript `tsc --noEmit` and Vite production build passed;
  `dist/index.html` is at the static-site root.
- Production output: JS 24,491 B (9.20 KB gzip), CSS 14,914 B (4.06 KB gzip),
  16,508 B mobile hero, 44,272 B desktop hero; no external fonts.
- `npm run test:e2e`: 14/14 Playwright tests passed across desktop and 390 ×
  844 mobile. The three repaired cases account for six focused passes.
- Axe Playwright scans: 0 serious/critical findings in both viewports and both
  light and dark treatments. The production smoke check found `lang="en"`, one
  `h1`, a `main`, complete image alt text, named buttons, and no console errors.
- Keyboard smoke: Tab exposed the skip link, Enter focused `#main`; native
  checkbox keyboard behavior and dialog controls remain covered by the browser
  suite. Reduced-motion transition duration measured `0.00001s`.
- Visual review: empty desktop at 1366 × 900 and empty/populated mobile at 390
  × 844 are legible with no clipping or horizontal overflow. All visible
  populated mobile buttons measured at least 44 px in both dimensions.
- Lighthouse 12.8.2 mobile: Performance 99, Accessibility 100, Best Practices
  100, SEO 100; FCP 1.0 s, LCP 1.6 s, CLS 0, TBT 70 ms, 32 KiB transfer.
- Production PWA smoke: service worker controlled the page, `update()`
  completed, cache `dayboard-v1` existed, and an offline reload rendered
  **Today at home** with **Offline · showing saved copy**.
- Privacy/routes: a fresh production load contacted only its own origin;
  `/privacy` and `/terms` rendered their intended pages. The repository's SWA
  config retains SPA fallback, immutable hashed-asset caching, `sw.js`
  revalidation, CSP, no-referrer, nosniff, and restricted device permissions.
- Packaging/consumer validation is not applicable to this static-web artifact;
  the deployable consumer boundary is the verified `dist/` root.

## Known limits

The previously documented non-blocking limits are unchanged: advanced RFC 5545
recurrence forms are not expanded; browser CORS and mixed-content policy governs
user-run LAN feeds; e-ink ghosting behavior remains device-specific.

## Deployment

Build `dist/`, then deploy with the work-order configuration:

```sh
/opt/fleet/lib/deploy-static.sh lan-family-dayboard dist
```

Live deployment identity and response-policy evidence will be appended after
the production upload.
