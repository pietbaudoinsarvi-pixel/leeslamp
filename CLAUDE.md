# Leeslamp

Een privé ebooklezer in de browser: bibliotheek, leesvoortgang, optionele synchronisatie via de eigen Google Drive van de lezer, en opzoeken of uitleggen tijdens het lezen. Vanilla JavaScript als ES-modules, geen buildstap, geen npm-afhankelijkheden, gehost op Vercel.

## Alleen dit project
- Werk uitsluitend in deze map. Maak hier geen bestanden of mappen aan voor een ander project, en schrijf niet naar de bovenliggende map `Projecten` of naar andere projecten.
- Tijdelijke bestanden gaan naar de scratchpad van de sessie of naar `.foreman/scratch/` (uitgesloten van Git), nooit naar de root van de repo.
- Kennis uit andere projecten (Bombos, OpenOS, marketing, coaching) is hier niet relevant. Gebruik die niet als context en roep de skills daarvan niet aan.
- Staat er iets in deze map dat duidelijk bij een ander project hoort, meld het en verplaats of verwijder het niet zelf.

## Opbouw
- `index.html`: alle opmaak en CSS, inline. `app.js`: de app. `sw.js`: service worker voor offline gebruik.
- `sync.js`: synchronisatie met Google Drive. `api/auth/[action].js`: Google-aanmelding. `api/categorize.js`: optionele slimme categorieën.
- `lookup.js`: Wikipedia en Wiktionary. `ask.js`: uitleg via de eigen API-sleutel van de lezer. `agent.js`: de meerstaps-uitleg met gereedschap.
- `dedupe.js`: dubbele boeken herkennen en opruimen.
- `vendor/foliate-js`: de ebook-engine; niet aanpassen.

## Werkwijze
- Elke tekst die een lezer ziet staat in `STRINGS` in `app.js`, in het Nederlands en het Engels, met dezelfde placeholders.
- Een nieuw bestand dat de app laadt hoort ook in `SHELL` en in de network-first-lijst van `sw.js`.
- Ontwerptaal staat in de README onder Ontwerp: minerale vlakken, haarlijnen, koperaccent, 2 px hoeken, raster van 8 px.
- Sleutels en tokens komen nooit in een log, een melding, een URL of de Drive van de lezer.

## Controleren voor een commit
- `node --check` op elk gewijzigd JavaScript-bestand.
- De tests: `node scripts/test-cloud.mjs`, `test-dedupe.mjs`, `test-lookup.mjs`, `test-ask.mjs` en `test-agent.mjs`.
- Taalpariteit en de browsertest, als `.foreman/scratch/` aanwezig is: `node .foreman/scratch/i18n-parity.mjs` en `node .foreman/scratch/smoke.mjs`. De browsertest moet 28 van 28 geven zonder consolefouten.
- Een wijziging die zichtbaar gedrag verandert, controleer ook in een echte browser, niet alleen met unit-tests.

## Deployen
Elke push naar `master` deployt via Vercel. Er kan tegelijk een andere sessie op deze repo werken: haal eerst op, en forceer nooit een push.
