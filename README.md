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
Importeer via Importeren of slepen. Kies voor de hele selectie een categorie, Geen categorie of + Nieuwe categorie….
Categorieën met aantallen staan in de zijbalk; klik om te filteren. Via ⋯ op een boekkaart wijzig je de categorie.
Open een boek en gebruik Aa, de inhoudsopgave en de schuifbalk.
De app werkt offline na de eerste online laadbeurt; PDF/DOCX/Markdown en fonts moeten eerst online geladen zijn.
Vereist een moderne browser met native adoptedStyleSheets; HTTPS of localhost voor PWA, PNG-iconen volgen apart.

## Mappen en categorieën
Gebruik Map koppelen in Edge/Chrome of sleep een map naar de bibliotheek.
De directe submappen van de gekozen map zijn categorieën, met hun oorspronkelijke namen.
Alle diepere submappen worden doorzocht en blijven bij die eerste categorie; boeken direct in de gekozen map krijgen Geen categorie.
Ondersteunde bestanden: epub, mobi, azw, azw3, prc, fb2, fbz, cbz, pdf, txt, md, markdown, html, htm en docx.
Andere bestanden, waaronder mp3, mov, jpg, rar en zip, worden bij een mapscan genegeerd.
Gekoppelde boeken blijven op hun oorspronkelijke plek: IndexedDB bewaart alleen de maptoegang, relatieve paden, metadata, kleine omslagen en leesvoortgang.
De browser kan bij openen of opnieuw scannen opnieuw om leestoegang vragen. Houd de bronmap beschikbaar.
Opnieuw scannen controleert alle gekoppelde mappen, voegt nieuwe boeken toe en verwijdert verdwenen paden uit de bibliotheek.
Verplaatsen is een verdwenen en een nieuw pad: het nieuwe pad krijgt de categorie van zijn eerste submap en nieuwe leesvoortgang.
Een handmatig gewijzigde categorie blijft bij een ongewijzigd pad behouden. Verwijderen in Leeslamp wist nooit het bronbestand; een volgende scan voegt het opnieuw toe.
De scan toont eerst bestandsnamen en vult metadata en omslagen vervolgens één voor één aan. Ongewijzigde grootte en wijzigingsdatum slaan afgeronde metadata over.
Na afsluiten tijdens een scan kun je Opnieuw scannen gebruiken om ontbrekende metadata alsnog te verwerken.
Zonder File System Access API verschijnt Map importeren: dezelfde mapindeling, maar bestanden worden dan gekopieerd naar IndexedDB en niet gekoppeld.
Bij deze terugval bevat webkitRelativePath ook de gekozen hoofdmap; die naam wordt overgeslagen bij het bepalen van categorieën.
Voor browserautomatisering zijn `window.__leeslamp.linkFolder(handle)` en `window.__leeslamp.rescan()` beschikbaar, ook met een OPFS-directoryhandle.
