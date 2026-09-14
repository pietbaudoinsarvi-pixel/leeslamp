# Leeslamp
Een rustige, lokale ebooklezer met bibliotheek, leesvoortgang en zes leesthema’s.
Ondersteunt EPUB, MOBI, AZW, AZW3, PRC, FB2, FBZ en CBZ via foliate-js.
Leest ook PDF, TXT, MD/MARKDOWN, HTML/HTM en DOCX; CBR en DRM zijn niet ondersteund.
Start lokaal met `npx serve .` of een andere statische HTTP-server en open het getoonde adres.
Deploy op Vercel als statische site, zonder buildopdracht; publiceer de repositoryroot.
Boeken en voortgang blijven in IndexedDB op dit apparaat; voorkeuren staan in localStorage.
Importeer via Importeren of slepen; open een boek en gebruik Aa, de inhoudsopgave en de schuifbalk.
De app werkt offline na de eerste online laadbeurt; PDF/DOCX/Markdown en fonts moeten eerst online geladen zijn.
Vereist een moderne browser met native adoptedStyleSheets; HTTPS of localhost voor PWA, PNG-iconen volgen apart.
