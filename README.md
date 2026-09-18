# Leeslamp

Een rustige ebooklezer in de browser, met bibliotheek, leesvoortgang en zes leesthema's. Alles werkt lokaal op je apparaat; met een Google-account staat je bibliotheek daarnaast in je eigen Google Drive, zodat hij op al je apparaten hetzelfde is.

Ondersteunt EPUB, MOBI, AZW, AZW3, PRC, FB2, FBZ en CBZ via foliate-js, en daarnaast PDF, TXT, MD/MARKDOWN, HTML/HTM en DOCX. CBR en DRM worden niet ondersteund.

Importeer via Importeren of door bestanden naar het venster te slepen. Automatisch deelt elk boek afzonderlijk in; je kunt ook voor de hele selectie een categorie, Geen categorie of + Nieuwe categorie… kiezen. Een bestand dat al in je bibliotheek staat wordt overgeslagen, net als een leeg bestand; de eindmelding zegt hoeveel en waarom.

Categorieën met aantallen staan in de zijbalk; klik om te filteren. Via ⋯ op een boekkaart open je de boekacties, waaronder de categoriekeuze.

De app werkt offline na de eerste online laadbeurt; PDF/DOCX/Markdown en fonts moeten eerst online geladen zijn. Vereist een moderne browser met native adoptedStyleSheets, en HTTPS of localhost voor de installeerbare app.

A quiet ebook reader in the browser, local first, with an optional library in your own Google Drive.

## Lezen
Open een boek en gebruik Aa, de inhoudsopgave en de schuifbalk. Onder Aa kies je bij Pagina's of het boek als een of twee pagina's naast elkaar wordt getoond; Tekstbreedte begrenst de breedte per pagina. Pagina's naast elkaar bestaat alleen bij Pagina, niet bij Scrollen.

In een pdf ligt een onzichtbare tekstlaag over de pagina, zodat je tekst kunt selecteren en kopiëren. Een gescande pdf zonder tekst blijft een afbeelding.

Je leespositie wordt tijdens het lezen doorlopend opgeslagen. iOS verbreekt de databaseverbinding soms bij herladen of wegschakelen; Leeslamp probeert het dan op een verse verbinding opnieuw. Blijft het mislukken, dan wacht je leespositie in de browseropslag en wordt hij bij de volgende geslaagde opslag of de volgende start alsnog weggeschreven. De melding dat je leesvoortgang niet kon worden opgeslagen verschijnt alleen nog als ook dat niet lukt.

## Opzoeken en uitleggen
Selecteer tekst in een boek, tot 2000 tekens, en er verschijnt een knop. Dat werkt in de Foliate-formaten, de tekstformaten en pdf; niet in CBZ, dat alleen afbeeldingen bevat.

**Opzoeken** geeft zonder sleutel of account een korte uitleg met bronlink. Begint de selectie met een hoofdletter, dan zoekt Leeslamp eerst in Wikipedia, anders eerst in Wiktionary. Een verbogen woord zoals "passes" wordt één keer doorverwezen naar het grondwoord "pass", zodat je de betekenis ziet en niet alleen de verbuiging. Bij meer woorden gebruikt Wikipedia de eerste twaalf.

**Uitleggen** stelt een vraag aan een taalmodel, met een sleutel die je zelf invult onder Uitleg instellen. Kies een aanbieder en model: DeepSeek, xAI (Grok), OpenAI, Google (Gemini), OpenRouter, Anthropic, of een eigen adres dat de OpenAI- of Anthropic-vorm spreekt. Gemini heeft een gratis laag zonder betaalgegevens, met een daglimiet van Google.

Bij elke vraag gaan behalve je selectie ook 4000 tekens ervoor en 1500 erna mee, binnen hetzelfde hoofdstuk of dezelfde pagina, zodat het model kan zien naar wie of wat "hij" of "dit" verwijst. Het model beslist daarna zelf of het iets moet opzoeken. Het kan Wikipedia doorzoeken, een artikel lezen, een woord opzoeken en meer van het hoofdstuk lezen, in hoogstens vier rondes, acht opzoekacties en zestig seconden. Terwijl dat loopt zie je welke stap bezig is; onder het antwoord staan de pagina's die echt gelezen zijn. Ondersteunt een aanbieder geen functieaanroepen, dan geeft hij gewoon een direct antwoord. Heeft het model niets op te zoeken, dan verschijnt het antwoord in één keer in plaats van woord voor woord.

Een vraag met een paar opzoekacties kost ongeveer 5000 tokens, bij de meeste modellen ruim onder een cent.

