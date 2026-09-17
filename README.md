# Leeslamp

## Deployen
Elke push naar `master` op GitHub deployt automatisch via de Vercel-Git-koppeling; Vercel voert daarbij `node scripts/stamp.mjs` uit als buildopdracht, zodat `version.js` per deploy een nieuw stempel krijgt en geopende apps de updatemelding zien. Handmatig deployen kan nog steeds met `deploy.cmd`.
Gebruik vanuit de repositoryroot `deploy.cmd` om te publiceren, zodat open apps de melding krijgen dat ze kunnen vernieuwen. Het script schrijft een versiestempel (korte Git-hash plus UTC-tijd, of alleen tijd zonder Git), commit `version.js` en deployt naar Vercel. Sla appwijzigingen vooraf op in Git. Met Vernieuwen wordt de leesvoortgang bewaard en de app herladen; Later verbergt de melding tot een volgende update of herlaadbeurt.

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
Reduced motion schakelt alle animaties uit. Op smalle schermen wordt de zijrail een bovenrail.

Een rustige, lokale ebooklezer met bibliotheek, leesvoortgang en zes leesthema’s.
Ondersteunt EPUB, MOBI, AZW, AZW3, PRC, FB2, FBZ en CBZ via foliate-js.
Leest ook PDF, TXT, MD/MARKDOWN, HTML/HTM en DOCX; CBR en DRM zijn niet ondersteund.
Start lokaal met `npx serve .` of een andere statische HTTP-server en open het getoonde adres.
Deploy op Vercel als statische site, zonder buildopdracht; publiceer de repositoryroot.
Los geïmporteerde boeken en voortgang blijven in IndexedDB op dit apparaat; voorkeuren staan in localStorage.
Weigert de opslag tijdelijk — iOS verbreekt de databaseverbinding bij herladen of wegschakelen — dan probeert Leeslamp het op een verse verbinding opnieuw. Blijft het mislukken, dan wacht je leespositie in localStorage en wordt hij bij de volgende geslaagde opslag of bij de volgende start alsnog weggeschreven; de melding dat je leesvoortgang niet kon worden opgeslagen verschijnt alleen nog als ook dat niet lukt.
Importeer via Importeren of slepen. Automatisch deelt elk boek afzonderlijk in; je kunt ook voor de hele selectie een categorie, Geen categorie of + Nieuwe categorie… kiezen.
Categorieën met aantallen staan in de zijbalk; klik om te filteren. Via ⋯ op een boekkaart open je de boekacties, waaronder de categoriekeuze.
Open een boek en gebruik Aa, de inhoudsopgave en de schuifbalk.
De app werkt offline na de eerste online laadbeurt; PDF/DOCX/Markdown en fonts moeten eerst online geladen zijn.
Vereist een moderne browser met native adoptedStyleSheets; HTTPS of localhost voor PWA, PNG-iconen volgen apart.

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
Eén bestand is één boek. Leeslamp herkent een boek aan bestandsnaam, extensie en grootte, niet aan het willekeurige id dat elke import en elk apparaat opnieuw maakt. Daardoor ontstonden dubbelen: dezelfde map op twee apparaten koppelen (elk apparaat geeft een map een eigen root-id, dus elk pad een eigen boek-id), een map koppelen binnen een al gekoppelde map, hetzelfde bestand nog eens importeren, of een bestand importeren dat via de cloud al binnen was gekomen.
Importeren voegt een bestand dat al in de bibliotheek staat niet nog eens toe; stond die kaart alleen in de cloud, dan neemt hij het gekozen bestand over en is het boek meteen offline leesbaar. De melding na het importeren telt ze apart.
Bestaande dubbelen worden samengevoegd bij het starten, na importeren, na een mapscan en na elke synchronisatie. De kopie die overal leesbaar blijft, blijft staan: eerst het geopende boek, dan de cloudkopie, dan een kopie op dit apparaat, en anders de oudste. Die kopie krijgt de nieuwste leesvoortgang en leespositie, de gelezenmarkering, een handmatig gekozen categorie, ontbrekende metadata en een ontbrekend omslag van de andere; zijn bestand blijft bewaard als de blijvende kaart er nog geen had. Een kopie uit een gekoppelde map wordt verborgen in plaats van verwijderd, zodat een herscan hem niet terughaalt. Verborgen boeken doen nooit mee, het geopende boek verdwijnt nooit en een bronbestand wordt nooit aangeraakt. Met een account verdwijnt de dubbele kaart ook op je andere apparaten.
One file is one book: importing a file that is already in your library adds no second card, and existing duplicates are merged on start, after importing, after a folder scan and after every sync, keeping reading progress, category, metadata and cover.

