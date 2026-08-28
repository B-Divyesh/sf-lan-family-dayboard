# LAN Family Dayboard

A private, no-account day display for a household tablet, e-ink browser, or wall screen. It combines exported ICS calendars with recurring responsibilities, shows today and tomorrow at a glance, and prints a useful seven-day sheet.

Live site: [lan-family-dayboard.sociobot.in](https://lan-family-dayboard.sociobot.in)

## What it does

- Imports standard `.ics` files entirely in the browser, including common daily, weekly, and monthly recurrence rules.
- Connects to a user-run HTTP(S) ICS feed and refreshes it manually. The last good response stays available when the network does not.
- Stores calendar content, feed addresses, responsibilities, completions, and theme preferences only in browser local storage.
- Gives a large today/tomorrow view, display mode, light/dark treatments, offline status, and a landscape weekly print layout.
- Works as an installable offline web app after the first successful load.

There are no accounts, analytics, third-party scripts, hosted calendar sync, credentials, messaging, or payment code.

## Use it

1. Open **Calendars** and choose an ICS file exported by Google Calendar, Apple Calendar, Outlook, or another calendar app. Choosing a file with the same name later replaces its saved copy—this is the manual refresh path for offline displays.
2. Optionally enter an ICS URL served by a machine on your LAN. The server must send a valid calendar and a suitable `Access-Control-Allow-Origin` header. A browser may block an `http://` feed if the dayboard itself is hosted over HTTPS; serving both from the LAN over HTTP or using HTTPS for both avoids mixed content.
3. Use **Add responsibility** to assign a recurring household task. Completion is tracked per day and can be undone immediately.
4. Use **Print week** for a paper backup. Press `D` to enter display mode and `Escape` to leave it.

## Develop and verify

Requires Node.js 20 or newer.

```sh
npm install
npm run dev
npm test
npm run build
npm run test:e2e
```

The exact production build command is `npm run build`. It writes the static site to `dist/`, with `dist/index.html` at its root. Playwright 1.58.2 is pinned; if Chromium is not already available, run `npx playwright install chromium` once before the end-to-end suite.

To preview the built output:

```sh
npm run preview
```

## Deploy

Deploy `dist/` to Azure Static Web Apps. `public/staticwebapp.config.json` supplies SPA navigation fallback, caching, and defensive headers and is copied into the build. The repository does not manage DNS or infrastructure.

## Privacy and compatibility

The runtime makes no requests except for its own static files and LAN feed URLs entered by the user. See `/privacy` and `/terms` in the application. Very large calendars are capped at 5 MB; recurrence support intentionally focuses on the common `DAILY`, `WEEKLY`, and `MONTHLY` forms used for household schedules.

The product brief is in `.factory/brief.json`; the product-specific art direction and generated-asset provenance are in `.factory/design.md`.

## License

MIT. See [LICENSE](LICENSE).
