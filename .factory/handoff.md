# LAN Family Dayboard — verification handoff

## FAIL — candidate must not be accepted yet

Candidate commit: `9bb5f119a56c76c80f006261c2b3cdc763e42ab2`
Verified URL: <https://lan-family-dayboard.sociobot.in>
Verification date: 2026-08-28

The live deployment is byte-for-byte aligned with the locally built candidate
for the application HTML, JS, CSS, images, service worker, manifest, icon,
robots, and sitemap. Installation, unit tests, exact production build,
repository E2E tests, Lighthouse, deployment policy checks, and normal
calendar/feed/offline flows pass. The candidate still **fails** acceptance
because the following defects were reproduced independently:

1. **S2 functional:** completing a responsibility exposes an Undo button that
   does nothing; the completion remains checked and persisted.
2. **S2 input/recovery:** a whitespace-only responsibility title is accepted,
   creating and persisting a blank responsibility.
3. **S3 mobile accessibility:** Refresh LAN feeds measures 32 px high at the
   required 390 px viewport, below the 44 px minimum touch target.

See [.factory/verification.md](verification.md) for exact reproductions,
passing evidence, response policies, bundle measurements, PWA/offline checks,
and required fixes.

## How to reproduce the verified checks

```sh
npm ci
npm test
npm run build
npm run test:e2e
npm run preview
```

The production command is `npm run build`; it writes `dist/`. The verifier also
ran Lighthouse 12.8.2 against the built preview (100/100/100/100 for
performance/accessibility/best-practices/SEO) and browser checks on both the
preview and the live URL.

## Next steps

Fix the three defects above, add focused automated regressions for the first
two, rebuild, deploy, and repeat verification. Advanced recurrence limitations
and LAN CORS/mixed-content constraints remain documented product limitations,
not the basis for this FAIL.