## Automatische categorieën
De eerste laag werkt lokaal, zonder netwerk: onderwerpen en tags uit EPUB/MOBI/AZW, PDF-onderwerp/trefwoorden en FB2-genres worden opgeschoond en vergeleken met bestaande categorieën. Eerst geldt een exacte naam (ongevoelig voor hoofdletters en accenten), daarna Nederlandse en Engelse trefwoorden. Past geen bestaande categorie, dan maakt het eerste bruikbare onderwerp automatisch een nieuwe categorie. Foliate geeft Calibre-custommetadata momenteel niet door; als tags daarin beschikbaar worden, worden alleen tag-, onderwerp- en genrevelden gebruikt.

Alleen als deze laag niets oplevert, kan de optionele slimme laag helpen. Stel `ANTHROPIC_API_KEY` in bij de Vercel-omgevingsvariabelen en deploy opnieuw. De serverfunctie hiervoor is `api/categorize.js`; een statische lokale server gebruikt uitsluitend de lokale laag. De client controleert de beschikbaarheid één keer per paginasessie en stuurt maximaal twintig boeken per aanvraag. Van het boek gaan alleen titel, auteur en onderwerpen naar Anthropic, samen met maximaal honderd bestaande categorienamen. Er worden geen boekbestanden, omslagen of boekinhoud verstuurd en de functie logt geen boekgegevens. Zonder sleutel, bij offline gebruik of bij een fout blijft het boek onder Geen categorie.

Automatisch is standaard geselecteerd in het importvenster. De eindmelding telt ook nieuwe categorieën. Bij gekoppelde mappen bepaalt de submap de oorspronkelijke categorie. Opnieuw scannen probeert alleen ongecategoriseerde boeken die nog niet automatisch zijn ingedeeld; een handmatige wijziging, ook naar Geen categorie, blijft behouden. Eerdere handmatige lege categorieën uit oudere appversies zijn niet te onderscheiden van nooit ingedeelde boeken; sla die keuze eenmaal opnieuw op om ze vast te zetten.

## Mobiel
Tik op Boeken zoeken (Find books) en selecteer meerdere ebooks in de bestandskiezer. Kies daar, waar beschikbaar, Alles selecteren om de hele map toe te voegen. De import begint direct met automatische categorieën, zonder extra dialoog. Importeren blijft beschikbaar om zelf een categorie te kiezen.

Map importeren laat je een hele map kiezen op iOS Safari 18.4+ en Chrome voor Android 147+ via `webkitdirectory`. Leeslamp haalt de ondersteunde boekformaten eruit en kopieert de bestanden naar de opslag van de app (IndexedDB). De eerste submap onder de gekozen map wordt de categorie; boeken direct in de gekozen map krijgen automatisch een categorie. Met een ingelogd cloudaccount worden geïmporteerde boeken automatisch geüpload. Samsung Internet ondersteunt deze mapkiezer niet: als Map importeren daar een gewone bestandskiezer opent, worden de gekozen boeken met automatische categorieën geïmporteerd.

Een webapp kan niet zelfstandig de opslag van je telefoon doorzoeken. Boeken zoeken blijft beschikbaar en gebruikt de gewone meervoudige bestandskiezer met ondersteunde ebooktypen. De kiezer bepaalt of Alles selecteren beschikbaar is. Tot en met 760 px wordt de zijbalk een bovenrail, staan boeken in twee kolommen en passen de leesknoppen en het Aa-paneel binnen het scherm.
On iOS Safari 18.4+ and Chrome for Android 147+, Import folder copies supported books into app storage, uses subfolders as categories and uploads imported books automatically when signed in; Samsung Internet falls back to selecting individual files.

