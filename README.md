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
Boeken en voortgang blijven in IndexedDB op dit apparaat; voorkeuren staan in localStorage.
Importeer via Importeren of slepen; open een boek en gebruik Aa, de inhoudsopgave en de schuifbalk.
De app werkt offline na de eerste online laadbeurt; PDF/DOCX/Markdown en fonts moeten eerst online geladen zijn.
Vereist een moderne browser met native adoptedStyleSheets; HTTPS of localhost voor PWA, PNG-iconen volgen apart.
