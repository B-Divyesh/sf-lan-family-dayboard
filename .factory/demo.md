# Demo sandbox

Open [/demo](https://lan-family-dayboard.sociobot.in/demo), or use
`http://localhost:4174/demo` after a production preview starts.

The demo loads one realistic household calendar with school drop-off, library
books, family dinner, and three recurring responsibilities. It uses only the
`demo:lan-dayboard-v1` browser-storage key. The real board uses
`lan-dayboard-v1`; demo mode neither reads nor writes it.

**Reset demo** restores the shipped sample in the demo key. **Start for real**
deletes the demo key and opens the real, empty-or-existing board. The sample
is regenerated for the current date so today and tomorrow remain populated.

Every command in [claims.json](claims.json) starts from this entry point.