## Taal / Language
Gebruik NL / EN onderaan de zijbalk om direct van taal te wisselen; je boek en leespositie blijven behouden. `/en` opent altijd Engels. Op `/` geldt je opgeslagen voorkeur (`leeslamp.lang`), anders Nederlands bij een Nederlandse browsertaal en Engels bij elke andere browsertaal. De switch past ook de URL aan en bewaart queryparameters. Vercel ondersteunt `/en` via `vercel.json`; een lokale server moet dezelfde route naar `index.html` sturen.
Use NL / EN in the sidebar to switch instantly. Share `/en` for English; `/` uses your saved preference or browser language. Your books, categories and reading position stay as they are.

## Cloud en accounts
Met een Google-account neem je je bibliotheek en leesvoortgang mee naar een ander apparaat. Titels, omslagen, categorieën, verborgen boeken, de gelezenmarkering en leespositie gaan mee. Alles staat in je eigen Google Drive: boekgegevens en omslagen in verborgen appgegevens, ebookbestanden met hun oorspronkelijke naam in de map Leeslamp. Hiervoor gebruik je je eigen Drive-opslag (15 GB gratis), zonder opslagkosten voor de beheerder van Leeslamp. Zonder ingestelde serverfuncties blijft Leeslamp lokaal werken, met Op dit apparaat onderaan de zijbalk.

Inloggen voegt de lokale bibliotheek samen met je account. Geïmporteerde bestanden worden automatisch geüpload. Gekoppelde mappen blijven op dit apparaat; kies bij een boek via ⋯ voor Uploaden naar cloud om het bestand ook elders te kunnen lezen. Leeslamp heeft geen bestandsgroottelimiet voor uploads naar Drive. Een wolkje op een omslag betekent dat het bestand alleen in de cloud staat. Openen downloadt het bestand en bewaart het voor offline lezen.

Wijzigingen worden eerst opgehaald en daarna verstuurd. De nieuwste wijziging per boek geldt, ook voor de leespositie. Bij een verbroken verbinding blijft lezen werken; Leeslamp probeert opnieuw bij een volgende wijziging, bij terugkeer naar de app of zodra de verbinding terugkomt. Via je account kun je ook Nu synchroniseren kiezen. Uitloggen bewaart lokale boeken en bestanden en logt andere apparaten niet uit. Bij inloggen met een ander account vraagt Leeslamp eerst of de lokale bibliotheek mag worden gewist. Annuleren logt dat account meteen uit. Leesvoorkeuren, taal, thema en maptoegang blijven apparaatgebonden.

Cloud instellen:

1. Maak een Google Cloud-project aan en schakel de Google Drive API in.
2. Stel het OAuth-toestemmingsscherm in op External en publiceer naar In production. Testing beperkt je tot 100 gebruikers en laat refresh tokens na zeven dagen verlopen. Voeg deze vijf scopes toe: `openid`, `email`, `profile`, `https://www.googleapis.com/auth/drive.file` en `https://www.googleapis.com/auth/drive.appdata`. De Drive-scopes zijn niet-gevoelig; appverificatie is niet nodig. Merkverificatie voor een logo is optioneel.
3. Maak een OAuth-client van het type Web application. Voeg `https://leeslamp.vercel.app/api/auth/callback` toe als redirect-URI (of dezelfde route op je eigen domein), plus `http://localhost:3000/api/auth/callback` voor lokaal testen met `vercel dev`.
4. Stel in Vercel de omgevingsvariabelen `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` en `COOKIE_SECRET` in. Gebruik voor `COOKIE_SECRET` een willekeurig geheim van minstens 32 tekens. Houd deze waarden op de server. De refresh token staat versleuteld in een httpOnly-cookie; de tijdelijke access token blijft alleen in het geheugen van de app.
5. Deploy volgens Deployen hierboven. De serverfunctie `api/auth/[action].js` verzorgt de Google-aanmelding zonder extra afhankelijkheden of buildstap. Een gewone statische server biedt alleen de lokale bibliotheek.

Sign in with Google to keep your library and reading progress in your own Google Drive; downloaded books remain available offline.