Je sleutel wordt per apparaat bewaard in de browseropslag (`localStorage`), onversleuteld; alleen deze app kan erbij. Hij gaat rechtstreeks over HTTPS naar de gekozen aanbieder en nooit langs de server van Leeslamp, en staat niet in je Drive. Zet bij je aanbieder een uitgavenlimiet op de sleutel. Beide acties vereisen internet.

Select up to 2000 characters to look it up on Wikipedia or Wiktionary for free, or to ask a model of your choice with your own API key; the model reads the surrounding text and may look things up before it answers.

## Nu aan het lezen / Laatst gelezen
Nu aan het lezen toont geopende boeken met meer dan 0% en minder dan 98% voortgang die niet als gelezen zijn gemarkeerd, op volgorde van laatst openen. Elke kaart heeft een voortgangsbalk en percentage; in deze selectie zijn die extra benadrukt. Via ⋯ kun je een boek uit Laatst gelezen halen zonder de leespositie te verliezen, of het markeren als gelezen. Gelezen boeken blijven in Laatst gelezen staan; opnieuw openen wist de gelezenmarkering. Markeren als ongelezen wist de voortgang en leespositie en haalt het boek uit beide lijsten. Lijst leegmaken vraagt bevestiging en verwijdert alleen de momenteel getoonde boeken uit Laatst gelezen, ook bij een zoekopdracht, met behoud van hun leespositie. Boeken verschijnen na opnieuw openen weer in Laatst gelezen en, als hun voortgang voldoet, in Nu aan het lezen.

## Mappen en categorieën
Gebruik Map koppelen in Edge/Chrome of sleep een map naar de bibliotheek.
De directe submappen van de gekozen map zijn categorieën, met hun oorspronkelijke namen.
Alle diepere submappen worden doorzocht en blijven bij die eerste categorie; boeken direct in de gekozen map worden automatisch ingedeeld.
Ondersteunde bestanden: epub, mobi, azw, azw3, prc, fb2, fbz, cbz, pdf, txt, md, markdown, html, htm en docx.
Andere bestanden, waaronder mp3, mov, jpg, rar en zip, worden bij een mapscan genegeerd.
Gekoppelde boeken blijven op hun oorspronkelijke plek: IndexedDB bewaart alleen de maptoegang, relatieve paden, metadata, kleine omslagen en leesvoortgang.
De browser kan bij openen of opnieuw scannen opnieuw om leestoegang vragen. Houd de bronmap beschikbaar.
Opnieuw scannen controleert alle gekoppelde mappen, voegt nieuwe boeken toe en verwijdert verdwenen paden uit de bibliotheek.
Verplaatsen is een verdwenen en een nieuw pad: het nieuwe pad krijgt de categorie van zijn eerste submap en nieuwe leesvoortgang.
Een handmatig gewijzigde categorie blijft bij een ongewijzigd pad behouden. Verwijderen wist nooit een bronbestand: een geïmporteerd boek verdwijnt uit de bibliotheek, een boek uit een gekoppelde map wordt alleen verborgen en komt bij een volgende scan niet terug.
De scan toont eerst bestandsnamen en vult metadata en omslagen vervolgens één voor één aan. Ongewijzigde grootte en wijzigingsdatum slaan afgeronde metadata over.
Na afsluiten tijdens een scan kun je Opnieuw scannen gebruiken om ontbrekende metadata alsnog te verwerken.
Op desktops zonder File System Access API verschijnt Map importeren als de browser een mapkiezer ondersteunt: dezelfde mapindeling, maar bestanden worden dan gekopieerd naar IndexedDB en niet gekoppeld. Boeken zoeken blijft beschikbaar als alternatief.
Bij deze terugval bevat webkitRelativePath ook de gekozen hoofdmap; die naam wordt overgeslagen bij het bepalen van categorieën.
Voor browserautomatisering zijn `window.__leeslamp.linkFolder(handle)` en `window.__leeslamp.rescan()` beschikbaar, ook met een OPFS-directoryhandle.

## Dubbele boeken
Staat hetzelfde boek meer dan eens in je bibliotheek, dan verschijnt Dubbele boeken opruimen: onderin de zijbalk op de pc, in het filterpaneel op mobiel. Dat gebeurt vooral wanneer een boek zowel via een gekoppelde map als via een import op een ander apparaat binnenkwam.

Hetzelfde boek in hetzelfde formaat herkent Leeslamp aan exact dezelfde bestandsgrootte plus dezelfde bestandsnaam of titel. Hetzelfde boek in twee formaten, zoals een epub en een pdf, herkent het aan dezelfde titel en auteur uit de metadata; is de titel afgeleid van de bestandsnaam of ontbreekt de auteur, dan blijven beide staan. Een leeg bestand doet nooit mee.

