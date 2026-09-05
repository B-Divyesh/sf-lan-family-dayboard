# LAN Family Dayboard

Show today’s family events and chores on a shared display. It is for a
household that wants a tablet, e-ink browser, or wall screen without accounts.

Try the one-click sample at [the live demo](https://lan-family-dayboard.sociobot.in/demo).
The sample uses separate browser storage and never changes real dayboard data.

## What it does

- Imports standard ICS files locally, including representative Google Calendar,
  Apple Calendar, and Outlook exports.
- Shows daily, weekly, and monthly recurring events, plus recurring household
  responsibilities.
- Connects directly to a user-run HTTP(S) ICS feed. Refresh it manually; the
  last good feed copy remains when a refresh fails.
- Shows populated today and tomorrow panels, a display mode, light and dark
  treatments, and a landscape seven-day print sheet.
- Works offline after the first visit as an installable standalone web app.
- Keeps normal use free of accounts, payment, analytics, and automatic
  third-party requests.

Imported files, responsibilities, completions, and preferences are stored in
browser local storage. The app rejects calendar files over 5 MB. Removing a
calendar or clearing browser site data removes saved dayboard data.

## Use

1. Choose **Try it with sample data** to see a populated board without setup.
   Use **Reset demo** to restore the sample, or **Start for real** to discard
   it and open your household board.
2. Choose **Calendars** and select an ICS export. Importing the same filename
   replaces its saved copy.
3. Optionally add an ICS address from a machine you run. The feed must allow
   browser access; credentials in a feed URL are rejected. The browser requests
   the address directly without cookies or authorization.
4. Choose **Add responsibility** for a task that repeats on selected days.
   Complete a task, then use **Undo** if needed.
5. Choose **Print week** for a paper backup. Press **D** for display mode;
   press any key or tap the board to show controls again.

## Run and verify

Requires Node.js 20 or newer and Playwright Chromium.

~~~sh
npm ci
npm run dev
npm test
npm run build
npm run test:e2e
npm run test:claims
~~~

**npm run build** writes the static production site to **dist/**, with
**dist/index.html** at its root. **npm run test:claims** first builds the
production output, then starts a production preview and runs every documented
claim from a fresh **/demo** browser context. If Chromium is not already
available, run **npx playwright install chromium** once.

Each public promise and its exact command is listed in
[.factory/claims.json](.factory/claims.json). The sample data and storage
separation are documented in [.factory/demo.md](.factory/demo.md).

## Deploy

Deploy **dist/** to Azure Static Web Apps. The copied
**staticwebapp.config.json** defines known application routes, a real
**404.html** response, caching, and defensive headers. The repository does not
manage DNS or infrastructure.

## Privacy and license

The app makes no automatic request outside its own origin. A user-selected feed
is the only external request and is fetched directly by the browser. See
[/privacy](https://lan-family-dayboard.sociobot.in/privacy) and
[/terms](https://lan-family-dayboard.sociobot.in/terms).

The researched brief is in [.factory/brief.json](.factory/brief.json). The
product visual thesis and asset provenance are in
[.factory/design.md](.factory/design.md). It is MIT licensed; see
[LICENSE](LICENSE).
