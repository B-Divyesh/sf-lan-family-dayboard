# Review 1 handoff — Show today’s family schedule and responsibilities

## Status: FAIL

Review 1 found 10 defects and 20 untested public claim groups. The authoritative
report is [`.factory/review-1.md`](review-1.md).

The deployed product matches implementation commit
`b42ab4f029aac5381f58a88f6cbfd5a463adcf6a` byte for byte. The documentation
baseline before this review was
`dbab698b2f8f5812b836079db53c89734126e9aa`. No product code or deployment was
changed.

## Main blockers

- No one-click sample, demo label, reset, real-data separation, or demo docs.
- No `.factory/claims.json`; 20 public claim groups lack required claim tests.
- Serious unnamed-link axe failures on both mobile legal routes.
- A second valid calendar can be reported as saved and then disappear after a
  quota failure and reload.
- The first screen, true 404, metadata, site skeleton, touch targets, and
  display-mode exit behavior do not meet their contracts.

## Verification run

```sh
npm ci
npm test
npm run build
npm run test:e2e
npm run preview -- --port 4174
/opt/fleet/lib/verify-url.sh https://lan-family-dayboard.sociobot.in /work/.evidence/verify-url
```

Install, unit tests, build, all 14 repository browser tests, preview, root URL
smoke, runtime hash comparison, and a successful Lighthouse retry passed. Live
desktop/phone and boundary testing reproduced the blockers above. Lighthouse
scored 100 in all four categories, with LCP 1.1 s and CLS 0; route-specific axe
still fails.

Review artifacts are under `/work/.evidence/`, including fresh-screen images,
the live audit JSON, Lighthouse JSON, a print PDF, the copied QA report, and the
machine-readable verdict.

## Next steps

Repair every finding in `.factory/review-1.md`, add the demo and registered
claim tests, deploy the implementation, then repeat the full independent live
review. Do not mark the product PASS from the existing green repository tests.
