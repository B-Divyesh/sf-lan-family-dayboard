# Review 2 — Show today’s family schedule and responsibilities

## Verdict: PASS

- Findings: **0** (S1: 0, S2: 0, S3: 0)
- Untested public claims: **0**
- Implementation reviewed: `6547272dad0ce008e35828a23fca95d9be9f3a7b`
- Documentation baseline reviewed: `f73e25729be55e5ddc37105eb01151b039cd5b1c`
- Live URL: <https://lan-family-dayboard.sociobot.in>
- Review date: 5 September 2026

The live release matches the implementation candidate for every public runtime
file: 16 served files matched byte-for-byte from a fresh production build.
`staticwebapp.config.json` is deployment configuration and correctly returns
HTTP 404 when requested as a public file.

## Job, audience, and first action before scrolling

- **Job:** show today’s family events and chores.
- **Audience:** households using one shared display for daily plans and responsibilities.
- **First action:** **Try it with sample data**, beside **Import a calendar**.

Fresh 1366 × 900 desktop and 390 × 844 phone contexts both showed the exact
job heading, audience sentence, and sample action in the first viewport. Each
had one `h1`, no horizontal overflow, and no console or page errors.

## Demo and functional paths

The fresh live `/demo` sample immediately showed school drop-off, library
books due, family dinner, and Pack school bags. Its persistent notice stated
that sample data is not saved to the real dayboard.

A real-storage task was seeded before entering demo. Adding a demo-only task
changed only `demo:lan-dayboard-v1`; the real `lan-dayboard-v1` value stayed
unchanged. **Reset demo** restored the sample and removed the demo-only task.
**Start for real** removed the demo key and restored the real task.

Passing browser and claim suites cover normal, invalid, boundary, and recovery
paths: local ICS import, same-name replacement, daily/weekly/monthly
recurrence, LAN feed refresh and retained last-good data after a 503, invalid
responsibility validation, a 5,000,001-byte file rejection, transactional
storage-failure recovery, completion Undo, print, display-mode exit, and
browser-data clearing. The live review separately confirmed a controlled
offline `/demo` reload: a service worker was active, its offline notice
appeared, and sample content remained visible.

## Claims and clean commands

The tree was clean at documentation baseline `f73e257`. The documented clean
setup and declared commands passed:

| Command | Result |
| --- | --- |
| `npm ci` | Passed; 60 packages installed, 0 vulnerabilities |
| `npm test` | Passed; 4/4 Vitest tests |
| `npm run build` | Passed; produced `dist/index.html` |
| `npm run test:e2e` | Passed; 20/20 Playwright tests |
| `npm run test:claims` | Passed; 21/21 production-preview claim tests |
| every exact command in `.factory/claims.json` | Passed individually; 21/21 commands, one matching test each |
| `git diff --check` | Passed before report edits |

The registry contains 21 unique claim IDs and the claim specification contains
exactly 21 unique `@claim:` tags. There are no missing, duplicate, or
unregistered tags. Landing, README, demo, Privacy, and Terms copy had no
additional visitor promise without a registered test.

The fresh build contains 31.21 KB raw JavaScript (10.84 KB gzip) and 16.52 KB
raw CSS (4.35 KB gzip), within the static product budgets. It loads no
third-party scripts or fonts.

## Accessibility, privacy, routes, and links

`/opt/fleet/lib/verify-url.sh` passed against the live root: HTTP 200, title,
`lang`, one `h1`, a `main` landmark, image alt text, labelled buttons, and no
load-time console errors. Fresh 390 px axe scans had zero serious or critical
violations on `/`, `/demo`, `/privacy`, and `/terms`.

Keyboard smoke testing put **Skip to dayboard** first; Enter moved focus to
`#main`. The reduced-motion context reported a `0.00001s` transition. The
passing browser coverage also checks labelled, 44 px legal controls, dialogs,
and responsive layout.

Fresh browser route checks returned the expected title and one `h1` for root,
demo, Privacy, Terms, and an unknown path. The unknown path deliberately
returned HTTP 404 and rendered the designed not-found page with its return
link. Every normal internal and external link returned HTTP 200; the skip link
on the intentional missing route returned expected HTTP 404 and is not a
broken page.

Automatic live `/demo` requests stayed same-origin. The only external action
is an explicit user-selected feed; its claim test verifies a direct browser
request without Cookie or Authorization headers. Live headers include HSTS,
`nosniff`, no-referrer, restricted permissions, and response CSP with
`frame-ancestors`.

No backend, tenant, restart, health, 429, CLI, library, or desktop checks
apply to this static-web product.

## Earlier findings

| Earlier finding | Current disposition | Current evidence |
| --- | --- | --- |
| F1 sample sandbox absent | Resolved | Fresh live isolation, Reset demo, and Start for real passed |
| F2 claims registry absent | Resolved | 21 registered IDs, 21 exact tagged tests, aggregate and individual commands passed |
| F3 unnamed mobile legal home link | Resolved | Fresh mobile Privacy and Terms axe: 0 serious/critical |
| F4 storage failure claimed success | Resolved | Passing transactional-save recovery browser test |
| F5 first screen lacked job, audience, and action | Resolved | Fresh desktop and phone before-scroll observation passed |
| F6 unknown URL served ordinary app | Resolved | Fresh live designed HTTP 404 passed |
| F7 mobile links under 44 px | Resolved | Passing mobile target-size browser test |
| F8 display mode could not exit by ordinary key or tap | Resolved | Registered display-mode claim passed |
| F9 titles and metadata incomplete | Resolved | Fresh route title checks and built metadata inspection passed |
| F10 site skeleton and copy evidence incomplete | Resolved | Header, footer, How it works, privacy limits, and copy audit inspected |
| Earlier Undo, blank-task, and refresh-target issues | Resolved | Current regression coverage passed |

## Evidence

- `/work/.evidence/lan-dayboard-review-2-smoke/verify.json` — live root smoke.
- Fresh browser observations: desktop and phone first screen, demo isolation,
  routes, links, axe, keyboard, privacy traffic, and controlled offline reload.

There are zero findings and zero untested public claims. **PASS.**