Per boek blijft één exemplaar. Bij verschillende formaten wint een herschaalbaar formaat zoals epub van de pdf, omdat je daarin lettergrootte en thema kunt aanpassen. Daarna gaat een exemplaar uit een gekoppelde map op dit apparaat voor, en vervolgens een exemplaar waarvan het bestand in de cloud staat. Het overgebleven boek krijgt de verste leesvoortgang, een handmatig gekozen categorie en een omslag van de andere mee. Boeken zonder dubbelganger worden nooit aangeraakt.

Opruimen verwijdert geen enkel bestand uit je Google Drive. Staat het bestand van de verdwenen kopie in Drive en dat van het overgebleven boek niet, dan neemt het overgebleven boek dat bestand over, zodat je het op andere apparaten nog kunt openen; dat gebeurt alleen binnen hetzelfde formaat. Een dubbel boek uit een gekoppelde map wordt verborgen in plaats van verwijderd, zodat een volgende scan het niet terugzet. De opruiming geldt voor al je apparaten.

Duplicates can be cleaned up in one step; the epub wins over a pdf of the same book, reading progress is kept and no file is removed from Google Drive.

## Automatische categorieën
De eerste laag werkt lokaal, zonder netwerk: onderwerpen en tags uit EPUB/MOBI/AZW, PDF-onderwerp/trefwoorden en FB2-genres worden opgeschoond en vergeleken met bestaande categorieën. Eerst geldt een exacte naam (ongevoelig voor hoofdletters en accenten), daarna Nederlandse en Engelse trefwoorden. Past geen bestaande categorie, dan maakt het eerste bruikbare onderwerp automatisch een nieuwe categorie. Foliate geeft Calibre-custommetadata momenteel niet door; als tags daarin beschikbaar worden, worden alleen tag-, onderwerp- en genrevelden gebruikt.

Alleen als deze laag niets oplevert, kan de optionele slimme laag helpen. Stel `ANTHROPIC_API_KEY` in bij de Vercel-omgevingsvariabelen en deploy opnieuw. De serverfunctie hiervoor is `api/categorize.js`; een statische lokale server gebruikt uitsluitend de lokale laag. De client controleert de beschikbaarheid één keer per paginasessie en stuurt maximaal twintig boeken per aanvraag. Van het boek gaan alleen titel, auteur en onderwerpen naar Anthropic, samen met maximaal honderd bestaande categorienamen. Er worden geen boekbestanden, omslagen of boekinhoud verstuurd en de functie logt geen boekgegevens. Zonder sleutel, bij offline gebruik of bij een fout blijft het boek onder Geen categorie. Deze sleutel staat los van de sleutel die je zelf voor Uitleggen invult.

Automatisch is standaard geselecteerd in het importvenster. De eindmelding telt ook nieuwe categorieën. Bij gekoppelde mappen bepaalt de submap de oorspronkelijke categorie. Opnieuw scannen probeert alleen ongecategoriseerde boeken die nog niet automatisch zijn ingedeeld; een handmatige wijziging, ook naar Geen categorie, blijft behouden. Eerdere handmatige lege categorieën uit oudere appversies zijn niet te onderscheiden van nooit ingedeelde boeken; sla die keuze eenmaal opnieuw op om ze vast te zetten.

## Mobiel
Tot en met 760 px breed wordt de zijbalk een compacte bovenrail: bovenaan Leeslamp met je account, het thema en NL / EN, daaronder de importknoppen. De titel van de bibliotheek, bijvoorbeeld Alle boeken met een pijltje, is de navigatie: tik erop voor een schermvullend paneel met je lijsten en categorieën. Kiezen, het kruisje, Escape en de terugknop sluiten het paneel. Boeken staan in twee kolommen, en de leesknoppen en het Aa-paneel passen binnen het scherm.

Tik op Boeken zoeken en selecteer meerdere ebooks in de bestandskiezer. Kies daar, waar beschikbaar, Alles selecteren om de hele map toe te voegen. De import begint direct met automatische categorieën, zonder extra dialoog. Importeren blijft beschikbaar om zelf een categorie te kiezen.

