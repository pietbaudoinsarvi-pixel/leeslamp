# Leeslamp

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
Omslagen verschijnen eenmaal met 40 ms verspringing (begrensd op 320 ms); voortgang volgt na 300 ms.
Reduced motion schakelt alle animaties uit. Op smalle schermen wordt de zijrail een bovenrail.

Een rustige, lokale ebooklezer met bibliotheek, leesvoortgang en zes leesthema’s.
Ondersteunt EPUB, MOBI, AZW, AZW3, PRC, FB2, FBZ en CBZ via foliate-js.
Leest ook PDF, TXT, MD/MARKDOWN, HTML/HTM en DOCX; CBR en DRM zijn niet ondersteund.
Start lokaal met `npx serve .` of een andere statische HTTP-server en open het getoonde adres.
Deploy op Vercel als statische site, zonder buildopdracht; publiceer de repositoryroot.
Los geïmporteerde boeken en voortgang blijven in IndexedDB op dit apparaat; voorkeuren staan in localStorage.
Importeer via Importeren of slepen. Automatisch deelt elk boek afzonderlijk in; je kunt ook voor de hele selectie een categorie, Geen categorie of + Nieuwe categorie… kiezen.
Categorieën met aantallen staan in de zijbalk; klik om te filteren. Via ⋯ op een boekkaart wijzig je de categorie.
Open een boek en gebruik Aa, de inhoudsopgave en de schuifbalk.
De app werkt offline na de eerste online laadbeurt; PDF/DOCX/Markdown en fonts moeten eerst online geladen zijn.
Vereist een moderne browser met native adoptedStyleSheets; HTTPS of localhost voor PWA, PNG-iconen volgen apart.

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

## Automatische categorieën
De eerste laag werkt lokaal, zonder netwerk: onderwerpen en tags uit EPUB/MOBI/AZW, PDF-onderwerp/trefwoorden en FB2-genres worden opgeschoond en vergeleken met bestaande categorieën. Eerst geldt een exacte naam (ongevoelig voor hoofdletters en accenten), daarna Nederlandse en Engelse trefwoorden. Past geen bestaande categorie, dan maakt het eerste bruikbare onderwerp automatisch een nieuwe categorie. Foliate geeft Calibre-custommetadata momenteel niet door; als tags daarin beschikbaar worden, worden alleen tag-, onderwerp- en genrevelden gebruikt.

Alleen als deze laag niets oplevert, kan de optionele slimme laag helpen. Stel `ANTHROPIC_API_KEY` in bij de Vercel-omgevingsvariabelen en deploy opnieuw. De enige serverfunctie is `api/categorize.js`; een statische lokale server gebruikt uitsluitend de lokale laag. De client controleert de beschikbaarheid één keer per paginasessie en stuurt maximaal twintig boeken per aanvraag. Van het boek gaan alleen titel, auteur en onderwerpen naar Anthropic, samen met maximaal honderd bestaande categorienamen. Er worden geen boekbestanden, omslagen of boekinhoud verstuurd en de functie logt geen boekgegevens. Zonder sleutel, bij offline gebruik of bij een fout blijft het boek onder Geen categorie.

Automatisch is standaard geselecteerd in het importvenster. De eindmelding telt ook nieuwe categorieën. Bij gekoppelde mappen bepaalt de submap de oorspronkelijke categorie. Opnieuw scannen probeert alleen ongecategoriseerde boeken die nog niet automatisch zijn ingedeeld; een handmatige wijziging, ook naar Geen categorie, blijft behouden. Eerdere handmatige lege categorieën uit oudere appversies zijn niet te onderscheiden van nooit ingedeelde boeken; sla die keuze eenmaal opnieuw op om ze vast te zetten.

## Mobiel
Tik op Boeken zoeken (Find books) en selecteer meerdere ebooks in de bestandskiezer. Kies daar, waar beschikbaar, Alles selecteren om de hele map toe te voegen. De import begint direct met automatische categorieën, zonder extra dialoog. Importeren blijft beschikbaar om zelf een categorie te kiezen.

Een webapp kan niet zelfstandig de opslag van je telefoon doorzoeken. Android- en iOS-browsers bieden geen `showDirectoryPicker` of `webkitdirectory`: Boeken zoeken gebruikt daarom de gewone meervoudige bestandskiezer met ondersteunde ebooktypen. De kiezer bepaalt of Alles selecteren beschikbaar is. Bestanden worden lokaal naar IndexedDB gekopieerd. Tot en met 760 px wordt de zijbalk een bovenrail, staan boeken in twee kolommen en passen de leesknoppen en het Aa-paneel binnen het scherm.

## Taal / Language
Gebruik NL / EN onderaan de zijbalk om direct van taal te wisselen; je boek en leespositie blijven behouden. `/en` opent altijd Engels. Op `/` geldt je opgeslagen voorkeur (`leeslamp.lang`), anders Nederlands bij een Nederlandse browsertaal en Engels bij elke andere browsertaal. De switch past ook de URL aan en bewaart queryparameters. Vercel ondersteunt `/en` via `vercel.json`; een lokale server moet dezelfde route naar `index.html` sturen.
Use NL / EN in the sidebar to switch instantly. Share `/en` for English; `/` uses your saved preference or browser language. Your books, categories and reading position stay as they are.