Map importeren laat je een hele map kiezen op iOS Safari 18.4+ en Chrome voor Android 147+ via `webkitdirectory`. Leeslamp haalt de ondersteunde boekformaten eruit en kopieert de bestanden naar de opslag van de app (IndexedDB). De eerste submap onder de gekozen map wordt de categorie; boeken direct in de gekozen map krijgen automatisch een categorie. Met een ingelogd cloudaccount worden geïmporteerde boeken automatisch geüpload. Samsung Internet ondersteunt deze mapkiezer niet: als Map importeren daar een gewone bestandskiezer opent, worden de gekozen boeken met automatische categorieën geïmporteerd.

Staat een document op een iPhone alleen in iCloud en niet op het toestel zelf, dan levert de kiezer soms een leeg bestand op. Leeslamp weigert dat met een melding; download het document eerst in de app Bestanden en kies het dan opnieuw.

Een webapp kan niet zelfstandig de opslag van je telefoon doorzoeken. Boeken zoeken blijft beschikbaar en gebruikt de gewone meervoudige bestandskiezer met ondersteunde ebooktypen. De kiezer bepaalt of Alles selecteren beschikbaar is.

On phones the library title is the navigation, Import folder works on iOS Safari 18.4+ and Chrome for Android 147+, and empty files from iCloud are refused.

## Taal / Language
Gebruik NL / EN onderaan de zijbalk om direct van taal te wisselen; je boek en leespositie blijven behouden. `/en` opent altijd Engels. Op `/` geldt je opgeslagen voorkeur (`leeslamp.lang`), anders Nederlands bij een Nederlandse browsertaal en Engels bij elke andere browsertaal. De switch past ook de URL aan en bewaart queryparameters. Vercel ondersteunt `/en` via `vercel.json`; een lokale server moet dezelfde route naar `index.html` sturen.
Use NL / EN in the sidebar to switch instantly. Share `/en` for English; `/` uses your saved preference or browser language. Your books, categories and reading position stay as they are.

## Cloud en accounts
Met een Google-account neem je je bibliotheek en leesvoortgang mee naar een ander apparaat. Titels, omslagen, categorieën, verborgen boeken, de gelezenmarkering en leespositie gaan mee. Alles staat in je eigen Google Drive: boekgegevens en omslagen in verborgen appgegevens, ebookbestanden met hun oorspronkelijke naam in de map Leeslamp. Hiervoor gebruik je je eigen Drive-opslag (15 GB gratis), zonder opslagkosten voor de beheerder van Leeslamp. Zonder ingestelde serverfuncties blijft Leeslamp lokaal werken, met Op dit apparaat onderaan de zijbalk.

Inloggen voegt de lokale bibliotheek samen met je account. Geïmporteerde bestanden worden automatisch geüpload; een leeg bestand gaat nooit naar Drive, zodat het nooit een goede kopie op een ander apparaat vervangt. Gekoppelde mappen blijven op dit apparaat; kies bij een boek via ⋯ voor Uploaden naar cloud om het bestand ook elders te kunnen lezen. Leeslamp heeft geen bestandsgroottelimiet voor uploads naar Drive. Een wolkje op een omslag betekent dat het bestand alleen in de cloud staat. Openen downloadt het bestand, met een voortgangsindicator, en bewaart het voor offline lezen.

Wijzigingen worden eerst opgehaald en daarna verstuurd. De nieuwste wijziging per boek geldt, ook voor de leespositie. Tijdens het synchroniseren toont je account hoeveel records nog opgehaald moeten worden, en boeken verschijnen per batch. Bij een verbroken verbinding blijft lezen werken; Leeslamp probeert opnieuw bij een volgende wijziging, bij terugkeer naar de app of zodra de verbinding terugkomt. Via je account kun je ook Nu synchroniseren kiezen. Uitloggen bewaart lokale boeken en bestanden en logt andere apparaten niet uit. Bij inloggen met een ander account vraagt Leeslamp eerst of de lokale bibliotheek mag worden gewist. Annuleren logt dat account meteen uit. Leesvoorkeuren, taal, thema, maptoegang en je sleutel voor Uitleggen blijven apparaatgebonden.

Cloud instellen:

1. Maak een Google Cloud-project aan en schakel de Google Drive API in.
2. Stel het OAuth-toestemmingsscherm in op External en publiceer naar In production. Testing beperkt je tot 100 gebruikers en laat refresh tokens na zeven dagen verlopen. Voeg deze vijf scopes toe: `openid`, `email`, `profile`, `https://www.googleapis.com/auth/drive.file` en `https://www.googleapis.com/auth/drive.appdata`. De Drive-scopes zijn niet-gevoelig; appverificatie is niet nodig. Vul bij Branding de homepage en de privacyverklaring in (`/privacy`). Een logo zet merkverificatie in gang, en die vereist een domein dat je zelf bezit: een `vercel.app`-adres wordt daarvoor niet geaccepteerd.
3. Maak een OAuth-client van het type Web application. Voeg `https://leeslamp.vercel.app/api/auth/callback` toe als redirect-URI (of dezelfde route op je eigen domein), plus `http://localhost:3000/api/auth/callback` voor lokaal testen met `vercel dev`.
4. Stel in Vercel de omgevingsvariabelen `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` en `COOKIE_SECRET` in. Gebruik voor `COOKIE_SECRET` een willekeurig geheim van minstens 32 tekens. Houd deze waarden op de server. De refresh token staat versleuteld in een httpOnly-cookie; de tijdelijke access token blijft alleen in het geheugen van de app.
5. Deploy volgens Deployen hieronder. De serverfunctie `api/auth/[action].js` verzorgt de Google-aanmelding zonder extra afhankelijkheden. Een gewone statische server biedt alleen de lokale bibliotheek.

Sign in with Google to keep your library and reading progress in your own Google Drive; downloaded books remain available offline.

## Privacy
De privacyverklaring staat op `/privacy`, in het Nederlands en het Engels, en is bereikbaar vanuit de zijbalk en het inlogvenster. Kort: zonder account blijft alles op je apparaat. Met een account staan je boeken in je eigen Google Drive en slaat de server van Leeslamp niets op. Gebruik je Opzoeken, dan gaat de geselecteerde term naar Wikipedia of Wiktionary. Gebruik je Uitleggen, dan gaan de selectie, de omliggende tekst, de boektitel en je vraag naar de aanbieder die je zelf kiest, en de zoektermen die het model kiest naar Wikipedia of Wiktionary.

The privacy policy lives at `/privacy`.

## Deployen
Elke push naar `master` op GitHub deployt automatisch via de Vercel-Git-koppeling. Vercel voert daarbij `node scripts/stamp.mjs` uit als buildopdracht, zodat `version.js` per deploy een nieuw stempel krijgt en geopende apps de updatemelding zien. Met Vernieuwen wordt de leesvoortgang bewaard en de app herladen; Later verbergt de melding tot een volgende update of herlaadbeurt.

Handmatig deployen kan met `deploy.cmd` vanuit de repositoryroot: dat schrijft het stempel, commit `version.js` en deployt met de Vercel-CLI. Sla appwijzigingen vooraf op in Git.

De serverfuncties staan in `api/`: `api/auth/[action].js` voor de Google-aanmelding en `api/categorize.js` voor de slimme categorielaag. Beide zijn optioneel; zonder hun omgevingsvariabelen werkt de rest van de app gewoon.

Lokaal starten kan met `npx serve .` of een andere statische HTTP-server; dan werken de serverfuncties niet en blijft alles lokaal. Met `vercel dev` draaien ze wel.

Tests draaien met Node, zonder extra pakketten: `node scripts/test-cloud.mjs`, `test-dedupe.mjs`, `test-lookup.mjs`, `test-ask.mjs` en `test-agent.mjs`.

Every push to `master` deploys through Vercel; `deploy.cmd` remains for manual deploys.

## Ontwerp
Een stille leesconsole: minerale vlakken, haarlijnen en een smalle koperkleurige markering.
De vaste zijrail en het omslagraster geven de bibliotheek de rust van een native leesapp.
Systeemtypografie houdt de bediening direct herkenbaar; Lora geeft omslagen en boeken karakter.
Typeschaal: 10/11 px labels, 13/14 px bediening, 16 px panelen, 28–38 px bibliotheektitel.
Afstanden volgen een raster van 8 px, met halve stappen van 4 px voor compacte bediening.
Licht combineert kalkwit en mineraalgroen; donker gebruikt diepe groene grafiettonen.
Koper markeert acties en voortgang. Vierkante vlakken en 2 px hoeken houden de vorm precies.
Zes zelfstandige leesmaterialen: Dag, Sepia, Grijs, Schemer, Nacht en Zwart.
Bediening verdwijnt tijdens lezen; Aa en Inhoud verschijnen als lichte, scherp begrensde panelen.
Beweging: 150 ms voor aanraken, 500–600 ms voor onthullen; alleen transform en opacity.
Omslagen verschijnen eenmaal met 40 ms verspringing (begrensd op 320 ms); de voortgangsbalk is direct zichtbaar.
Omslagen buiten beeld worden overgeslagen bij layout en tekenen, zodat een bibliotheek van duizend boeken vlot blijft.
Reduced motion schakelt alle animaties uit. Op smalle schermen wordt de zijrail een bovenrail.
