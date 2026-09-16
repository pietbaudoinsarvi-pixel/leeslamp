import './vendor/foliate-js/view.js';
import { createTOCView } from './vendor/foliate-js/ui/tree.js';
import { autoCategory, collectSubjects, normalizeCategory, sameCategory } from './autocat.js';
import { createCloud } from './sync.js';
import { createImportIndex, planDedupe } from './dedupe.js';
import { buildQueries, lookup, cancelLookup } from './lookup.js';
import { PROVIDERS, buildRequest, ask, cancelAsk } from './ask.js';

const STRINGS = {
    nl: {
        lookup: 'Opzoeken',
        lookupClose: 'Paneel sluiten',
        lookupLoading: 'Opzoeken…',
        lookupEmpty: "Niets gevonden voor '{term}'.",
        lookupNetwork: 'Geen verbinding.',
        lookupWikipedia: 'Lees verder op Wikipedia',
        lookupWiktionary: 'Lees verder op Wiktionary',
        askExplain: 'Uitleggen',
        askSetup: 'Uitleg instellen',
        askDisclosure: 'Je gebruikt je eigen API-sleutel. De geselecteerde passage, boektitel, auteur, hoofdstuk en je vraag gaan naar de gekozen aanbieder.',
        askProvider: 'Aanbieder',
        askModel: 'Model',
        askOther: 'Anders…',
        askBaseUrl: 'Basis-URL (HTTPS)',
        askAdapter: 'API-formaat',
        askOpenai: 'OpenAI-compatibel',
        askAnthropic: 'Anthropic',
        askKey: 'API-sleutel',
        askKeyPage: 'Sleutel aanmaken bij aanbieder',
        askRemove: 'Verwijderen',
        askStoredKey: 'Opgeslagen sleutel: ••••{last}',
        askQuestion: 'Je vraag',
        askDefault: 'Leg deze passage uit.',
        askLoading: 'Uitleg wordt geschreven…',
        askPrice: 'Circa ${price} per vraag (500 invoer- en 500 uitvoertokens; werkelijk gebruik varieert).',
        askFree: 'Gratis laag, zonder betaalgegevens. Google stelt wel een daglimiet in.',
        askCheapest: 'Goedkoopste van deze modellen.',
        askKeyError: 'Je sleutel werkt niet. Controleer hem in de instellingen.',
        askRateLimit: 'Te veel verzoeken. Probeer het zo opnieuw.',
        askNoAnswer: 'Er kwam geen antwoord terug.',
        askNetwork: 'Geen verbinding.',
        askRefusal: 'Deze passage wordt liever niet uitgelegd.',
        askHttps: 'Gebruik een geldige HTTPS-basis-URL zonder inloggegevens, query of fragment.',
        askStorage: 'De sleutel kon niet op dit apparaat worden opgeslagen.',
        askEnterKey: 'Voer een sleutel in voor deze aanbieder.',
        account: 'Account',
        signIn: 'Inloggen',
        cloudTitle: 'Je bibliotheek overal',
        cloudDescription: 'Je boeken en leesvoortgang worden veilig in je account bewaard.',
        cloudSpaceHint: 'Tip: kies een Google-account met nog veel vrije ruimte voor je boeken.',
        privacyPolicy: 'Privacyverklaring',
        continueGoogle: 'Doorgaan met Google',
        syncNow: 'Nu synchroniseren',
        signOut: 'Uitloggen',
        cloudSynced: 'Gesynchroniseerd',
        cloudSyncing: 'Synchroniseren…',
        cloudSyncingCount: 'Synchroniseren… {done} / {total}',
        cloudOffline: 'Offline',
        cloudUnsynced: 'Niet gesynchroniseerd',
        cloudUpload: 'Uploaden naar cloud',
        cloudOnly: 'Alleen in de cloud',
        cloudFailed: 'Synchroniseren is mislukt. Probeer het opnieuw.',
        cloudSwitch: 'Dit apparaat bevat de bibliotheek van een ander account. Lokale boeken wissen en die van dit account laden?',
        cloudSwitchConfirm: 'Wissen en laden',
        dedupeBooks: 'Dubbele boeken opruimen',
        dedupeConfirm: '{count} boeken staan dubbel in je bibliotheek. Leeslamp houdt per boek één exemplaar en neemt de verste leesvoortgang mee. Er wordt geen bestand uit je Google Drive verwijderd.',
        dedupeConfirmOne: 'Eén boek staat dubbel in je bibliotheek. Leeslamp houdt één exemplaar en neemt de verste leesvoortgang mee. Er wordt geen bestand uit je Google Drive verwijderd.',
        dedupeRun: 'Opruimen',
        dedupeDone: '{count} dubbele boeken opgeruimd.',
        dedupeDoneOne: 'Eén dubbel boek opgeruimd.',
        dedupeUnsafe: 'Opruimen gestopt: een boek of bestandsverwijzing is gewijzigd of ontbreekt. Je overige boeken zijn behouden.',
        importSkipped: '{count} stonden al in je bibliotheek en zijn overgeslagen.',
        importSkippedOne: '1 stond al in je bibliotheek en is overgeslagen.',
        updateAvailable: 'Nieuwe versie beschikbaar',
        refreshApp: 'Vernieuwen',
        updateLater: 'Later',
        appTitle: 'Leeslamp · Je eigen leesruimte',
        description: 'Je boeken, rustig bij elkaar. Lees lokaal met Leeslamp.',
        library: 'Bibliotheek',
        closeFilters: 'Filters sluiten',
        downloading: 'Downloaden uit je cloud…',
        storageFull: 'Opslag van je apparaat is vol. Maak ruimte vrij of verwijder boeken.',
        allBooks: 'Alle boeken',
        currentlyReading: 'Nu aan het lezen',
        currentlyReadingEmpty: 'Open een boek en het verschijnt hier.',
        bookActions: 'Boekacties: {title}',
        removeRecent: 'Uit Laatst gelezen halen',
        markFinished: 'Markeren als gelezen',
        markUnread: 'Markeren als ongelezen',
        clearRecent: 'Lijst leegmaken',
        confirmClearRecent: 'Laatst gelezen leegmaken? Je leesvoortgang blijft bewaard.',
        recent: 'Laatst gelezen',
        categories: 'Categorieën',
        import: 'Importeren',
        automatic: 'Automatisch',
        findBooks: 'Boeken zoeken',
        findBooksHint: "Kies in de kiezer 'Alles selecteren' om je hele map toe te voegen.",
        newCategoriesOne: '{count} nieuwe categorie',
        newCategoriesOther: '{count} nieuwe categorieën',
        linkFolder: 'Map koppelen',
        importFolder: 'Map importeren',
        rescan: 'Opnieuw scannen',
        device: 'Op dit apparaat',
        tagline: 'Je eigen leesruimte',
        pace: 'Jouw boeken. Jouw tempo.',
        searchPlaceholder: 'Titel of auteur',
        searchLabel: 'Zoeken op titel of auteur',
        sort: 'Sorteren',
        title: 'Titel',
        author: 'Auteur',
        added: 'Toegevoegd',
        emptyFile: '{name}: het bestand is leeg. Controleer of het volledig op je apparaat staat en niet alleen in de cloud.',
        emptyBook: 'Dit boek is leeg: er zitten geen gegevens in het bestand. Verwijder het en voeg het opnieuw toe.',
        emptyTitle: 'Ruimte voor je volgende boek.',
        emptyDrag: 'Sleep je boeken hierheen.',
        emptyText: 'Je bibliotheek begint met één goed verhaal.',
        addBooks: 'Boeken toevoegen',
        noResultsTitle: 'Even verder zoeken.',
        noResultsText: 'Geen boeken in deze selectie.\nProbeer een andere titel, auteur of filter.',
        resetFilters: 'Toon alle boeken',
        category: 'Categorie',
        chooseCategory: 'Kies een categorie',
        newCategory: 'Nieuwe categorie',
        cancel: 'Annuleren',
        save: 'Opslaan',
        noCategory: 'Geen categorie',
        addCategory: '+ Nieuwe categorie…',
        reader: 'Boeklezer',
        back: 'Terug naar bibliotheek',
        toc: 'Inhoudsopgave',
        readingPrefs: 'Leesvoorkeuren',
        prev: 'Vorige pagina',
        next: 'Volgende pagina',
        readingProgress: 'Leesvoortgang',
        contents: 'Inhoud',
        closeToc: 'Inhoudsopgave sluiten',
        readingSpace: 'Jouw leesruimte',
        closePrefs: 'Leesvoorkeuren sluiten',
        paper: 'Licht & papier',
        readingTheme: 'Leesthema',
        font: 'Lettertype',
        size: 'Lettergrootte',
        smaller: 'Kleinere letters',
        larger: 'Grotere letters',
        lineHeight: 'Regelafstand',
        lessLineHeight: 'Kleinere regelafstand',
        moreLineHeight: 'Grotere regelafstand',
        width: 'Tekstbreedte',
        wider: 'Bredere tekst',
        narrower: 'Smallere tekst',
        widthSetting: 'Breedtestand',
        layout: 'Weergave',
        columns: 'Pagina’s',
        columnsLabel: 'Aantal pagina’s naast elkaar',
        layoutLabel: 'Pagina of scrollen',
        page: 'Pagina',
        scroll: 'Scrollen',
        justify: 'Tekst uitvullen',
        filters: 'Boekenfilter',
        noScript: 'Schakel JavaScript in om je boeken te lezen.',
        drop: 'Laat los om toe te voegen',
        languageSwitch: 'Taal: Nederlands. Wissel naar Engels.',
        publisherFont: 'Boek',
        theme_dag: 'Dag',
        theme_sepia: 'Sepia',
        theme_grijs: 'Grijs',
        theme_schemer: 'Schemer',
        theme_nacht: 'Nacht',
        theme_zwart: 'Zwart',
        mode_auto: 'Weergave: systeem',
        mode_light: 'Weergave: licht',
        mode_dark: 'Weergave: donker',
        openBook: '{title} openen',
        deleteBook: '{title} verwijderen',
        hideBook: '{title} verbergen',
        changeCategory: 'Categorie wijzigen: {title}',
        percentRead: '{percent}% gelezen',
        finishedLabel: 'Gelezen',
        opened: 'Geopend',
        unread: 'Ongelezen',
        bookCountOne: '{count} boek',
        bookCountOther: '{count} boeken',
        countOf: '{count} van {total} boeken',
        confirmHide: '"{title}" verbergen? Het bestand blijft in de map staan.',
        confirmDelete: '"{title}" verwijderen?',
        importProgress: 'Importeren… {current}/{total}',
        addedOne: '{count} boek toegevoegd',
        addedOther: '{count} boeken toegevoegd',
        scanFolder: 'Scannen… {name}',
        scanProgress: 'Scannen… {current}/{total}',
        scanResult: '{found} boeken gevonden, {added} nieuw',
        scanDenied: '{found} boeken gevonden, {added} nieuw\nGeen leestoegang: {names}. Bestaande boeken behouden.',
        unsupportedFile: '{name}: Dit bestandstype wordt niet ondersteund',
        metadataSkipped: '{name}: metadata overgeslagen',
        importFailedFile: '{name}: importeren mislukt',
        folderIncomplete: '{name}: map niet volledig leesbaar, bestaande boeken behouden',
        metadataMissing: '{name}: metadata niet beschikbaar',
        fileMissing: 'Bestand niet gevonden: {name}',
        openFailed: '“{title}” kon niet worden geopend. Controleer het bestand en je verbinding.',
        pageNumber: 'Pagina {page}',
        pageProgress: 'Pagina {page} / {total}',
        chapterProgress: 'Hoofdstuk {chapter} · {percent}%',
        sectionProgress: '{section} · {percent}%',
        percent: '{percent}%',
        pageFailed: 'Pagina {page} kon niet worden getoond.',
        bookTitle: '{title} · {app}',
        storageBlocked: 'Sluit andere Leeslamp-tabbladen om de opslag te openen.',
        storageFailed: 'Opslag mislukt',
        prefsFailed: 'Je voorkeuren konden niet worden opgeslagen.',
        categoryFailed: 'Categorie opslaan is mislukt.',
        deleteFailed: 'Verwijderen is mislukt.',
        downloadFailed: 'Download mislukt',
        coverFailed: 'Omslag kon niet worden gemaakt',
        importBusy: 'Er worden al boeken geïmporteerd. Probeer het zo opnieuw.',
        importRunning: 'Er loopt al een import',
        selectFolder: 'Kies een map',
        folderAccess: 'Geen leestoegang tot de map',
        linkFailed: 'Map koppelen is mislukt.',
        scanFailed: 'Scannen is mislukt. Probeer opnieuw.',
        addFailed: 'Toevoegen is mislukt. Gebruik Importeren of de mapknop.',
        progressFailed: 'Je leesvoortgang kon niet worden opgeslagen.',
        locationFailed: 'Deze locatie kon niet worden geopend.',
        opening: 'Boek openen…',
        readAccess: 'Geen leestoegang',
        fileStorageMissing: 'Bestand ontbreekt in de opslag',
        turnFailed: 'Bladeren is mislukt.',
        readPDF: 'PDF lezen',
        readText: 'Tekst lezen',
        untitled: 'Zonder titel',
        libraryFailed: 'De bibliotheek kon niet worden geladen. Controleer of browseropslag is toegestaan.',
    },
    en: {
        lookup: 'Look up',
        lookupClose: 'Close panel',
        lookupLoading: 'Looking up…',
        lookupEmpty: "Nothing found for '{term}'.",
        lookupNetwork: 'No connection.',
        lookupWikipedia: 'Read more on Wikipedia',
        lookupWiktionary: 'Read more on Wiktionary',
        askExplain: 'Explain',
        askSetup: 'Set up explanations',
        askDisclosure: 'You use your own API key. The selected passage, book title, author, chapter and your question go to your chosen provider.',
        askProvider: 'Provider',
        askModel: 'Model',
        askOther: 'Other',
        askBaseUrl: 'Base URL (HTTPS)',
        askAdapter: 'API format',
        askOpenai: 'OpenAI-compatible',
        askAnthropic: 'Anthropic',
        askKey: 'API key',
        askKeyPage: 'Create a key at your provider',
        askRemove: 'Remove',
        askStoredKey: 'Stored key: ••••{last}',
        askQuestion: 'Your question',
        askDefault: 'Explain this passage.',
        askLoading: 'Writing explanation…',
        askPrice: 'About ${price} per question (500 input and 500 output tokens; actual usage varies).',
        askFree: 'Free tier, no payment details needed. Google does apply a daily limit.',
        askCheapest: 'Cheapest of these models.',
        askKeyError: 'Your key does not work. Check it in settings.',
        askRateLimit: 'Too many requests. Try again shortly.',
        askNoAnswer: 'No answer was returned.',
        askNetwork: 'No connection.',
        askRefusal: 'This passage cannot be explained.',
        askHttps: 'Use a valid HTTPS base URL without credentials, query or fragment.',
        askStorage: 'The key could not be saved on this device.',
        askEnterKey: 'Enter a key for this provider.',
        account: 'Account',
        signIn: 'Sign in',
        cloudTitle: 'Your library everywhere',
        cloudDescription: 'Your books and reading progress are safely stored in your account.',
        cloudSpaceHint: 'Tip: pick a Google account with plenty of free space for your books.',
        privacyPolicy: 'Privacy policy',
        continueGoogle: 'Continue with Google',
        syncNow: 'Sync now',
        signOut: 'Sign out',
        cloudSynced: 'Synced',
        cloudSyncing: 'Syncing…',
        cloudSyncingCount: 'Syncing… {done} / {total}',
        cloudOffline: 'Offline',
        cloudUnsynced: 'Not synced',
        cloudUpload: 'Upload to cloud',
        cloudOnly: 'Only in the cloud',
        cloudFailed: 'Sync failed. Please try again.',
        cloudSwitch: 'This device contains the library of another account. Clear local books and load those of this account?',
        cloudSwitchConfirm: 'Clear and load',
        dedupeBooks: 'Clean up duplicates',
        dedupeConfirm: '{count} books are in your library twice. Leeslamp keeps one of each and takes the furthest reading progress with it. No file is removed from your Google Drive.',
        dedupeConfirmOne: 'One book is in your library twice. Leeslamp keeps one copy and takes the furthest reading progress with it. No file is removed from your Google Drive.',
        dedupeRun: 'Clean up',
        dedupeDone: '{count} duplicate books cleaned up.',
        dedupeDoneOne: 'One duplicate book cleaned up.',
        dedupeUnsafe: 'Cleanup stopped: a book or file reference changed or is missing. Your remaining books have been kept.',
        importSkipped: '{count} were already in your library and were skipped.',
        importSkippedOne: '1 was already in your library and was skipped.',
        updateAvailable: 'New version available',
        refreshApp: 'Refresh',
        updateLater: 'Later',
        appTitle: 'Leeslamp · Your reading space',
        description: 'A quiet home for your books. Read locally with Leeslamp.',
        library: 'Library',
        closeFilters: 'Close filters',
        downloading: 'Downloading from your cloud…',
        storageFull: 'Your device storage is full. Free up space or remove books.',
        allBooks: 'All books',
        currentlyReading: 'Currently reading',
        currentlyReadingEmpty: 'Open a book and it will appear here.',
        bookActions: 'Book actions: {title}',
        removeRecent: 'Remove from Recently read',
        markFinished: 'Mark as finished',
        markUnread: 'Mark as unread',
        clearRecent: 'Clear list',
        confirmClearRecent: 'Clear Recently read? Your reading progress will be preserved.',
        recent: 'Recently read',
        categories: 'Categories',
        import: 'Import',
        automatic: 'Automatic',
        findBooks: 'Find books',
        findBooksHint: "Choose 'Select all' in the picker to add your whole folder.",
        newCategoriesOne: '{count} new category',
        newCategoriesOther: '{count} new categories',
        linkFolder: 'Link folder',
        importFolder: 'Import folder',
        rescan: 'Rescan',
        device: 'On this device',
        tagline: 'A space to get lost in a book',
        pace: 'Your books. Your pace.',
        searchPlaceholder: 'Title or author',
        searchLabel: 'Search by title or author',
        sort: 'Sort by',
        title: 'Title',
        author: 'Author',
        added: 'Date added',
        emptyFile: '{name}: the file is empty. Check that it is fully downloaded to your device, not only stored in the cloud.',
        emptyBook: 'This book is empty: the file contains no data. Remove it and add it again.',
        emptyTitle: 'Make room for your next read.',
        emptyDrag: 'Drop your books here.',
        emptyText: 'One good story is all it takes to begin.',
        addBooks: 'Add books',
        noResultsTitle: 'Keep looking.',
        noResultsText: 'No books match this selection.\nTry another title, author or filter.',
        resetFilters: 'Show all books',
        category: 'Category',
        chooseCategory: 'Choose a category',
        newCategory: 'New category',
        cancel: 'Cancel',
        save: 'Save',
        noCategory: 'No category',
        addCategory: '+ New category…',
        reader: 'Book reader',
        back: 'Back to library',
        toc: 'Table of contents',
        readingPrefs: 'Reading preferences',
        prev: 'Previous page',
        next: 'Next page',
        readingProgress: 'Reading progress',
        contents: 'Contents',
        closeToc: 'Close table of contents',
        readingSpace: 'Your reading space',
        closePrefs: 'Close reading preferences',
        paper: 'Light & paper',
        readingTheme: 'Reading theme',
        font: 'Font',
        size: 'Size',
        smaller: 'Smaller text',
        larger: 'Larger text',
        lineHeight: 'Line height',
        lessLineHeight: 'Decrease line height',
        moreLineHeight: 'Increase line height',
        width: 'Width',
        wider: 'Wider text',
        narrower: 'Narrower text',
        widthSetting: 'Width setting',
        layout: 'Layout',
        columns: 'Pages',
        columnsLabel: 'Number of pages side by side',
        layoutLabel: 'Page or scroll',
        page: 'Page',
        scroll: 'Scroll',
        justify: 'Justify',
        filters: 'Book filters',
        noScript: 'Enable JavaScript to read your books.',
        drop: 'Drop to add books',
        languageSwitch: 'Language: English. Switch to Dutch.',
        publisherFont: 'Publisher',
        theme_dag: 'Day',
        theme_sepia: 'Sepia',
        theme_grijs: 'Grey',
        theme_schemer: 'Dusk',
        theme_nacht: 'Night',
        theme_zwart: 'Black',
        mode_auto: 'Appearance: system',
        mode_light: 'Appearance: light',
        mode_dark: 'Appearance: dark',
        openBook: 'Open {title}',
        deleteBook: 'Delete {title}',
        hideBook: 'Hide {title}',
        changeCategory: 'Change category: {title}',
        percentRead: '{percent}% read',
        finishedLabel: 'Finished',
        opened: 'Opened',
        unread: 'Unread',
        bookCountOne: '{count} book',
        bookCountOther: '{count} books',
        countOf: '{count} of {total} books',
        confirmHide: 'Hide "{title}"? The file will stay in its folder.',
        confirmDelete: 'Delete "{title}"?',
        importProgress: 'Importing… {current}/{total}',
        addedOne: '{count} book added',
        addedOther: '{count} books added',
        scanFolder: 'Scanning… {name}',
        scanProgress: 'Scanning… {current}/{total}',
        scanResult: '{found} books found, {added} new',
        scanDenied: '{found} books found, {added} new\nNo read access: {names}. Existing books kept.',
        unsupportedFile: '{name}: This file type is not supported',
        metadataSkipped: '{name}: metadata skipped',
        importFailedFile: '{name}: import failed',
        folderIncomplete: '{name}: could not read the entire folder; existing books kept',
        metadataMissing: '{name}: metadata unavailable',
        fileMissing: 'File not found: {name}',
        openFailed: 'Could not open “{title}”. Check the file and your connection.',
        pageNumber: 'Page {page}',
        pageProgress: 'Page {page} / {total}',
        chapterProgress: 'Chapter {chapter} · {percent}%',
        sectionProgress: '{section} · {percent}%',
        percent: '{percent}%',
        pageFailed: 'Could not display page {page}.',
        bookTitle: '{title} · {app}',
        storageBlocked: 'Close other Leeslamp tabs to access storage.',
        storageFailed: 'Storage failed',
        prefsFailed: 'Could not save your preferences.',
        categoryFailed: 'Could not save the category.',
        deleteFailed: 'Could not delete the book.',
        downloadFailed: 'Download failed',
        coverFailed: 'Could not create the cover',
        importBusy: 'Books are already being imported. Try again shortly.',
        importRunning: 'An import is already running',
        selectFolder: 'Choose a folder',
        folderAccess: 'No read access to the folder',
        linkFailed: 'Could not link the folder.',
        scanFailed: 'Scan failed. Please try again.',
        addFailed: 'Could not add books. Use Import or the folder button.',
        progressFailed: 'Could not save your reading progress.',
        locationFailed: 'Could not open this location.',
        opening: 'Opening book…',
        readAccess: 'No read access',
        fileStorageMissing: 'File is missing from storage',
        turnFailed: 'Could not turn the page.',
        readPDF: 'Read PDF',
        readText: 'Read text',
        untitled: 'Untitled',
        libraryFailed: 'Could not load the library. Check that browser storage is allowed.',
    },
};

// Small DOM and storage helpers. Original files never enter progress transactions.
const $ = selector => document.querySelector(selector);
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, Number(value) || 0));
const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
};
const icon = name => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'icon'); svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS(svg.namespaceURI, 'use');
    use.setAttribute('href', `#i-${name}`); svg.append(use);
    return svg;
};
let dbPromise, cloud = null;
const localFiles = new Set();
const downloadingBooks = new Map();
function downloading(id, delta) {
    const count = (downloadingBooks.get(id) || 0) + delta;
    if (count) downloadingBooks.set(id, count); else downloadingBooks.delete(id);
    for (const card of $('#grid').children) if (card.dataset.id === id) {
        card.querySelector('.cloud-badge')?.classList.toggle('downloading', count > 0);
        cardStates.delete(card);
    }
}
const database = () => dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open('leeslamp', 2);
    request.onupgradeneeded = () => {
        for (const name of ['files', 'books', 'roots']) {
            if (!request.result.objectStoreNames.contains(name)) request.result.createObjectStore(name, { keyPath: 'id' });
        }
    };
    request.onsuccess = () => {
        request.result.onversionchange = () => { request.result.close(); dbPromise = null; };
        request.result.onclose = () => { dbPromise = null; };
        resolve(request.result);
    };
    request.onerror = () => { dbPromise = null; reject(request.error); };
    request.onblocked = () => toast(() => t('storageBlocked'));
});
const connectionLost = error => ['InvalidStateError', 'UnknownError'].includes(error?.name) || /Connection/i.test(error?.message || '');
const recoverStorage = async operation => {
    try { return await operation(); }
    catch (error) {
        if (!connectionLost(error)) throw error;
        const stale = dbPromise; dbPromise = null;
        try { (await stale)?.close(); } catch {}
        return operation();
    }
};
const tx = (store, mode, fn) => recoverStorage(async () => {
    const db = await database();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(store, mode);
        let request;
        transaction.oncomplete = () => resolve(request?.result);
        transaction.onerror = transaction.onabort = event => reject(event.target.error ?? transaction.error ?? new Error(t('storageFailed')));
        try { request = fn(transaction.objectStore(store), transaction); }
        catch (error) { transaction.abort(); reject(error); }
    });
});
const put = async (store, obj) => {
    if (store === 'books') obj.updated = Date.now();
    const result = await tx(store, 'readwrite', s => s.put(obj));
    if (store === 'books') cloud?.changed();
    return result;
};
const get = (store, id) => tx(store, 'readonly', s => s.get(id));
const all = store => tx(store, 'readonly', s => s.getAll());
// Import/delete are atomic across both stores, including quota failures.
const bookTransaction = async (record, file, remove = false) => {
    record.updated = Date.now();
    await recoverStorage(async () => {
        const db = await database();
        await new Promise((resolve, reject) => {
            const transaction = db.transaction(['files', 'books'], 'readwrite');
            transaction.oncomplete = resolve;
            transaction.onerror = transaction.onabort = event => reject(event.target.error ?? transaction.error ?? new Error(t('storageFailed')));
            if (remove) {
                transaction.objectStore('books').delete(record.id);
                transaction.objectStore('files').delete(record.id);
            } else {
                transaction.objectStore('files').put({ id: record.id, file });
                transaction.objectStore('books').put(record);
            }
        });
    });
    if (remove) { localFiles.delete(record.id); cloud?.remove(record); }
    else localFiles.add(record.id);
    cloud?.changed();
};
const readSetting = (key, fallback) => {
    try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
};
// UI language is independent of stored books and reader preferences.
let lang = resolveLanguage();
function resolveLanguage() {
    if (location.pathname === '/en') return 'en';
    const stored = location.pathname === '/en' ? '' : readSetting('leeslamp.lang', '');
    return ['nl', 'en'].includes(stored) ? stored : navigator.language.toLowerCase().startsWith('nl') ? 'nl' : 'en';
}
function t(key, params = {}) {
    const template = STRINGS[lang][key] ?? STRINGS.nl[key];
    if (template == null) throw new Error(`Unknown translation: ${key}`);
    return template.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? ''));
}
function localize(node, key, params = {}, attribute) {
    node.dataset.i18n ??= '';
    if (attribute) node.setAttribute(`data-i18n-${attribute}`, key);
    else node.dataset.i18n = key;
    if (Object.keys(params).length) node.dataset.i18nParams = JSON.stringify(params);
    if (attribute) node.setAttribute(attribute, t(key, params));
    else node.textContent = t(key, params);
    return node;
}
function updateTitle() {
    document.title = active ? t('bookTitle', { title: active.record.title, app: t('appTitle') }) : t('appTitle');
}
function updateProgressLabel(session) {
    $('#progress-label').textContent = session.progressLabel?.() ?? t('percent', { percent: Math.round(session.record.fraction * 100) });
}
function applyLanguage() {
    document.documentElement.lang = lang;
    // One pass through marked UI nodes, only at startup or a language change.
    for (const node of document.querySelectorAll('[data-i18n]')) {
        const params = JSON.parse(node.dataset.i18nParams || '{}');
        if (node.dataset.i18n) node.textContent = t(node.dataset.i18n, params);
        for (const attribute of ['title', 'placeholder', 'aria-label', 'content', 'data-drop-label']) {
            const key = node.getAttribute(`data-i18n-${attribute}`);
            if (key) node.setAttribute(attribute, t(key, params));
        }
    }
    for (const node of $('#lang').querySelectorAll('[data-language]')) {
        node.classList.toggle('selected', node.dataset.language === lang);
    }
    $('#lang').setAttribute('aria-pressed', String(lang === 'en'));
    updateTitle(); applyMode(); renderLibrary();
    if (active) updateProgressLabel(active);
    if (!$('#toast').hidden && toastMessage) $('#toast').textContent = toastMessage();
}
$('#lang').addEventListener('click', () => {
    lang = lang === 'nl' ? 'en' : 'nl';
    writeSetting('leeslamp.lang', lang);
    history.replaceState(history.state, '', `${lang === 'en' ? '/en' : '/'}${location.search}${location.hash}`);
    applyLanguage();
});

const writeSetting = (key, value) => {
    try { localStorage.setItem(key, value); }
    catch (error) { report(() => t('prefsFailed'), error); }
};
let toastTimer, toastMessage;
function toast(message, duration = 4000) {
    clearTimeout(toastTimer);
    toastMessage = typeof message === 'function' ? message : () => message;
    $('#toast').textContent = toastMessage();
    $('#toast').hidden = false;
    if (duration) toastTimer = setTimeout(() => { $('#toast').hidden = true; toastMessage = null; }, duration);
}
const failureMessage = (message, error) => error?.name === 'QuotaExceededError' ? t('storageFull')
    : `${typeof message === 'function' ? message() : message}${error?.name && !connectionLost(error) ? ` (${error.name})` : ''}`;
const report = (message, error) => { console.error(error); toast(() => failureMessage(message, error)); };

// App chrome and reader preferences are deliberately independent.
const THEMES = {
    dag: { bg: '#fffffc', fg: '#252b28', link: '#376455', dark: false },
    sepia: { bg: '#f1e8d7', fg: '#514333', link: '#835329', dark: false },
    grijs: { bg: '#e2e6e1', fg: '#303832', link: '#365f54', dark: false },
    schemer: { bg: '#303735', fg: '#dce2d9', link: '#b7cfc2', dark: true },
    nacht: { bg: '#181c1a', fg: '#cbd2c9', link: '#a9c9b9', dark: true },
    zwart: { bg: '#000000', fg: '#bdc5bc', link: '#a9c9b9', dark: true },
};
const fonts = ['Lora', 'Lato', 'Georgia', 'Lexend', 'Boek'];
const defaults = { theme: 'dag', font: 'Lora', size: 18, lh: 1.5, width: 2, columns: 2, flow: 'paginated', justify: true };
let savedPrefs;
try { savedPrefs = JSON.parse(readSetting('leeslamp.prefs', '{}')); } catch { savedPrefs = {}; }
const prefs = { ...defaults, ...savedPrefs };
if (!Object.hasOwn(THEMES, prefs.theme)) prefs.theme = defaults.theme;
if (!fonts.includes(prefs.font)) prefs.font = defaults.font;
prefs.size = Math.round(clamp(prefs.size, 12, 32));
prefs.lh = Math.round(clamp(prefs.lh, 1.2, 2) * 10) / 10;
prefs.width = Math.round(clamp(prefs.width, 1, 4));
prefs.columns = prefs.columns === 1 ? 1 : 2;
prefs.flow = prefs.flow === 'scrolled' ? 'scrolled' : 'paginated';
prefs.justify = typeof prefs.justify === 'boolean' ? prefs.justify : true;
const widthPx = () => ({ 1: 1100, 2: 900, 3: 760, 4: 640 })[prefs.width];
const fontFamily = () => prefs.font === 'Boek' ? 'Georgia, serif'
    : `"${prefs.font}", ${['Lato', 'Lexend'].includes(prefs.font) ? 'sans-serif' : 'Georgia, serif'}`;
const fontImport = "@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,700;1,400;1,700&family=Lato:ital,wght@0,400;0,700;1,400&family=Lexend:wght@400;600&display=swap');";
// Publisher stylesheets often set text-align on paragraph classes, which beats the injected rule.
// Set it per element with priority, but leave deliberately centred or right-aligned text alone.
function applyJustify(doc) {
    const value = prefs.justify ? 'justify' : 'start';
    const view = doc.defaultView;
    for (const el of doc.querySelectorAll('p, li, blockquote, dd')) {
        if (el.dataset.leeslampAlign === undefined) {
            el.style.removeProperty('text-align');
            const computed = view.getComputedStyle(el).textAlign;
            el.dataset.leeslampAlign = ['center', 'right', 'end', '-webkit-center', '-webkit-right'].includes(computed) ? 'keep' : 'set';
        }
        if (el.dataset.leeslampAlign === 'set') el.style.setProperty('text-align', value, 'important');
    }
}
function bookCSS() {
    const t = THEMES[prefs.theme];
    return [
        `${fontImport}\nhtml { color-scheme:${t.dark ? 'dark' : 'light'}; color:${t.fg}; background:${t.bg}; font-size:${prefs.size}px; } a:link { color:${t.link}; }`,
        `@namespace epub "http://www.idpf.org/2007/ops";
        p, li, blockquote, dd { line-height:${prefs.lh}; text-align:${prefs.justify ? 'justify' : 'start'};
            hyphens:auto; -webkit-hyphens:auto; widows:2; orphans:2; }
        ${prefs.font === 'Boek' ? '' : `body, p, div, span, li, td, h1, h2, h3, h4, h5, h6 { font-family:${fontFamily()} !important; }`}
        pre { white-space:pre-wrap !important; }
        aside[epub|type~="endnote"], aside[epub|type~="footnote"],
        aside[epub|type~="note"], aside[epub|type~="rearnote"] { display:none; }`,
    ];
}
let mode = readSetting('leeslamp.mode', 'auto');
if (!['auto', 'light', 'dark'].includes(mode)) mode = 'auto';
const systemTheme = matchMedia('(prefers-color-scheme: dark)');
function applyMode() {
    document.documentElement.dataset.mode = mode;
    $('#mode').title = t(`mode_${mode}`);
    $('#mode').setAttribute('aria-label', $('#mode').title);
    $('#mode').replaceChildren(icon(mode));
    $('meta[name="theme-color"]').content = active ? THEMES[prefs.theme].bg
        : mode === 'dark' || (mode === 'auto' && systemTheme.matches) ? '#171c19' : '#f3f3ef';
}
$('#mode').addEventListener('click', () => {
    mode = { auto: 'light', light: 'dark', dark: 'auto' }[mode];
    writeSetting('leeslamp.mode', mode);
    applyMode();
});
systemTheme.addEventListener('change', applyMode);

// Library. Only metadata and small cover blobs are loaded on startup.
let books = [], roots = [], filter = 'all', query = '', searchTimer, importing = false;
let dedupeCount = -1;
const coverURLs = new Map();
const coverBlobs = new Map();
// Keep filtered-out cards detached so returning to All books also reuses images.
const bookCards = new Map();
const cardStates = new WeakMap();
// Stagger only covers not yet presented this session; searching never replays the grid.
const presentedBooks = new Set();
const collator = new Intl.Collator('nl', { sensitivity: 'base', numeric: true });
const visibleBooks = () => books.filter(book => !book.hidden);
const isCurrentlyReading = book => Boolean(book.opened) && book.fraction > 0 && book.finished !== true && book.fraction < 0.98;
let listedBooks = [];
const categories = () => [...new Set(visibleBooks().map(book => book.category))].sort(collator.compare);
const categoryFilter = () => filter.startsWith('category:');
const filterName = () => categoryFilter() ? filter.slice(9) || t('noCategory')
    : filter === 'reading' ? t('currentlyReading') : filter === 'recent' ? t('recent') : t('allBooks');
let filterSignature = '';
function renderFilters() {
    const visible = visibleBooks();
    const counts = new Map();
    let reading = 0, recent = 0;
    for (const book of visible) {
        counts.set(book.category, (counts.get(book.category) || 0) + 1);
        if (isCurrentlyReading(book)) reading++;
        if (book.opened) recent++;
    }
    if (!['all', 'reading', 'recent'].includes(filter) && !(categoryFilter() && counts.has(filter.slice(9)))) filter = 'all';
    const categoryCounts = [...counts].sort(([a], [b]) => collator.compare(a, b));
    const signature = JSON.stringify([lang, visible.length, reading, recent, categoryCounts]);
    if (signature === filterSignature) {
        for (const button of $('#filter-list').querySelectorAll('button')) {
            if (button.dataset.filter === filter) {
                if (!button.hasAttribute('aria-current')) button.setAttribute('aria-current', 'page');
            } else if (button.hasAttribute('aria-current')) button.removeAttribute('aria-current');
        }
        $('#filters-toggle-label').textContent = filterName();
        return;
    }
    filterSignature = signature;
    const focusedFilter = document.activeElement?.closest('#filters button')?.dataset.filter;
    const fragment = document.createDocumentFragment();
    const add = (value, label, count) => {
        const button = el('button', '', label);
        button.dataset.filter = value;
        if (filter === value) button.setAttribute('aria-current', 'page');
        button.append(el('span', 'count', count));
        fragment.append(button);
    };
    add('all', t('allBooks'), visible.length);
    add('reading', t('currentlyReading'), reading);
    add('recent', t('recent'), recent);
    if (visible.length) fragment.append(el('div', 'section-label', t('categories')));
    for (const [category, count] of categoryCounts) add(`category:${category}`, category || t('noCategory'), count);
    $('#filter-list').replaceChildren(fragment);
    if (focusedFilter) [...$('#filter-list').children].find(node => node.dataset.filter === focusedFilter)?.focus({ preventScroll: true });
    $('#filters-toggle-label').textContent = filterName();
}
function renderDedupe() {
    const count = visibleBooks().length;
    if (count === dedupeCount) return;
    dedupeCount = count;
    const hidden = planDedupe(books, roots).total === 0;
    for (const id of ['#dedupe', '#dedupe-mobile']) $(id).hidden = hidden;
}
function renderLibrary() {
    renderDedupe();
    renderFilters();
    const sort = filter === 'reading' ? 'opened' : $('#sort').value;
    $('#sort').hidden = filter === 'reading';
    const allBooks = visibleBooks();
    const visible = allBooks.filter(b => (filter === 'all' || (categoryFilter() ? b.category === filter.slice(9) : filter === 'reading' ? isCurrentlyReading(b) : filter === 'recent' && b.opened))
        && `${b.title} ${b.author}`.toLocaleLowerCase('nl').includes(query));
    visible.sort((a, b) => {
        if (sort === 'title' || sort === 'author') return collator.compare(a[sort], b[sort]) || collator.compare(a.title, b.title);
        return (sort === 'opened' ? (b.opened ?? 0) - (a.opened ?? 0) : 0) || b.added - a.added;
    });
    const grid = $('#grid');
    const visibleIds = new Set(visible.map(book => book.id));
    for (const card of [...grid.children]) if (!visibleIds.has(card.dataset.id)) {
        card.remove();
        card.classList.remove('arriving');
    }
    const retiredURLs = [];
    const currentCovers = new Map(allBooks.map(book => [book.id, book.cover]));
    for (const id of bookCards.keys()) if (!currentCovers.has(id)) bookCards.delete(id);
    for (const [id, url] of coverURLs) {
        if (currentCovers.get(id) !== coverBlobs.get(id)) {
            retiredURLs.push(url); coverURLs.delete(id); coverBlobs.delete(id);
            cardStates.delete(bookCards.get(id));
        }
    }
    let arrival = 0;
    let next = grid.firstChild;
    for (const book of visible) {
        let card = bookCards.get(book.id);
        if (!card) { card = createBookCard(); card.dataset.id = book.id; bookCards.set(book.id, card); }
        updateBookCard(card, book);
        if (!presentedBooks.has(book.id)) {
            card.classList.add('arriving');
            card.style.setProperty('--delay', `${Math.min(arrival++, 8) * 40}ms`);
            presentedBooks.add(book.id);
        }
        if (card !== next) {
            if (card.parentNode === grid) card.classList.remove('arriving');
            grid.insertBefore(card, next);
        }
        next = card.nextSibling;
    }
    grid.classList.toggle('currently-reading', filter === 'reading');
    listedBooks = visible;
    // Removed cards are detached and changed images have their new src before revocation.
    for (const url of retiredURLs) URL.revokeObjectURL(url);
    $('#library-count').textContent = visible.length === allBooks.length ? t(visible.length === 1 ? 'bookCountOne' : 'bookCountOther', { count: visible.length }) : t('countOf', { count: visible.length, total: allBooks.length });
    $('#clear-recent').hidden = filter !== 'recent';
    $('#clear-recent').disabled = importing || !visible.length;
    $('#empty').hidden = allBooks.length !== 0 || filter === 'reading';
    $('#no-results').hidden = (!allBooks.length && filter !== 'reading') || visible.length !== 0;
    localize($('#no-results h2'), filter === 'reading' && !query ? 'currentlyReading' : 'noResultsTitle');
    localize($('#no-results p'), filter === 'reading' && !query ? 'currentlyReadingEmpty' : 'noResultsText');
}
function createBookCard() {
    const card = el('div', 'card'), open = el('button', 'book-open');
    const track = el('span', 'progress-track');
    track.setAttribute('aria-hidden', 'true'); track.append(el('span'));
    const meta = el('span', 'book-meta');
    meta.append(el('span'), el('span', 'book-percent'));
    open.append(el('span', 'cover'), track, el('span', 'book-title'), el('span', 'book-author'), meta);
    const remove = el('button', 'delete');
    remove.append(icon('delete')); remove.dataset.delete = 'true';
    const change = el('button', 'delete category-change', '⋯');
    change.dataset.actions = 'true'; change.setAttribute('aria-haspopup', 'dialog');
    card.append(open, change, remove);
    return card;
}
function updateBookCard(card, book) {
    const cloudOnly = Boolean(cloud && book.cloudFile && !localFiles.has(book.id)
        && !(book.source.kind === 'fs' && roots.some(root => root.id === book.source.root)));
    const state = [book.title, book.author, book.ext, book.cover, book.fraction, book.finished,
        book.source.kind, cloudOnly, downloadingBooks.has(book.id), importing, lang];
    const previous = cardStates.get(card);
    if (previous && state.every((value, i) => value === previous[i])) return;
    const text = (node, value) => { if (node.textContent !== value) node.textContent = value; };
    const attr = (node, name, value) => { if (node.getAttribute(name) !== value) node.setAttribute(name, value); };
    const open = card.querySelector('.book-open'), cover = card.querySelector('.cover');
    attr(open, 'aria-label', t('openBook', { title: book.title }));
    attr(open, 'title', `${book.title}${book.author ? ` · ${book.author}` : ''}`);
    if (!previous || previous[3] !== book.cover || (!book.cover && state.slice(0, 3).some((value, i) => value !== previous[i]))) {
        if (book.cover) {
            if (!coverURLs.has(book.id)) {
                coverURLs.set(book.id, URL.createObjectURL(book.cover)); coverBlobs.set(book.id, book.cover);
            }
            const image = cover.querySelector('img') || el('img');
            if (image.src !== coverURLs.get(book.id)) image.src = coverURLs.get(book.id);
            attr(image, 'alt', ''); attr(image, 'loading', 'lazy'); attr(image, 'decoding', 'async');
            if (!image.parentNode) { cover.querySelector('.placeholder')?.remove(); cover.prepend(image); }
            if (cover.classList.contains('no-cover')) cover.classList.remove('no-cover');
        } else {
            cover.querySelector('img')?.remove();
            let hash = 0;
            for (const character of book.title) hash = (hash * 31 + character.charCodeAt(0)) | 0;
            if (!cover.classList.contains('no-cover')) cover.classList.add('no-cover');
            const color = `var(--cover-${Math.abs(hash) % 6})`;
            if (cover.style.getPropertyValue('--cover-color') !== color) cover.style.setProperty('--cover-color', color);
            let placeholder = cover.querySelector('.placeholder');
            if (!placeholder) {
                placeholder = el('span', 'placeholder');
                placeholder.append(el('span', 'placeholder-format'), el('span', 'placeholder-title'), el('span', 'placeholder-author'));
                cover.prepend(placeholder);
            }
            text(placeholder.children[0], book.ext.toUpperCase());
            text(placeholder.children[1], book.title);
            text(placeholder.children[2], book.author || 'Leeslamp');
        }
    }
    let badge = cover.querySelector('.cloud-badge');
    if (cloudOnly) {
        if (!badge) { badge = el('span', 'cloud-badge'); badge.setAttribute('role', 'img'); badge.append(icon('cloud')); cover.append(badge); }
        attr(badge, 'aria-label', t('cloudOnly'));
        badge.classList.toggle('downloading', downloadingBooks.has(book.id));
    } else badge?.remove();
    const fill = card.querySelector('.progress-track span'), fraction = String(clamp(book.fraction));
    if (fill.style.getPropertyValue('--fraction') !== fraction) fill.style.setProperty('--fraction', fraction);
    text(card.querySelector('.book-title'), book.title);
    text(card.querySelector('.book-author'), book.author);
    text(card.querySelector('.book-meta').firstChild, book.ext.toUpperCase());
    text(card.querySelector('.book-percent'), book.finished === true ? t('finishedLabel') : t('percentRead', { percent: Math.round(clamp(book.fraction) * 100) }));
    for (const [selector, key] of [['[data-delete]', book.source.kind === 'fs' ? 'hideBook' : 'deleteBook'], ['[data-actions]', 'bookActions']]) {
        const button = card.querySelector(selector), label = t(key, { title: book.title });
        attr(button, 'title', label); attr(button, 'aria-label', label);
        if (button.disabled !== importing) button.disabled = importing;
    }
    cardStates.set(card, state);
}
$('#grid').addEventListener('animationend', event => {
    const card = event.target.closest('.card');
    if (card && event.animationName === 'cover-in') card.classList.remove('arriving');
});
$('#reset-filters').addEventListener('click', () => {
    clearTimeout(searchTimer); filter = 'all'; query = ''; $('#search').value = '';
    renderLibrary(); $('#search').focus();
});
$('#filters').addEventListener('click', e => {
    const button = e.target.closest('[data-filter]');
    // Restore focus before changing the grid, so focus() cannot force its new layout.
    if (button) { filter = button.dataset.filter; setFiltersOpen(false); renderLibrary(); }
});
const mobileFilters = matchMedia('(max-width:760px)');
let filtersOpen = false, filterScroll = '', refreshPending = false;
function setFiltersOpen(open, fromHistory = false) {
    open = open && mobileFilters.matches;
    if (open === filtersOpen) return;
    filtersOpen = open;
    if (open) history.pushState({ ...history.state, leeslampFilters: true }, '');
    else if (!fromHistory && history.state?.leeslampFilters) history.back();
    $('#sidebar').classList.toggle('filters-open', open);
    $('#filters-toggle').setAttribute('aria-expanded', String(open));
    for (const attribute of ['role', 'aria-modal', 'aria-labelledby']) {
        if (open) $('#filters').setAttribute(attribute, { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'filters-heading' }[attribute]);
        else $('#filters').removeAttribute(attribute);
    }
    if (open) { filterScroll = document.body.style.overflow; document.body.style.overflow = 'hidden'; }
    else document.body.style.overflow = filterScroll;
    const main = $('#library main');
    if (!open) main.removeAttribute('aria-hidden');
    for (const node of [...$('#sidebar').children].filter(node => node.id !== 'filters')) node.inert = open;
    (open ? $('#filters-close') : mobileFilters.matches ? $('#filters-toggle') : $('#filters [aria-current]')).focus({ preventScroll: true });
    // Avoid inert's descendant work across the grid. Hide it from assistive technology
    // only after focus has left it; keyboard focus is contained by the handlers below.
    if (open) main.setAttribute('aria-hidden', 'true');
    main.style.pointerEvents = open ? 'none' : '';
    if (!open && refreshPending) { refreshPending = false; renderLibrary(); }
}
$('#filters-toggle').addEventListener('click', () => setFiltersOpen(!filtersOpen));
$('#filters-close').addEventListener('click', () => setFiltersOpen(false));
window.addEventListener('popstate', () => setFiltersOpen(false, true));
mobileFilters.addEventListener('change', () => setFiltersOpen(false));
document.addEventListener('focusin', event => {
    if (filtersOpen && !$('#filters').contains(event.target)) $('#filters-close').focus({ preventScroll: true });
});
document.addEventListener('keydown', event => {
    if (!filtersOpen) return;
    if (event.key === 'Escape') { event.preventDefault(); setFiltersOpen(false); }
    if (event.key === 'Tab') {
        const buttons = [...$('#filters').querySelectorAll('button')], first = buttons[0], last = buttons.at(-1);
        const outside = !$('#filters').contains(document.activeElement);
        if (event.shiftKey && (document.activeElement === first || outside)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || outside)) { event.preventDefault(); first.focus(); }
    }
});
$('#sort').addEventListener('change', renderLibrary);
$('#search').addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { query = $('#search').value.trim().toLocaleLowerCase('nl'); renderLibrary(); }, 100);
});
$('#grid').addEventListener('click', async e => {
    const card = e.target.closest('.card');
    if (!card) return;
    const record = books.find(b => b.id === card.dataset.id);
    if (!record) return;
    if (e.target.closest('[data-actions]')) {
        if (importing) return;
        const action = await chooseBookAction(record);
        if (!action || importing) return;
        if (action === 'cloudUpload') {
            try {
                const root = roots.find(root => root.id === record.source.root);
                let file = (await get('files', record.id))?.file;
                if (root && await readPermission(root.handle)) file = await resolveFile(root, record.source.path);
                if (!file) throw new Error(t('fileStorageMissing'));
                if (!file.size) throw new Error('empty file');
                await cloud.upload(record, file);
            } catch { toast(() => t('cloudFailed')); }
            return;
        }
        if (action !== 'category') {
            const changes = action === 'removeRecent' ? { opened: null }
                : action === 'markFinished' ? { finished: true }
                : { finished: false, fraction: 0, loc: null, opened: null };
            try {
                await put('books', { ...record, ...changes });
                Object.assign(record, changes); renderLibrary();
            } catch (error) { report(() => t('progressFailed'), error); }
            return;
        }
        const category = await chooseCategory(record.category, true);
        if (category === null) return;
        try {
            await put('books', { ...record, category, categoryManual: true });
            record.category = category; record.categoryManual = true; renderLibrary();
        } catch (error) { report(() => t('categoryFailed'), error); }
        return;
    }
    if (e.target.closest('[data-delete]')) {
        if (importing) return;
        const label = record.source.kind === 'fs'
            ? t('confirmHide', { title: record.title })
            : t('confirmDelete', { title: record.title });
        if (!confirm(label)) return;
        try {
            if (record.source.kind === 'fs') {
                await put('books', { ...record, hidden: true });
                record.hidden = true;
            } else {
                await bookTransaction(record, null, true);
                books = books.filter(b => b.id !== record.id);
            }
            presentedBooks.delete(record.id);
            renderLibrary();
        } catch (error) { report(() => t('deleteFailed'), error); }
    } else if (e.target.closest('.book-open')) await openBook(record);
});

function chooseBookAction(record) {
    const dialog = $('#book-actions');
    if (dialog.open) return Promise.resolve('');
    localize($('#book-actions-title'), 'bookActions', { title: record.title });
    localize($('#book-action-category'), 'changeCategory', { title: record.title });
    $('#book-action-upload').hidden = !(cloud?.signedIn && record.source.kind === 'fs' && !record.cloudFile && !record.fileSynced);
    const finished = record.finished === true;
    const recentButton = $('#book-actions [value="removeRecent"]');
    if (recentButton) recentButton.hidden = !record.opened;
    const toggle = $('#book-action-finished');
    toggle.value = finished ? 'markUnread' : 'markFinished';
    localize(toggle, toggle.value);
    dialog.returnValue = '';
    return new Promise(resolve => {
        dialog.addEventListener('close', () => resolve(dialog.returnValue), { once: true });
        dialog.showModal();
    });
}
$('#clear-recent').addEventListener('click', async () => {
    if (filter !== 'recent' || importing || !listedBooks.length) return;
    const records = [...listedBooks];
    if (!confirm(t('confirmClearRecent'))) return;
    $('#clear-recent').disabled = true;
    try {
        await writeBookBatch(records.map(record => ({ ...record, opened: null })));
        for (const record of records) record.opened = null;
    } catch (error) { report(() => t('progressFailed'), error); }
    renderLibrary();
});

// Lazy format helpers and sequential import.
const scripts = new Map();
function loadScript(src) {
    if (!scripts.has(src)) scripts.set(src, new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = () => { script.remove(); scripts.delete(src); reject(new Error(t('downloadFailed'))); };
        document.head.append(script);
    }));
    return scripts.get(src);
}
let pdfModule;
async function loadPDF() {
    pdfModule ??= import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs')
        .then(module => {
            module.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
            return module;
        }).catch(error => { pdfModule = null; throw error; });
    return pdfModule;
}
const kindFor = ext => ['epub', 'mobi', 'azw', 'azw3', 'prc', 'fb2', 'fbz', 'cbz'].includes(ext) ? 'foliate'
    : ext === 'pdf' ? 'pdf' : ['txt', 'md', 'markdown', 'html', 'htm', 'docx'].includes(ext) ? 'text' : null;
const languageMap = value => typeof value === 'string' ? value : value ? String(Object.values(value)[0] ?? '') : '';
const oneContributor = value => typeof value === 'string' ? value : languageMap(value?.name);
const formatContributor = value => Array.isArray(value)
    ? new Intl.ListFormat('nl', { style: 'short', type: 'conjunction' }).format(value.map(oneContributor).filter(Boolean))
    : oneContributor(value);
const engineFile = (file, name) => new File([file], name.toLowerCase(), { type: file.type });
const canvasBlob = canvas => new Promise((resolve, reject) => canvas.toBlob(
    blob => blob ? resolve(blob) : reject(new Error(t('coverFailed'))), 'image/jpeg', .8));
async function downscaleCover(blob) {
    if (!blob) return null;
    let image, url;
    try {
        if (typeof createImageBitmap === 'function') {
            try { image = await createImageBitmap(blob); } catch { /* SVG covers may require Image. */ }
        }
        if (!image) {
            url = URL.createObjectURL(blob);
            image = new Image();
            image.src = url;
            await image.decode();
        }
        const height = Math.min(400, image.height || image.naturalHeight);
        const width = Math.max(1, Math.round((image.width || image.naturalWidth) * height / (image.height || image.naturalHeight)));
        const canvas = typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(width, height) : el('canvas');
        canvas.width = width; canvas.height = height;
        const context = canvas.getContext('2d');
        context.fillStyle = '#ffffff'; context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        return await (canvas.convertToBlob ? canvas.convertToBlob({ type: 'image/jpeg', quality: .8 }) : canvasBlob(canvas));
    } finally { image?.close?.(); if (url) URL.revokeObjectURL(url); }
}
async function importMetadata(file, kind) {
    if (kind === 'foliate') {
        const { makeBook } = await import('./vendor/foliate-js/view.js');
        const book = await makeBook(engineFile(file, file.name));
        try {
            let cover = null;
            try { cover = await downscaleCover(await book.getCover?.()); }
            catch (error) { console.warn('Cover skipped', error); }
            return { title: languageMap(book.metadata?.title), author: formatContributor(book.metadata?.author),
                subjects: collectSubjects(book.metadata, false), cover };
        } finally { book.destroy?.(); }
    }
    if (kind === 'pdf') {
        // PDF import also needs the lazy engine to extract metadata and a thumbnail.
        const pdfjs = await loadPDF();
        const task = pdfjs.getDocument({ data: await file.arrayBuffer(), isEvalSupported: false });
        try {
            const doc = await task.promise;
            const { info } = await doc.getMetadata().catch(() => ({ info: {} }));
            let cover = null;
            try {
                const page = await doc.getPage(1), initial = page.getViewport({ scale: 1 });
                const viewport = page.getViewport({ scale: 400 / initial.height });
                const canvas = el('canvas');
                canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
                await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
                cover = await downscaleCover(await canvasBlob(canvas));
                canvas.width = canvas.height = 0;
            } catch (error) { console.warn('PDF cover skipped', error); }
            return { title: typeof info.Title === 'string' ? info.Title : '', author: typeof info.Author === 'string' ? info.Author : '',
                subjects: collectSubjects({ info }, false), cover };
        } finally { await task.destroy(); }
    }
    return { title: '', author: '', subjects: [], cover: null };
}
const AUTO_CATEGORY = Symbol('auto');
function chooseCategory(current = '', change = false) {
    const dialog = $('#category-dialog'), select = $('#category-select'), input = $('#new-category');
    if (dialog.open) return Promise.resolve(null);
    const values = ['', ...categories().filter(Boolean)];
    select.replaceChildren(...values.map((value, index) => {
        const option = el('option', '', value);
        if (!value) localize(option, 'noCategory');
        option.value = String(index); return option;
    }), Object.assign(localize(el('option'), 'addCategory'), { value: 'new' }));
    if (!change) select.prepend(Object.assign(localize(el('option'), 'automatic'), { value: 'auto' }));
    select.value = change ? String(Math.max(0, values.indexOf(current))) : 'auto';
    input.value = ''; input.required = false; $('#new-category-field').hidden = true;
    localize($('#category-submit'), change ? 'save' : 'import');
    dialog.returnValue = '';
    return new Promise(resolve => {
        dialog.addEventListener('close', () => resolve(dialog.returnValue === 'save'
            ? select.value === 'auto' ? AUTO_CATEGORY : select.value === 'new' ? input.value.trim() : values[Number(select.value)] : null), { once: true });
        dialog.showModal();
    });
}
$('#category-select').addEventListener('change', e => {
    const creating = e.target.value === 'new';
    $('#new-category-field').hidden = !creating;
    $('#new-category').required = creating;
    if (creating) $('#new-category').focus();
});
$('#category-form').addEventListener('submit', e => {
    if (e.submitter?.value === 'cancel') return;
    if ($('#category-select').value === 'new' && !$('#new-category').value.trim()) {
        e.preventDefault(); $('#new-category').focus();
    }
});
const yieldUI = () => new Promise(resolve => setTimeout(resolve, 0));
// Revalidate inside the write transaction: no stale plan may delete a record.
const stableValue = value => Array.isArray(value) ? value.map(stableValue)
    : value && typeof value === 'object' && !(value instanceof Blob)
        ? Object.keys(value).sort().map(key => [key, stableValue(value[key])]) : value;
// Key order differs between a stored record and the in-memory rebuild, so compare a stable form.
const dedupeRevision = record => JSON.stringify(record && stableValue({ ...record,
    cover: record.cover ? [record.cover.size, record.cover.type] : null }));
async function applyDedupeBatch(expectedKeep, keep, drops) {
    if (!drops.length || drops.length > 24 || drops.some(record => record.id === keep.id)) throw new Error(t('dedupeUnsafe'));
    const expected = [expectedKeep, ...drops];
    const db = await database();
    await new Promise((resolve, reject) => {
        const transaction = db.transaction(['books', 'files'], 'readwrite');
        const store = transaction.objectStore('books'), files = transaction.objectStore('files');
        transaction.oncomplete = resolve;
        transaction.onerror = transaction.onabort = event => reject(event.target.error ?? transaction.error ?? new Error(t('dedupeUnsafe')));
        let pending = expected.length;
        for (const record of expected) {
            const request = store.get(record.id);
            request.onsuccess = () => {
                if (dedupeRevision(request.result) !== dedupeRevision(record)) { transaction.abort(); return; }
                if (--pending) return;
                const existingFile = files.get(keep.id);
                existingFile.onsuccess = () => {
                    // Retain a local ebook too, including when a linked root is unavailable.
                    let remaining = drops.length, saved = !!existingFile.result;
                    const commit = () => {
                        store.put(keep);
                        for (const drop of drops) {
                            if (drop.source?.kind === 'fs') store.put({ ...drop, hidden: true,
                                synced: drop.updated });
                            else { store.delete(drop.id); files.delete(drop.id); }
                        }
                    };
                    for (const drop of drops) {
                        const request = files.get(drop.id);
                        request.onsuccess = () => {
                            if (!saved && request.result?.file) {
                                files.put({ id: keep.id, file: request.result.file }); saved = true;
                            }
                            if (--remaining === 0) commit();
                        };
                    }
                };
            };
        }
    });
}
async function dedupeBooks() {
    if (importing) { toast(() => t('importBusy')); return; }
    const plan = planDedupe(books, roots);
    if (!plan.total) return;
    const dialog = $('#dedupe-dialog');
    if (dialog.open) return;
    if (filtersOpen) setFiltersOpen(false);
    dialog.returnValue = '';
    $('#dedupe-summary').textContent = t(plan.total === 1 ? 'dedupeConfirmOne' : 'dedupeConfirm', { count: plan.total });
    const confirmed = new Promise(resolve => dialog.addEventListener('close', () => resolve(dialog.returnValue === 'confirm'), { once: true }));
    dialog.showModal();
    if (!await confirmed || importing) return;
    setImporting(true);
    let count = 0;
    try {
        // Fail closed before the first write if sync changed the confirmed plan.
        const fresh = planDedupe(books, roots);
        if (dedupeRevision(fresh) !== dedupeRevision(plan)) throw new Error(t('dedupeUnsafe'));
        for (const group of plan.groups) {
            let expectedKeep = books.find(record => record.id === group.keep.id);
            const keep = { ...group.keep, ...group.merged,
                coverSynced: expectedKeep.cover === group.merged.cover ? expectedKeep.coverSynced : false };
            for (let i = 0; i < group.drop.length; i += 24) {
                const drops = group.drop.slice(i, i + 24).map(({ keepFile, ...record }) => record);
                keep.updated = Math.max(Date.now(), (expectedKeep.updated || 0) + 1);
                await applyDedupeBatch(expectedKeep, keep, drops);
                Object.assign(expectedKeep, keep);
                for (const drop of drops) {
                    // Cleanup promises to retain ALL Drive ebooks, including extra copies.
                    cloud?.remove(drop, { keepFile: true });
                    const existing = books.find(record => record.id === drop.id);
                    if (drop.source?.kind === 'fs') Object.assign(existing, { hidden: true, synced: drop.updated });
                    else { books = books.filter(record => record.id !== drop.id); localFiles.delete(drop.id); }
                    presentedBooks.delete(drop.id); count++;
                }
                if ((await get('files', keep.id))?.file) localFiles.add(keep.id);
                cloud?.changed(); renderLibrary(); await yieldUI();
            }
        }
        toast(() => t(count === 1 ? 'dedupeDoneOne' : 'dedupeDone', { count }));
    } catch (error) { report(() => t('dedupeUnsafe'), error); }
    finally { setImporting(false); dedupeCount = -1; renderLibrary(); }
}
for (const selector of ['#dedupe', '#dedupe-mobile']) $(selector).addEventListener('click', () => void dedupeBooks());
function setImporting(value) {
    importing = value;
    if (!value) dedupeCount = -1;
    for (const selector of ['#import-button', '#empty-import', '#find-books', '#link-folder', '#folder-import', '#rescan', '#dedupe', '#dedupe-mobile']) $(selector).disabled = value;
    for (const button of $('#grid').querySelectorAll('.delete')) {
        button.disabled = value;
        cardStates.delete(button.closest('.card'));
    }
    $('#clear-recent').disabled = value || !listedBooks.length;
    $('#rescan').hidden = !roots.some(root => root.linked);
}
const filenameTitle = name => name.replace(/\.[^.]+$/, '');
const canAutoCategory = record => record.category === '' && record.autoCategorized !== true && !record.categoryManual && !record.hidden;
let categorizeAvailable;
async function categoryRequest(body) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 22000);
    try {
        const response = await fetch('/api/categorize', { method: body ? 'POST' : 'HEAD', cache: 'no-store',
            signal: controller.signal, ...(body ? { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {}) });
        return body ? response.ok ? await response.json() : null : response.status === 200;
    } finally { clearTimeout(timer); }
}
function categoryPipeline() {
    const known = categories().filter(Boolean), created = new Set(), pending = [];
    const remember = category => {
        if (category && !known.some(value => sameCategory(value, category))) { known.push(category); created.add(category); }
    };
    const assign = (record, category) => {
        if (!category || !canAutoCategory(record)) return;
        record.category = known.find(value => sameCategory(value, category)) ?? category;
        record.autoCategorized = true; remember(record.category);
    };
    const flush = async () => {
        const batch = pending.splice(0);
        if (!batch.length) return;
        let result;
        try {
            categorizeAvailable ??= categoryRequest().catch(() => false);
            if (!await categorizeAvailable) return;
            const response = await categoryRequest({ books: batch.map(record => ({
                title: record.title.slice(0, 200), author: record.author.slice(0, 200),
                subjects: collectSubjects(record).slice(0, 100), categories: known.filter(x => x.length <= 200).slice(0, 100),
            })) });
            result = response?.categories;
            if (!Array.isArray(result) || result.length !== batch.length || result.some(x => typeof x !== 'string' || x.length > 200)) return;
        } catch { return; } // Optional network work never raises a toast.
        const assigned = [];
        batch.forEach((record, index) => {
            if (!canAutoCategory(record)) return;
            assign(record, normalizeCategory(result[index]));
            if (record.autoCategorized) assigned.push(record);
        });
        if (assigned.length) await writeBookBatch(assigned);
    };
    return { created, remember, flush,
        local(record) { if (canAutoCategory(record)) assign(record, autoCategory(record, known)); },
        async enqueue(record) {
            if (canAutoCategory(record)) pending.push(record);
            if (pending.length === 20) { await yieldUI(); await flush(); }
        },
    };
}
const categorySummary = pipeline => pipeline.created.size
    ? ` · ${t(pipeline.created.size === 1 ? 'newCategoriesOne' : 'newCategoriesOther', { count: pipeline.created.size })}` : '';
function newRecord(file, category, source, id = crypto.randomUUID()) {
    const ext = file.name.split('.').pop().toLowerCase();
    return { id, name: file.name, ext, kind: kindFor(ext), category, source,
        title: filenameTitle(file.name), author: '', cover: null, metadataReady: false,
        size: file.size, lastModified: file.lastModified, added: Date.now(), opened: null, fraction: 0, loc: null };
}
async function importFiles(files, categoryForFile) {
    if (importing) { toast(() => t('importBusy')); return; }
    if (!files.length) return;
    setImporting(true);
    if (!categoryForFile) {
        const category = await chooseCategory();
        if (category === null) { setImporting(false); return; }
        categoryForFile = () => category;
    }
    let count = 0, skipped = 0;
    let identities = createImportIndex(books), indexedCount = books.length;
    const failures = [];
    const pipeline = categoryPipeline();
    let lastRender = performance.now();
    for (const [index, file] of [...files].entries()) {
        toast(() => t('importProgress', { current: index + 1, total: files.length }), 0);
        const ext = file.name.split('.').pop().toLowerCase(), kind = kindFor(ext);
        if (!kind) { failures.push(() => t('unsupportedFile', { name: file.name })); continue; }
        // An empty file is never a book: iOS hands one back for documents that live only in iCloud.
        if (!file.size) { failures.push(() => t('emptyFile', { name: file.name })); continue; }
        try {
            const category = categoryForFile(file);
            const record = newRecord(file, category === AUTO_CATEGORY ? '' : category, { kind: 'blob' });
            if (indexedCount !== books.length) { identities = createImportIndex(books); indexedCount = books.length; }
            if (identities.has(record)) { skipped++; await yieldUI(); continue; }
            record.categoryManual = category !== AUTO_CATEGORY;
            try {
                const meta = await importMetadata(file, kind);
                Object.assign(record, meta, { title: meta.title.trim() || record.title, metadataReady: true });
            } catch (error) { console.warn(file.name, error); failures.push(() => t('metadataSkipped', { name: file.name })); }
            // Metadata parsing yields to sync; recheck the current visible library.
            identities = createImportIndex(books);
            if (identities.has(record)) { skipped++; await yieldUI(); continue; }
            pipeline.local(record);
            await bookTransaction(record, file);
            books.push(record);
            identities.add(record); indexedCount = books.length;
            count++;
            pipeline.remember(record.category);
            await pipeline.enqueue(record);
        } catch (error) { console.error(error); failures.push(() => failureMessage(() => t('importFailedFile', { name: file.name }), error)); }
        if (performance.now() - lastRender >= 500) { renderLibrary(); lastRender = performance.now(); }
        await yieldUI();
    }
    try { await pipeline.flush(); }
    catch (error) { report(() => t('categoryFailed'), error); }
    setImporting(false);
    renderLibrary();
    toast(() => [t(count === 1 ? 'addedOne' : 'addedOther', { count }) + categorySummary(pipeline),
        ...(skipped ? [t(skipped === 1 ? 'importSkippedOne' : 'importSkipped', { count: skipped })] : []),
        ...failures.map(message => message())].join('\n'), failures.length ? 12000 : 4000);
}

// File handles are stored once per root. Neither enumeration nor scanning stores ebook blobs.
async function readPermission(handle) {
    if (await handle.queryPermission({ mode: 'read' }) === 'granted') return true;
    return await handle.requestPermission({ mode: 'read' }) === 'granted';
}
async function resolveFile(root, path) {
    const parts = path.split('/');
    let directory = root.handle;
    for (const part of parts.slice(0, -1)) directory = await directory.getDirectoryHandle(part);
    return (await directory.getFileHandle(parts.at(-1))).getFile();
}
async function enumerate(directory, entries, prefix = '', category = '') {
    let visited = 0;
    for await (const [name, handle] of directory.entries()) {
        const path = prefix + name;
        if (handle.kind === 'directory') await enumerate(handle, entries, `${path}/`, prefix ? category : name);
        else if (kindFor(name.split('.').pop().toLowerCase())) entries.push({ path, category, handle });
        if (++visited % 50 === 0) await yieldUI();
    }
}
const writeBookBatch = async (records, removed = []) => {
    for (const record of records) record.updated = Date.now();
    await tx('books', 'readwrite', store => {
        for (const record of records) store.put(record);
        for (const record of removed) store.delete(record.id);
    });
    for (const record of removed) cloud?.remove(record);
    cloud?.changed();
};
async function scanRoots(selected) {
    const work = [], failures = [];
    let found = 0, added = 0, lastRender = 0;
    const refresh = (force = false) => {
        if (force || performance.now() - lastRender >= 500) { renderLibrary(); lastRender = performance.now(); }
    };
    for (const root of selected) {
        toast(() => t('scanFolder', { name: root.name }), 0);
        const entries = [];
        try { await enumerate(root.handle, entries); }
        catch (error) {
            console.warn(root.name, error); failures.push(() => t('folderIncomplete', { name: root.name })); continue;
        }
        found += entries.length;
        const existing = new Map(books.filter(b => b.source.kind === 'fs' && b.source.root === root.id).map(b => [b.id, b]));
        const seen = new Set(entries.map(entry => `fs:${root.id}:${entry.path}`));
        // Publish filename records before doing any metadata parsing. Commit at most ten at a time.
        let batch = [];
        const commit = async () => {
            await writeBookBatch(batch);
            for (const record of batch) if (!existing.has(record.id)) books.push(record);
            batch = []; refresh(); await yieldUI();
        };
        for (const entry of entries) {
            const id = `fs:${root.id}:${entry.path}`;
            let record = existing.get(id);
            if (!record) {
                record = newRecord({ name: entry.path.split('/').at(-1) }, entry.category,
                    { kind: 'fs', root: root.id, path: entry.path }, id);
                added++; batch.push(record);
            }
            work.push({ ...entry, record });
            if (batch.length === 10) await commit();
        }
        if (batch.length) await commit();
        const missing = [...existing.values()].filter(record => !seen.has(record.id));
        // Never prune on an incomplete enumeration. Close an open missing book before deleting its progress.
        if (missing.some(record => record.id === active?.record.id)) await closeBook();
        for (let i = 0; i < missing.length; i += 10) await writeBookBatch([], missing.slice(i, i + 10));
        const missingIds = new Set(missing.map(record => record.id));
        books = books.filter(record => !missingIds.has(record.id));
        for (const id of missingIds) presentedBooks.delete(id);
        refresh();
    }
    refresh(true);
    let batch = [], completed = 0;
    const pipeline = categoryPipeline();
    for (const { handle, record, category: folderCategory } of work) {
        toast(() => t('scanProgress', { current: completed, total: found }), 0);
        try {
            const file = await handle.getFile();
            if (!record.metadataReady || record.size !== file.size || record.lastModified !== file.lastModified
                || (!folderCategory && canAutoCategory(record) && !Array.isArray(record.subjects))) {
                // Failed work stays pending; an interrupted write retains the old size/mtime or pending record.
                record.metadataReady = false;
                record.size = file.size; record.lastModified = file.lastModified;
                const meta = await importMetadata(file, record.kind);
                Object.assign(record, meta, { title: meta.title.trim() || filenameTitle(record.name), metadataReady: true });
                batch.push(record);
            }
            if (!folderCategory && canAutoCategory(record)) {
                pipeline.local(record);
                if (record.autoCategorized) batch.push(record);
            }
        } catch (error) {
            console.warn(record.name, error); failures.push(() => t('metadataMissing', { name: record.name }));
            batch.push(record);
        }
        completed++;
        if (completed % 10 === 0 || completed === work.length) {
            if (batch.length) await writeBookBatch(batch);
            batch = [];
        }
        if (!folderCategory) await pipeline.enqueue(record);
        toast(() => t('scanProgress', { current: completed, total: found }), 0);
        refresh(); await yieldUI();
    }
    await pipeline.flush();
    refresh(true);
    toast(() => [t('scanResult', { found, added }) + categorySummary(pipeline), ...failures.map(message => message())].join('\n'), failures.length ? 12000 : 4000);
    return { found, added, failures: failures.map(message => message()) };
}
async function linkFolder(handle) {
    if (importing || $('#category-dialog').open) throw new Error(t('importRunning'));
    if (handle?.kind !== 'directory') throw new Error(t('selectFolder'));
    setImporting(true);
    try {
        if (!await readPermission(handle)) throw new Error(t('folderAccess'));
        let root;
        for (const candidate of roots) {
            if (await handle.isSameEntry(candidate.handle)) { root = candidate; break; }
        }
        if (!root) {
            root = { id: crypto.randomUUID(), name: handle.name, handle, linked: true };
            await put('roots', root); roots.push(root);
        }
        return await scanRoots([root]);
    } finally { setImporting(false); }
}
async function rescan() {
    if (importing || $('#category-dialog').open) throw new Error(t('importRunning'));
    setImporting(true);
    try {
        // Start all permission checks within the button's user gesture, before enumeration.
        const permissions = await Promise.all(roots.filter(root => root.linked).map(async root => {
            try { return { root, allowed: await readPermission(root.handle) }; }
            catch { return { root, allowed: false }; }
        }));
        const denied = permissions.filter(item => !item.allowed);
        const result = await scanRoots(permissions.filter(item => item.allowed).map(item => item.root));
        if (denied.length) toast(() => t('scanDenied', { found: result.found, added: result.added, names: denied.map(item => item.root.name).join(', ') }), 12000);
        return result;
    } finally { setImporting(false); }
}
const mobileImport = matchMedia('(max-width: 760px)');
function updateImportControls() {
    const hasDirectoryPicker = typeof window.showDirectoryPicker === 'function';
    $('#find-books').hidden = !mobileImport.matches && hasDirectoryPicker;
    $('#link-folder').hidden = mobileImport.matches || !hasDirectoryPicker;
    $('#folder-import').hidden = (!mobileImport.matches && hasDirectoryPicker) || !('webkitdirectory' in $('#folder-input'));
}
mobileImport.addEventListener('change', updateImportControls);
updateImportControls();
$('#link-folder').addEventListener('click', async () => {
    try { await linkFolder(await window.showDirectoryPicker({ mode: 'read' })); }
    catch (error) { if (error.name !== 'AbortError') report(() => t('linkFailed'), error); }
});
$('#rescan').addEventListener('click', () => rescan().catch(error => report(() => t('scanFailed'), error)));
$('#folder-import').addEventListener('click', () => $('#folder-input').click());
$('#folder-input').addEventListener('change', e => {
    const files = [...e.target.files].filter(file => kindFor(file.name.split('.').pop().toLowerCase())); e.target.value = '';
    // webkitRelativePath includes the selected root name; categories start just below that root.
    void importFiles(files, file => {
        const parts = file.webkitRelativePath.split('/'); return parts.length > 2 ? parts[1] : AUTO_CATEGORY;
    });
});
let findBooksImport = false;
for (const id of ['#import-button', '#empty-import', '#find-books']) $(id).addEventListener('click', () => {
    findBooksImport = id === '#find-books'; $('#file-input').click();
});
$('#file-input').addEventListener('cancel', () => { findBooksImport = false; });
$('#file-input').addEventListener('change', e => {
    const files = [...e.target.files], automatic = findBooksImport;
    e.target.value = ''; findBooksImport = false;
    void importFiles(files, automatic ? () => AUTO_CATEGORY : undefined);
});
let dragDepth = 0;
$('#library').addEventListener('dragenter', e => {
    if (!e.dataTransfer.types.includes('Files')) return;
    e.preventDefault(); dragDepth++; $('#library').classList.add('dragging');
});
$('#library').addEventListener('dragover', e => {
    if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }
});
$('#library').addEventListener('dragleave', () => {
    if (--dragDepth <= 0) { dragDepth = 0; $('#library').classList.remove('dragging'); }
});
$('#library').addEventListener('drop', async e => {
    e.preventDefault(); dragDepth = 0; $('#library').classList.remove('dragging');
    const files = [...e.dataTransfer.files];
    // Capture promises synchronously: the drag data store expires after this event dispatch.
    const pending = [...e.dataTransfer.items].filter(item => item.kind === 'file').map(item => item.getAsFileSystemHandle?.());
    try {
        const handles = await Promise.all(pending);
        if (handles.some(handle => handle?.kind === 'directory')) {
            for (const handle of handles) if (handle?.kind === 'directory') await linkFolder(handle);
            const loose = await Promise.all(handles.filter(handle => handle?.kind === 'file').map(handle => handle.getFile()));
            if (loose.length) await importFiles(loose);
        } else await importFiles(files);
    } catch (error) { report(() => t('addFailed'), error); }
});

// One reader session owns every timer, observer, frame, listener and render task.
let active = null, closing = null;
const live = session => active === session && !session.controller.signal.aborted;
const listen = (session, node, type, handler, options = {}) => node.addEventListener(type, handler,
    { ...options, signal: session.controller.signal });
function frame(session, callback) {
    const id = requestAnimationFrame(() => { session.frames.delete(id); if (live(session)) callback(); });
    session.frames.add(id);
    return id;
}
function saveProgress(session, final = false) {
    clearTimeout(session.saveTimer);
    if (session.deleted) return session.writes;
    if (!session.dirty && !final) return session.writes;
    const remaining = 1000 - (Date.now() - session.lastSave);
    if (!final && remaining > 0) {
        session.saveTimer = setTimeout(() => { if (live(session)) saveProgress(session); }, remaining);
        return session.writes;
    }
    session.lastSave = Date.now();
    session.dirty = false;
    session.writes = session.writes.then(() => tx('books', 'readwrite', store => {
        const request = store.get(session.record.id);
        request.onsuccess = () => {
            const current = request.result || session.record;
            if (cloud && !request.result) return;
            session.record.updated = Date.now();
            store.put({ ...current, updated: session.record.updated, fraction: session.record.fraction, loc: session.record.loc, opened: session.record.opened, finished: session.record.finished });
        };
        return request;
    })).then(() => cloud?.changed()).catch(error => {
        session.dirty = true;
        report(() => t('progressFailed'), error);
    });
    return session.writes;
}
function progress(session, fraction, loc, label) {
    if (!live(session) || !session.ready) return;
    session.record.fraction = clamp(fraction);
    session.record.loc = loc;
    session.record.opened = Date.now();
    session.dirty = true;
    $('#slider').value = session.record.fraction;
    $('#slider-fill').style.setProperty('--fraction', session.record.fraction);
    session.progressLabel = label;
    updateProgressLabel(session);
    saveProgress(session);
}
function hideBars(hidden) {
    $('#reader').classList.toggle('bars-hidden', hidden);
    $('#top-bar').inert = $('#bottom-bar').inert = hidden;
}
function showBars() {
    if (!active) return;
    hideBars(false);
    clearTimeout(active.barTimer);
    active.barTimer = setTimeout(() => {
        if ($('#prefs').hidden && $('#toc').hidden && $('#lookup-panel').hidden && !$('#reader').querySelector('.reader-bar :focus-visible')) hideBars(true);
    }, 2500);
}
function closePanels() {
    const focusedPanel = document.activeElement?.closest('.popover');
    closeLookup();
    $('#prefs').hidden = $('#toc').hidden = true;
    $('#aa').setAttribute('aria-expanded', 'false');
    $('#toc-button').setAttribute('aria-expanded', 'false');
    if (focusedPanel && active) $(focusedPanel.id === 'prefs' ? '#aa' : focusedPanel.id === 'lookup-panel' ? '#reader' : '#toc-button').focus({ preventScroll: true });
}
let selectedPassage = '', selectionDoc, lookupGeneration = 0, askGeneration = 0;
function closeLookup() {
    lookupGeneration++; askGeneration++;
    cancelLookup(); cancelAsk();
    $('#lookup-button').hidden = $('#lookup-panel').hidden = true;
    $('#lookup-button').setAttribute('aria-expanded', 'false');
    if ($('#ask-dialog').open) $('#ask-dialog').close();
    selectionDoc?.getSelection()?.removeAllRanges();
    selectedPassage = ''; selectionDoc = null;
}
function hookSelection(session, doc, root = doc.body) {
    const changed = () => {
        if (!live(session) || !$('#lookup-panel').hidden) return;
        const selection = doc.getSelection();
        if (!selection?.rangeCount || selection.isCollapsed || !root.contains(selection.anchorNode) || !root.contains(selection.focusNode)
            || !buildQueries(selection.toString(), lang)) {
            if (selectionDoc === doc) { $('#lookup-button').hidden = true; selectedPassage = ''; }
            return;
        }
        selectedPassage = selection.toString().trim(); selectionDoc = doc;
        const range = selection.getRangeAt(0).cloneRange();
        range.collapse(false);
        const rects = [...selection.getRangeAt(0).getClientRects()];
        const caret = range.getBoundingClientRect();
        const rect = caret.height ? caret : rects.at(-1);
        if (!rect) return;
        let x = rect.right, y = rect.bottom;
        // Foliate iframe coordinates are local, including fixed-layout scaling.
        for (let win = doc.defaultView; win && win !== window; win = win.parent) {
            const iframe = win.frameElement;
            if (!iframe) return;
            const box = iframe.getBoundingClientRect();
            x = box.left + x * box.width / (iframe.clientWidth || box.width);
            y = box.top + y * box.height / (iframe.clientHeight || box.height);
        }
        const button = $('#lookup-button'); button.hidden = false;
        const css = getComputedStyle(button), safe = side => parseFloat(css.getPropertyValue('--safe-' + side)) || 0;
        const viewport = window.visualViewport;
        const left = (viewport?.offsetLeft || 0) + safe('left') + 8;
        const right = (viewport?.offsetLeft || 0) + (viewport?.width || innerWidth) - safe('right') - 8;
        const top = Math.max((viewport?.offsetTop || 0) + safe('top') + 8, $('#top-bar').offsetHeight + 8);
        const bottom = Math.min((viewport?.offsetTop || 0) + (viewport?.height || innerHeight) - safe('bottom') - 8, innerHeight - $('#bottom-bar').offsetHeight - 8);
        if (bottom - top < button.offsetHeight || right - left < button.offsetWidth) { button.hidden = true; return; }
        button.style.left = Math.max(left, Math.min(x, right - button.offsetWidth)) + 'px';
        button.style.top = Math.max(top, Math.min(y + 8, bottom - button.offsetHeight)) + 'px';
    };
    listen(session, doc, 'selectionchange', changed);
    listen(session, doc, 'pointerup', changed);
    listen(session, doc, 'keyup', changed);
    listen(session, doc, 'scroll', closeLookup, { passive: true });
}
function updateAskButton() {
    const configured = !!readSetting('leeslamp.ask.key', '');
    localize($('#ask-explain'), configured ? 'askExplain' : 'askSetup');
    $('#ask-settings').hidden = !configured;
}
function setupLookup(session) {
    listen(session, $('#lookup-button'), 'pointerdown', event => event.preventDefault());
    listen(session, $('#lookup-button'), 'click', async () => {
        const passage = selectedPassage, doc = selectionDoc;
        const queries = buildQueries(passage, lang);
        if (!queries) return;
        closePanels(); selectedPassage = passage; selectionDoc = doc;
        const generation = ++lookupGeneration;
        $('#lookup-term').textContent = queries.term;
        $('#lookup-panel').hidden = false;
        $('#lookup-button').setAttribute('aria-expanded', 'true');
        $('#ask-answer').textContent = ''; $('#ask-status').replaceChildren(); $('#ask-question').value = '';
        updateAskButton();
        $('#lookup-result').replaceChildren(localize(el('p', 'lookup-loading'), 'lookupLoading'));
        $('#lookup-panel').focus({ preventScroll: true }); showBars();
        try {
            const result = await lookup(passage, lang);
            if (!live(session) || generation !== lookupGeneration) return;
            if (!result) { $('#lookup-result').replaceChildren(localize(el('p'), 'lookupEmpty', { term: queries.term })); return; }
            const nodes = [el('h3', '', result.title)];
            if (result.description) nodes.push(el('p', '', result.description));
            nodes.push(el('p', '', result.text));
            const link = localize(el('a'), result.kind === 'wikipedia' ? 'lookupWikipedia' : 'lookupWiktionary');
            link.href = result.url; link.target = '_blank'; link.rel = 'noopener'; nodes.push(link);
            $('#lookup-result').replaceChildren(...nodes);
        } catch {
            if (live(session) && generation === lookupGeneration) $('#lookup-result').replaceChildren(localize(el('p'), 'lookupNetwork'));
        }
    });
    listen(session, window, 'resize', closeLookup);
    if (window.visualViewport) { listen(session, window.visualViewport, 'resize', () => { $('#lookup-button').hidden = true; }); }
    setupAsk(session);
    session.cleanups.push(closeLookup);
}
function askConfig() {
    const stored = readSetting('leeslamp.ask.provider', 'deepseek');
    const [id, adapter] = stored.split(':');
    const entry = PROVIDERS.find(provider => provider.id === id) || PROVIDERS[0];
    return { provider: entry.id === 'custom' ? { ...entry, adapter: adapter === 'anthropic' ? 'anthropic' : 'openai', baseUrl: readSetting('leeslamp.ask.baseUrl', '') } : entry,
        model: readSetting('leeslamp.ask.model', entry.models[0]?.id || ''), key: readSetting('leeslamp.ask.key', '') };
}
function setupAsk(session) {
    let original;
    const providerField = $('#ask-provider');
    providerField.replaceChildren(...PROVIDERS.map(provider => {
        const option = el('option'); option.value = provider.id;
        if (provider.id === 'custom') localize(option, provider.label); else option.textContent = provider.label;
        return option;
    }));
    const price = () => {
        const provider = PROVIDERS.find(p => p.id === providerField.value);
        const model = provider.models.find(m => m.id === $('#ask-model').value);
        const node = $('#ask-price'); node.removeAttribute('data-i18n'); node.textContent = '';
        if (model?.free) localize(node, 'askFree');
        else if (model?.price) localize(node, 'askPrice', { price: ((model.price[0] + model.price[1]) * 500 / 1e6).toFixed(4) });
        else if (model?.cheapest) localize(node, 'askCheapest');
    };
    const fields = () => {
        const provider = PROVIDERS.find(p => p.id === providerField.value), custom = provider.id === 'custom';
        $('#ask-custom').hidden = custom === false;
        $('#ask-model').hidden = custom;
        document.querySelector('label[for="ask-model"]').hidden = custom;
        $('#ask-model').replaceChildren(...provider.models.map(model => Object.assign(el('option', '', model.id), { value: model.id })));
        $('#ask-key-page').hidden = !provider.keyHint;
        if (provider.keyHint) $('#ask-key-page').href = provider.keyHint; else $('#ask-key-page').removeAttribute('href');
        price();
    };
    const open = () => {
        original = askConfig();
        providerField.value = original.provider.id; fields();
        $('#ask-model').value = original.model;
        $('#ask-custom-model').value = original.provider.id === 'custom' ? original.model : '';
        $('#ask-base-url').value = original.provider.id === 'custom' ? original.provider.baseUrl : '';
        $('#ask-adapter').value = original.provider.adapter;
        $('#ask-key').value = '';
        $('#ask-stored-key').replaceChildren();
        if (original.key) $('#ask-stored-key').append(localize(el('span'), 'askStoredKey', { last: original.key.slice(-4) }));
        $('#ask-remove').hidden = !original.key;
        $('#ask-settings-error').replaceChildren(); price();
        $('#ask-dialog').showModal();
    };
    listen(session, providerField, 'change', () => { fields(); $('#ask-key').value = ''; });
    listen(session, $('#ask-model'), 'change', price);
    listen(session, $('#ask-settings'), 'click', open);
    listen(session, $('#ask-cancel'), 'click', () => $('#ask-dialog').close());
    listen(session, $('#ask-dialog'), 'close', () => { $('#ask-key').value = ''; original = null; });
    listen(session, $('#ask-dialog'), 'keydown', event => event.stopPropagation());
    listen(session, $('#ask-remove'), 'click', () => {
        cancelAsk(); askGeneration++;
        $('#ask-status').replaceChildren();
        try {
            localStorage.removeItem('leeslamp.ask.key');
            original.key = ''; $('#ask-key').value = ''; $('#ask-stored-key').replaceChildren(); $('#ask-remove').hidden = true;
            updateAskButton();
        } catch { $('#ask-settings-error').replaceChildren(localize(el('span'), 'askStorage')); }
    });
    listen(session, $('#ask-settings-form'), 'submit', event => {
        event.preventDefault();
        const entry = PROVIDERS.find(p => p.id === providerField.value);
        const provider = entry.id === 'custom' ? { ...entry, adapter: $('#ask-adapter').value, baseUrl: $('#ask-base-url').value.trim() } : entry;
        const model = entry.id === 'custom' ? $('#ask-custom-model').value.trim() : $('#ask-model').value;
        // Never reuse a stored secret after the destination or adapter changes.
        const sameDestination = original && original.provider.id === provider.id && original.provider.baseUrl === provider.baseUrl && original.provider.adapter === provider.adapter;
        const key = $('#ask-key').value.trim() || (sameDestination ? original.key : '');
        if (!key) { $('#ask-settings-error').replaceChildren(localize(el('span'), 'askEnterKey')); return; }
        try { buildRequest(provider, { passage: '', question: '', model, key, language: lang }); }
        catch (error) { $('#ask-settings-error').replaceChildren(localize(el('span'), error.key || 'askNoAnswer')); return; }
        try {
            // Clear first: an interrupted settings write cannot send the old key to a new host.
            localStorage.removeItem('leeslamp.ask.key');
            localStorage.setItem('leeslamp.ask.provider', provider.id === 'custom' ? `custom:${provider.adapter}` : provider.id);
            localStorage.setItem('leeslamp.ask.model', model);
            localStorage.setItem('leeslamp.ask.baseUrl', provider.baseUrl);
            localStorage.setItem('leeslamp.ask.key', key);
            cancelAsk(); askGeneration++; $('#ask-status').replaceChildren(); updateAskButton(); $('#ask-dialog').close();
        } catch { $('#ask-settings-error').replaceChildren(localize(el('span'), 'askStorage')); }
    });
    listen(session, $('#ask-form'), 'submit', async event => {
        event.preventDefault();
        const config = askConfig();
        if (!config.key) { open(); return; }
        const generation = ++askGeneration;
        $('#ask-answer').textContent = '';
        $('#ask-status').replaceChildren(localize(el('span', 'lookup-loading'), 'askLoading'));
        const current = () => live(session) && generation === askGeneration && !$('#lookup-panel').hidden;
        const chapter = session.chapter || [...(session.article?.querySelectorAll('h1,h2,h3') || [])].filter(h => h.getBoundingClientRect().top <= 80).at(-1)?.textContent;
        try {
            await ask({ ...config, passage: selectedPassage, question: $('#ask-question').value.trim() || t('askDefault'),
                book: { title: session.record.title, author: session.record.author }, chapter, language: lang, signal: session.controller.signal,
                onText: text => { if (current()) { $('#ask-status').replaceChildren(); $('#ask-answer').append(document.createTextNode(text)); } } });
            if (current()) $('#ask-status').replaceChildren();
        } catch (error) {
            if (current() && error.name !== 'AbortError') {
                $('#ask-answer').textContent = '';
                $('#ask-status').replaceChildren(localize(el('span'), error.key || 'askNetwork'));
            }
        }
    });
}
function contentClick(event) {
    const doc = event.target.ownerDocument;
    if (event.target.closest('a,button,input,select,textarea,[contenteditable]') || !doc.getSelection()?.isCollapsed) return;
    if (!$('#prefs').hidden || !$('#toc').hidden || !$('#lookup-panel').hidden) { closePanels(); showBars(); return; }
    if ($('#reader').classList.contains('bars-hidden')) showBars();
    else { clearTimeout(active?.barTimer); hideBars(true); }
}
function keydown(event) {
    if (!active || event.defaultPrevented) return;
    // Tab can always reach reader controls, even when pointer chrome is hidden.
    if (event.key === 'Tab') showBars();
    if (event.key === 'Escape') {
        event.preventDefault();
        if (!$('#toc').hidden || !$('#prefs').hidden || !$('#lookup-panel').hidden || !$('#lookup-button').hidden) { closePanels(); showBars(); }
        else void closeBook();
        return;
    }
    if (active.record.kind !== 'foliate' || !active.ready || event.altKey || event.ctrlKey || event.metaKey
        || event.target.closest('input,select,textarea,button,[contenteditable],[role="treeitem"]')) return;
    if (['ArrowLeft', 'PageUp', 'ArrowRight', 'PageDown', ' '].includes(event.key)) {
        event.preventDefault();
        turn(['ArrowLeft', 'PageUp'].includes(event.key) ? -1 : 1);
    }
}
function setTOC(session, items, select) {
    if (!live(session) || !items?.length) return;
    session.toc = createTOCView(items, href => {
        Promise.resolve(select(href)).catch(error => report(() => t('locationFailed'), error));
        closePanels(); showBars();
    });
    // Mark only app-generated fallback labels; book headings remain original content.
    const labels = [];
    const collect = entries => { for (const item of entries) { labels.push(item); if (item.subitems) collect(item.subitems); } };
    collect(items);
    session.toc.element.querySelectorAll('[role="treeitem"]').forEach((node, index) => {
        if (!labels[index].i18n) return;
        const label = localize(el('span'), labels[index].i18n);
        for (const child of [...node.childNodes]) if (child.nodeType === Node.TEXT_NODE) child.remove();
        node.append(label);
    });
    $('#toc-list').replaceChildren(session.toc.element);
    $('#toc-button').hidden = false;
    session.toc.element.querySelector('[role="treeitem"]')?.setAttribute('tabindex', '0');
}
async function openBook(record) {
    if (active) return;
    if (closing) await closing;
    if (active) return;
    const session = { record, controller: new AbortController(), frames: new Set(), cleanups: [],
        writes: Promise.resolve(), lastSave: 0, dirty: false, ready: false, urls: new Set(),
        wheelDelta: 0, wheelLock: false, wheelResetTimer: null, wheelLockTimer: null };
    active = session;
    $('#library').hidden = true; $('#reader').hidden = false;
    $('#r-title').textContent = record.title;
    updateTitle();
    $('#toc-button').hidden = true;
    $('#ticks').replaceChildren(); $('#toc-list').replaceChildren();
    $('#slider').value = record.fraction;
    $('#slider-fill').style.setProperty('--fraction', clamp(record.fraction));
    $('#progress-label').textContent = t('percent', { percent: Math.round(record.fraction * 100) });
    $('#r-body').replaceChildren(Object.assign(localize(el('div'), 'opening'), { id: 'loading' }));
    $('#slider').disabled = $('#prev').disabled = $('#next').disabled = true;
    applyPreferences(); showBars();
    $('#reader').focus({ preventScroll: true });
    setupLookup(session);
    listen(session, document, 'keydown', keydown);
    listen(session, $('#reader'), 'focusin', showBars);
    listen(session, $('#reader'), 'pointermove', showBars, { passive: true });
    listen(session, document, 'pointerdown', e => {
        if (!e.target.closest('#prefs,#aa,#toc,#toc-button,#lookup-button,#lookup-panel,#ask-dialog')) closePanels();
    });
    listen(session, document, 'visibilitychange', () => {
        if (document.hidden) { session.capture?.(); void saveProgress(session, true); }
    });
    listen(session, window, 'pagehide', () => { session.capture?.(); void saveProgress(session, true); });
    let resolvingFile = true;
    try {
        let file;
        if (cloud) {
            const root = record.source.kind === 'fs' && roots.find(root => root.id === record.source.root);
            if (root) {
                try { if (await readPermission(root.handle)) file = await resolveFile(root, record.source.path); }
                catch { /* A cached or cloud copy can still be available. */ }
            }
            file ||= (await get('files', record.id))?.file;
            if (!file && cloud.signedIn && record.cloudFile) {
                downloading(record.id, 1);
                try {
                    const loading = $('#loading');
                    // A book-shaped reservoir, clipped both to its cover and the liquid surface.
                    loading.removeAttribute('data-i18n'); loading.className = 'downloading download-indeterminate';
                    loading.replaceChildren(localize(el('span'), 'downloading'));
                    const vessel = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    vessel.setAttribute('class', 'download-vessel'); vessel.setAttribute('viewBox', '0 0 80 112'); vessel.setAttribute('aria-hidden', 'true');
                    vessel.innerHTML = `<defs>
                        <clipPath id="download-book"><rect x="13" y="6" width="54" height="100" rx="2"/></clipPath>
                        <clipPath id="download-surface"><rect class="download-level" x="0" y="6" width="80" height="100"/></clipPath>
                        <linearGradient id="download-fade" x2="0" y2="1"><stop stop-color="white" stop-opacity="0"/><stop offset=".12" stop-color="white"/></linearGradient>
                        <mask id="download-bubbles" maskUnits="userSpaceOnUse" x="0" y="0" width="80" height="112"><rect class="download-level" x="0" y="6" width="80" height="100" fill="url(#download-fade)"/></mask>
                    </defs>
                    <rect x="13" y="6" width="54" height="100" rx="2" fill="var(--side)"/>
                    <g clip-path="url(#download-book)"><g clip-path="url(#download-surface)">
                        <rect x="13" y="6" width="54" height="100" fill="currentColor"/>
                        <g mask="url(#download-bubbles)">${Array.from({ length: 8 }, (_, i) => `<circle class="download-bubble" cx="${23 + i * 5}" cy="104" r="${1.3 + i % 3 * .45}" style="--duration:${1.5 + i * .2}s;--delay:-${i * .37}s"/>`).join('')}</g>
                    </g></g>
                    <path d="M20 6v100M10 109h60M33 32h14l7 18H26l7-18Zm7 18v20M31 72h18" fill="none" stroke="var(--mute)" stroke-width="1"/>
                    <rect x="13" y="6" width="54" height="100" rx="2" fill="none" stroke="var(--mute)" stroke-width="1"/>`;
                    const bytes = el('span', 'download-bytes');
                    loading.append(vessel, bytes);
                    const progress = (received, total) => {
                        if (!live(session)) return;
                        loading.classList.toggle('download-indeterminate', !total);
                        loading.style.setProperty('--download-fraction', total ? clamp(received / total) : .45);
                        const format = new Intl.NumberFormat(lang, { style: 'unit', unit: 'megabyte', unitDisplay: 'short', maximumFractionDigits: 1 });
                        bytes.textContent = `${format.format(received / 1e6)}${total ? ` / ${format.format(total / 1e6)}` : ''}`;
                    };
                    progress(0, Number.isFinite(record.size) ? record.size : 0);
                    file = await cloud.download(record, progress);
                    progress(file.size, file.size); loading.classList.add('download-complete');
                }
                finally { downloading(record.id, -1); }
            }
        } else if (record.source.kind === 'fs') {
            const root = roots.find(root => root.id === record.source.root);
            if (!root || !await readPermission(root.handle)) throw new Error(t('readAccess'));
            file = await resolveFile(root, record.source.path);
        } else file = (await get('files', record.id))?.file;
        if (!live(session)) return;
        if (!file) throw new Error(t('fileStorageMissing'));
        if (!file.size) { resolvingFile = false; throw Object.assign(new Error('empty file'), { empty: true }); }
        resolvingFile = false;
        if (record.kind === 'foliate') await openFoliate(session, file);
        else if (record.kind === 'pdf') await openPDF(session, file);
        else await openText(session, file);
        if (!live(session)) return;
        session.ready = true;
        record.opened = Date.now(); record.finished = false; session.dirty = true;
        saveProgress(session);
        $('#loading')?.remove();
        $('#slider').disabled = $('#prev').disabled = $('#next').disabled = false;
        session.pane?.focus({ preventScroll: true });
        showBars();
    } catch (error) {
        if (live(session)) {
            await closeBook();
            report(() => error?.empty ? t('emptyBook')
                : resolvingFile ? t('fileMissing', { name: record.name })
                : t('openFailed', { title: record.title }), error);
        }
    }
}
function disposeView(view) {
    if (view.disposed) return;
    view.disposed = true;
    try { view.close(); } catch (error) { console.warn('Closing reader', error); }
    try { view.book?.destroy?.(); } catch (error) { console.warn('Releasing book', error); }
    view.remove();
}
async function closeBook() {
    if (!active) return closing;
    const session = active;
    session.capture?.();
    active = null;
    session.controller.abort();
    clearTimeout(session.barTimer); clearTimeout(session.saveTimer); clearTimeout(session.resizeTimer);
    clearTimeout(session.wheelResetTimer); clearTimeout(session.wheelLockTimer);
    for (const id of session.frames) cancelAnimationFrame(id);
    for (const cleanup of session.cleanups) { try { cleanup(); } catch (error) { console.warn(error); } }
    if (session.view && !session.openingView) disposeView(session.view);
    for (const url of session.urls) URL.revokeObjectURL(url);
    // Library covers outlive reader sessions, including pending lazy image loads.
    closePanels(); $('#toc-list').replaceChildren(); $('#r-body').replaceChildren();
    $('#reader').hidden = true; $('#library').hidden = false;
    hideBars(false);
    updateTitle(); applyMode();
    closing = saveProgress(session, true);
    await closing;
    closing = null;
    renderLibrary();
    [...$('#grid').querySelectorAll('.card')].find(card => card.dataset.id === session.record.id)
        ?.querySelector('.book-open').focus({ preventScroll: true });
}
$('#back').addEventListener('click', () => void closeBook());
$('#aa').addEventListener('click', () => {
    const open = $('#prefs').hidden; closePanels(); $('#prefs').hidden = !open;
    $('#aa').setAttribute('aria-expanded', String(open)); showBars();
    if (open) $('#themes button[aria-pressed="true"]')?.focus({ preventScroll: true });
});
$('#toc-button').addEventListener('click', () => {
    const open = $('#toc').hidden; closePanels(); $('#toc').hidden = !open;
    $('#toc-button').setAttribute('aria-expanded', String(open)); showBars();
    if (open) $('#toc-list [tabindex="0"]')?.focus({ preventScroll: true });
});
for (const button of document.querySelectorAll('[data-close-panel]')) button.addEventListener('click', () => { closePanels(); showBars(); });

// Foliate: document listeners are removed by the session's AbortController.
async function openFoliate(session, file) {
    const view = document.createElement('foliate-view');
    session.view = view;
    session.openingView = true;
    $('#r-body').append(view);
    const handleWheel = event => {
        if (!live(session) || session.record.kind !== 'foliate' || prefs.flow !== 'paginated' || session.wheelLock || !session.view) return;
        const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? $('#r-body').clientHeight : 1;
        const deltaX = event.deltaX * unit, deltaY = event.deltaY * unit;
        const useX = Math.abs(deltaX) > Math.abs(deltaY);
        const delta = useX ? deltaX : deltaY;
        if (!delta) return;
        session.wheelDelta = session.wheelDelta + delta;
        clearTimeout(session.wheelResetTimer);
        session.wheelResetTimer = setTimeout(() => { if (live(session)) session.wheelDelta = 0; }, 150);
        if (Math.abs(session.wheelDelta) < 48) return;
        const horizontal = session.wheelDelta > 0;
        const action = useX ? (horizontal ? session.view.goRight() : session.view.goLeft()) : (session.wheelDelta > 0 ? session.view.next() : session.view.prev());
        session.wheelDelta = 0;
        clearTimeout(session.wheelLockTimer);
        session.wheelLock = true;
        session.wheelLockTimer = setTimeout(() => { if (live(session)) session.wheelLock = false; }, 380);
        Promise.resolve(action).catch(error => report(() => t('turnFailed'), error));
    };
    listen(session, $('#r-body'), 'wheel', handleWheel, { passive: true });
    listen(session, view, 'load', ({ detail: { doc } }) => {
        if (view.isFixedLayout) styleFixedDocument(doc);
        else applyJustify(doc);
        hookSelection(session, doc);
        listen(session, doc, 'keydown', keydown);
        listen(session, doc, 'pointermove', showBars, { passive: true });
        listen(session, doc, 'wheel', handleWheel, { passive: true });
        listen(session, doc, 'click', contentClick);
    });
    listen(session, view, 'relocate', ({ detail }) => {
        closeLookup();
        const { fraction, tocItem, cfi } = detail;
        session.chapter = tocItem?.label || '';
        // Some fixed-layout books do not expose section progress.
        const index = view.renderer.index ?? 0;
        const value = Number.isFinite(fraction) ? fraction : index / Math.max(1, view.book.sections.length - 1);
        progress(session, value, cfi ?? tocItem?.href ?? session.record.loc,
            () => t(tocItem?.label ? 'sectionProgress' : 'chapterProgress', { section: tocItem?.label, chapter: index + 1, percent: Math.round(clamp(value) * 100) }));
        if (tocItem?.href && live(session)) session.toc?.setCurrentHref(tocItem.href);
    });
    try {
        await view.open(engineFile(file, session.record.name));
        session.openingView = false;
        if (!live(session)) return;
        view.classList.toggle('fixed-layout', view.isFixedLayout);
        applyPreferences();
        setTOC(session, view.book.toc, href => view.goTo(href));
        const fragment = document.createDocumentFragment();
        for (const fraction of view.getSectionFractions()) {
            const option = el('option'); option.value = fraction; fragment.append(option);
        }
        $('#ticks').replaceChildren(fragment);
        $('#slider').dir = view.book.dir || 'ltr';
        session.ready = true;
        await view.init({ lastLocation: session.record.loc ?? undefined, showTextStart: true });
    } finally {
        session.openingView = false;
        if (!live(session)) disposeView(view);
    }
}
function turn(direction) {
    closeLookup();
    const session = active;
    if (!session?.ready) return;
    if (session.view) Promise.resolve(direction < 0 ? session.view.goLeft() : session.view.goRight())
        .catch(error => report(() => t('turnFailed'), error));
    else {
        const step = session.pages ? session.pages[session.pageIndex ?? 0].box.offsetHeight + 16 : session.pane.clientHeight * .85;
        session.pane.scrollBy({ top: direction * step, behavior: 'instant' });
    }
}
$('#prev').addEventListener('click', () => turn(-1));
$('#next').addEventListener('click', () => turn(1));
$('#slider').addEventListener('input', e => {
    closeLookup();
    const session = active;
    if (!session?.ready) return;
    const fraction = clamp(e.target.value);
    $('#slider-fill').style.setProperty('--fraction', fraction);
    if (session.view) {
        const view = session.view;
        const action = view.isFixedLayout && !view.getSectionFractions().length
            ? view.goTo(Math.round(fraction * (view.book.sections.length - 1))) : view.goToFraction(fraction);
        Promise.resolve(action).catch(error => report(() => t('locationFailed'), error));
    } else session.pane.scrollTop = fraction * Math.max(0, session.pane.scrollHeight - session.pane.clientHeight);
});

// Scrolling panes share one passive listener and at most one queued animation frame.
function setupScroll(session) {
    const pane = session.pane;
    $('#slider').dir = 'ltr';
    let pending = false;
    session.capture = () => {
        if (!live(session) || !session.ready) return;
        const fraction = pane.scrollTop / Math.max(1, pane.scrollHeight - pane.clientHeight);
        let label;
        if (session.pages) {
            const middle = pane.scrollTop + pane.clientHeight / 2;
            const tops = session.pageTops || [];
            let low = 0, high = tops.length - 1;
            while (low < high) { const mid = Math.ceil((low + high) / 2); if (tops[mid] <= middle) low = mid; else high = mid - 1; }
            session.pageIndex = low;
            label = () => t('pageProgress', { page: low + 1, total: session.pages.length });
        }
        progress(session, fraction, fraction, label);
    };
    listen(session, pane, 'scroll', () => {
        closeLookup();
        if (pending) return;
        pending = true;
        frame(session, () => { pending = false; session.capture(); });
    }, { passive: true });
    listen(session, pane, 'click', contentClick);
    const location = clamp(session.record.loc ?? session.record.fraction);
    frame(session, () => {
        pane.scrollTop = location * Math.max(0, pane.scrollHeight - pane.clientHeight);
        session.ready = true;
        session.capture();
    });
}

// PDF: placeholders for every page, canvases and text only inside the observer's near range.
async function openPDF(session, file) {
    const pdfjs = await loadPDF();
    if (!live(session)) return;
    const data = await file.arrayBuffer();
    if (!live(session)) return;
    const loadingTask = pdfjs.getDocument({ data, isEvalSupported: false });
    session.cleanups.push(() => { void loadingTask.destroy().catch(console.warn); });
    const doc = await loadingTask.promise;
    if (!live(session)) return;
    const first = await doc.getPage(1), viewport = first.getViewport({ scale: 1 });
    if (!live(session)) return;
    const pane = el('div'); pane.id = 'pdf'; pane.tabIndex = 0; localize(pane, 'readPDF', {}, 'aria-label');
    session.pane = pane;
    hookSelection(session, document, pane);
    const fragment = document.createDocumentFragment();
    session.pages = Array.from({ length: doc.numPages }, (_, index) => {
        const box = el('div', 'page');
        box.style.aspectRatio = `${viewport.width} / ${viewport.height}`;
        box.dataset.page = index;
        localize(box, 'pageNumber', { page: index + 1 }, 'aria-label');
        fragment.append(box);
        return { box, index, visible: false, generation: 0, task: null, canvas: null, textTask: null, textLayer: null, rendering: false };
    });
    pane.append(fragment); $('#r-body').append(pane);
    const measure = () => { session.pageTops = session.pages.map(p => p.box.offsetTop); };
    let measurePending = false;
    const scheduleMeasure = () => {
        if (measurePending) return;
        measurePending = true;
        frame(session, () => { measurePending = false; measure(); });
    };
    function discard(page) {
        page.generation++;
        page.task?.cancel(); page.task = null;
        page.textTask?.cancel(); page.textTask = null;
        page.textLayer?.remove(); page.textLayer = null;
        if (page.canvas) { page.canvas.remove(); page.canvas.width = page.canvas.height = 0; page.canvas = null; }
        page.rendering = false;
    }
    async function render(page) {
        if (!live(session) || !page.visible || page.rendering || page.canvas) return;
        page.rendering = true;
        const generation = ++page.generation;
        const valid = () => live(session) && page.visible && generation === page.generation;
        try {
            const pdfPage = await doc.getPage(page.index + 1);
            if (!valid()) return;
            const base = pdfPage.getViewport({ scale: 1 });
            // Read width before writing styles; no layout reads in the scroll handler.
            const width = page.box.clientWidth;
            if (!width) return;
            page.box.style.aspectRatio = `${base.width} / ${base.height}`;
            scheduleMeasure();
            const scaled = pdfPage.getViewport({ scale: width / base.width });
            const outputScale = devicePixelRatio || 1;
            const canvas = el('canvas');
            canvas.width = Math.ceil(scaled.width * outputScale); canvas.height = Math.ceil(scaled.height * outputScale);
            localize(canvas, 'pageNumber', { page: page.index + 1 }, 'aria-label');
            const task = pdfPage.render({ canvasContext: canvas.getContext('2d'), viewport: scaled,
                transform: [outputScale, 0, 0, outputScale, 0, 0] });
            page.task = task; page.canvas = canvas; page.box.append(canvas);
            await task.promise;
            if (!valid()) return;
            page.task = null;
            const textContentSource = await pdfPage.getTextContent();
            // Let queued canvas work proceed before laying out selectable text.
            await new Promise(resolve => setTimeout(resolve, 0));
            if (!valid()) return;
            const container = el('div', 'textLayer');
            container.setAttribute('aria-hidden', 'true');
            container.style.setProperty('--scale-factor', scaled.scale);
            page.textLayer = container; page.box.append(container);
            // Confirmed in the cached CDN 4.10.38 build: export { ce as TextLayer }.
            const layer = new pdfjs.TextLayer({ textContentSource, container, viewport: scaled });
            page.textTask = layer;
            await layer.render();
            if (!valid()) return;
            page.textTask = null;
            pdfPage.cleanup();
        } catch (error) {
            if (valid() && error.name !== 'RenderingCancelledException') {
                discard(page); report(() => t('pageFailed', { page: page.index + 1 }), error);
            }
        } finally { if (generation === page.generation) page.rendering = false; }
    }
    const observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
            const page = session.pages[Number(entry.target.dataset.page)];
            page.visible = entry.isIntersecting;
            if (page.visible) void render(page); else discard(page);
        }
    }, { root: pane, rootMargin: '100% 0px' });
    for (const page of session.pages) observer.observe(page.box);
    session.refreshPDF = () => {
        closeLookup();
        for (const page of session.pages) discard(page);
        measure();
        // Resize may not change intersection thresholds, so explicitly queue near pages.
        for (const page of session.pages) if (page.visible) void render(page);
    };
    const resize = new ResizeObserver(() => {
        closeLookup();
        for (const page of session.pages) discard(page);
        clearTimeout(session.resizeTimer);
        session.resizeTimer = setTimeout(() => { if (live(session)) session.refreshPDF(); }, 150);
    });
    resize.observe(pane);
    session.cleanups.push(() => {
        observer.disconnect(); resize.disconnect();
        for (const page of session.pages) discard(page);
        // Cancellation settles first, then pdf.js can free its shared measurement canvases.
        queueMicrotask(() => pdfjs.TextLayer.cleanup());
    });
    measure(); setupScroll(session);
    const outline = await doc.getOutline().catch(() => null);
    if (!live(session)) return;
    const destinations = new Map();
    let nextId = 0;
    const convert = items => items.map(item => {
        const href = `pdf:${nextId++}`;
        if (item.dest) destinations.set(href, item.dest);
        return { label: item.title || t('untitled'), i18n: item.title ? null : 'untitled', href: item.dest ? href : undefined, subitems: convert(item.items || []) };
    });
    if (outline?.length) setTOC(session, convert(outline), async href => {
        let dest = destinations.get(href);
        if (typeof dest === 'string') dest = await doc.getDestination(dest);
        if (!dest || !live(session)) return;
        const index = typeof dest[0] === 'number' ? dest[0] : await doc.getPageIndex(dest[0]);
        if (live(session)) session.pages[index]?.box.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
}

// Text conversion. Imported markup cannot execute code or replace app controls.
function sanitizeHTML(source) {
    const parsed = new DOMParser().parseFromString(source, 'text/html');
    parsed.querySelectorAll('script,style,link,iframe,object,embed,base,meta,form,input,button,textarea,select,template,svg,math').forEach(node => node.remove());
    const anchors = new Map();
    let anchorIndex = 0;
    for (const node of parsed.body.querySelectorAll('[id]')) {
        const original = node.id, replacement = `reading-source-${anchorIndex++}`;
        if (!anchors.has(original)) anchors.set(original, replacement);
        node.id = replacement;
    }
    for (const node of parsed.body.querySelectorAll('*')) {
        for (const attribute of [...node.attributes]) {
            const name = attribute.name.toLowerCase();
            if (name.startsWith('data-i18n') || name.startsWith('on') || ['style', 'srcdoc', 'srcset', 'name', 'class', 'is', 'contenteditable', 'autofocus'].includes(name)) node.removeAttribute(attribute.name);
            else if (['href', 'src', 'xlink:href', 'action', 'formaction', 'poster', 'background'].includes(name)) {
                const value = attribute.value.replace(/[\u0000-\u0020]/g, '');
                const allowed = name === 'href' ? /^(https?:|mailto:|#)/i.test(value)
                    : name === 'src' && node.tagName === 'IMG' && /^(https?:|data:image\/(?:png|jpeg|gif|webp|avif);base64,)/i.test(value);
                if (!allowed) node.removeAttribute(attribute.name);
            }
        }
        if (node.tagName === 'A' && /^(https?:|mailto:)/i.test(node.getAttribute('href') || '')) {
            node.setAttribute('target', '_blank'); node.setAttribute('rel', 'noopener noreferrer');
        }
        if (node.getAttribute('href')?.startsWith('#')) {
            let target = node.getAttribute('href').slice(1);
            try { target = decodeURIComponent(target); } catch { /* Keep malformed fragments harmless. */ }
            if (anchors.has(target)) node.setAttribute('href', `#${anchors.get(target)}`);
            else node.removeAttribute('href');
        }
    }
    return parsed.body.innerHTML;
}
async function openText(session, file) {
    const pane = el('div'); pane.id = 'text'; pane.tabIndex = 0; localize(pane, 'readText', {}, 'aria-label');
    const article = el('article');
    const ext = session.record.ext;
    if (ext === 'txt') {
        const text = await file.text();
        if (!live(session)) return;
        for (const paragraph of text.split(/\r?\n\s*\r?\n/)) article.append(el('p', '', paragraph));
    } else {
        let html;
        if (['md', 'markdown'].includes(ext)) {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/marked/15.0.7/marked.min.js');
            if (!live(session)) return;
            html = globalThis.marked.parse(await file.text());
        } else if (ext === 'docx') {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.9.0/mammoth.browser.min.js');
            if (!live(session)) return;
            html = (await globalThis.mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() })).value;
        } else html = await file.text();
        if (!live(session)) return;
        article.innerHTML = sanitizeHTML(html);
    }
    if (!live(session)) return;
    session.pane = pane; session.article = article;
    hookSelection(session, document, article);
    pane.append(article); $('#r-body').append(pane);
    applyPreferences();
    const headings = [...article.querySelectorAll('h1,h2,h3')];
    const items = headings.map((heading, index) => {
        heading.id ||= `reading-heading-${index}`;
        return { label: heading.textContent || t('untitled'), i18n: heading.textContent ? null : 'untitled', href: `#${heading.id}` };
    });
    setTOC(session, items, href => {
        article.querySelector(href)?.scrollIntoView({ block: 'start', behavior: 'instant' });
        session.toc?.setCurrentHref(href);
    });
    listen(session, article, 'click', event => {
        const link = event.target.closest('a[href^="#"]');
        if (!link) return;
        event.preventDefault();
        article.querySelector(link.getAttribute('href'))?.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
    // Fonts and embedded images affect scroll height; restore once they have settled.
    await document.fonts.ready;
    await Promise.all([...article.querySelectorAll('img')].map(image => image.decode().catch(() => {})));
    if (live(session)) setupScroll(session);
}

// Preferences update the current renderer in place, without reopening its book.
const fixedStyles = new WeakMap();
function styleFixedDocument(doc) {
    if (!doc?.head) return;
    let styles = fixedStyles.get(doc);
    if (!styles) {
        styles = [doc.createElement('style'), doc.createElement('style')];
        doc.head.prepend(styles[0]); doc.head.append(styles[1]); fixedStyles.set(doc, styles);
    }
    bookCSS().forEach((css, index) => { styles[index].textContent = css; });
}
for (const [name, theme] of Object.entries(THEMES)) {
    const button = el('button'); button.dataset.theme = name;
    localize(button, `theme_${name}`, {}, 'title');
    localize(button, `theme_${name}`, {}, 'aria-label');
    button.style.setProperty('--sample-bg', theme.bg); button.style.setProperty('--sample-fg', theme.fg);
    button.append(el('span', 'theme-sample', 'A'), localize(el('span', 'theme-name'), `theme_${name}`));
    $('#themes').append(button);
}
for (const font of fonts) {
    const button = el('button', '', font); button.dataset.font = font;
    if (font === 'Boek') localize(button, 'publisherFont');
    button.style.fontFamily = font === 'Boek' ? 'Georgia, serif' : `"${font}", serif`;
    $('#fonts').append(button);
}
function syncPreferences() {
    $('#themes').style.setProperty('--selected', Object.keys(THEMES).indexOf(prefs.theme));
    $('#fonts').style.setProperty('--selected', fonts.indexOf(prefs.font));
    $('#flows').style.setProperty('--selected', prefs.flow === 'paginated' ? 0 : 1);
    $('#columns').style.setProperty('--selected', prefs.columns === 1 ? 0 : 1);
    for (const node of $('#themes').children) node.setAttribute('aria-pressed', String(node.dataset.theme === prefs.theme));
    for (const node of $('#fonts').children) node.setAttribute('aria-pressed', String(node.dataset.font === prefs.font));
    for (const node of $('#flows').children) node.setAttribute('aria-pressed', String(node.dataset.flow === prefs.flow));
    for (const node of $('#columns').children) node.setAttribute('aria-pressed', String(Number(node.dataset.columns) === prefs.columns));
    for (const key of ['size', 'lh', 'width']) $(`#${key}-value`).value = prefs[key];
    const limits = { size: [12, 32], lh: [1.2, 2], width: [1, 4] };
    for (const button of $('#prefs').querySelectorAll('[data-step]')) {
        const [key, delta] = button.dataset.step.split(':');
        button.disabled = Number(delta) < 0 ? prefs[key] <= limits[key][0] : prefs[key] >= limits[key][1];
    }
    $('#justify').checked = prefs.justify;
    $('#flow-row').hidden = active?.record.kind !== 'foliate';
    // Two pages side by side only exist in paginated flow.
    $('#columns-row').hidden = active?.record.kind !== 'foliate' || prefs.flow !== 'paginated';
    $('#justify-row').hidden = active?.record.kind === 'pdf';
}
function applyPreferences(changed) {
    const theme = THEMES[prefs.theme];
    const reader = $('#reader');
    reader.style.setProperty('--rbg', theme.bg); reader.style.setProperty('--rfg', theme.fg); reader.style.setProperty('--rlink', theme.link);
    reader.style.setProperty('--read-width', `${widthPx()}px`);
    reader.style.colorScheme = theme.dark ? 'dark' : 'light'; reader.dataset.dark = theme.dark;
    const renderer = active?.view?.renderer;
    if (renderer) {
        if (!changed || ['flow', 'width', 'columns'].includes(changed)) {
            renderer.setAttribute('flow', prefs.flow); renderer.setAttribute('max-column-count', String(prefs.columns));
            renderer.setAttribute('max-inline-size', widthPx()); renderer.setAttribute('gap', '6%'); renderer.setAttribute('margin', '56px');
            renderer.setAttribute('animated', '');
        }
        if (!changed || !['flow', 'width', 'columns'].includes(changed)) {
            if (renderer.setStyles) renderer.setStyles(bookCSS());
            if (changed === 'justify' && !active.view.isFixedLayout) for (const { doc } of renderer.getContents()) applyJustify(doc);
            else for (const { doc } of renderer.getContents()) styleFixedDocument(doc);
        }
    }
    if (active?.article) {
        Object.assign(active.article.style, { fontFamily: fontFamily(), fontSize: `${prefs.size}px`,
            lineHeight: prefs.lh, textAlign: prefs.justify ? 'justify' : 'start', color: 'var(--rfg)' });
    }
    if (changed === 'width' && active?.refreshPDF) {
        clearTimeout(active.resizeTimer);
        active.refreshPDF();
    }
    syncPreferences(); applyMode();
}
$('#prefs').addEventListener('click', e => {
    const button = e.target.closest('button');
    if (!button) return;
    let changed;
    for (const key of ['theme', 'font', 'flow']) if (button.dataset[key]) { prefs[key] = button.dataset[key]; changed = key; }
    if (button.dataset.columns) { prefs.columns = Number(button.dataset.columns); changed = 'columns'; }
    if (button.dataset.step) {
        const [key, delta] = button.dataset.step.split(':');
        const [min, max] = { size: [12, 32], lh: [1.2, 2], width: [1, 4] }[key];
        prefs[key] = Math.round(clamp(prefs[key] + Number(delta), min, max) * 10) / 10;
        changed = key;
    }
    if (changed) { writeSetting('leeslamp.prefs', JSON.stringify(prefs)); applyPreferences(changed); }
});
$('#justify').addEventListener('change', e => {
    prefs.justify = e.target.checked; writeSetting('leeslamp.prefs', JSON.stringify(prefs)); applyPreferences('justify');
});

// Cloud writes use an atomic read/merge and never call the mutation helpers above.
async function cloudChange(id, merge) {
    let changed;
    await recoverStorage(async () => {
        const db = await database();
        await new Promise((resolve, reject) => {
            const transaction = db.transaction(['books', 'files'], 'readwrite');
            transaction.oncomplete = resolve;
            transaction.onerror = transaction.onabort = event => reject(event.target.error ?? transaction.error ?? new Error(t('storageFailed')));
            const store = transaction.objectStore('books'), request = store.get(id);
            request.onsuccess = () => {
                try {
                    changed = merge(request.result);
                    // Keep a local path marker so a cloud tombstone cannot make
                    // a removed folder book return on this device's next scan.
                    if (changed === null && request.result?.source?.kind === 'fs') {
                        changed = { ...request.result, hidden: true, synced: request.result.updated };
                    }
                    if (changed === null) { store.delete(id); transaction.objectStore('files').delete(id); }
                    else if (changed !== undefined) store.put(changed);
                } catch (error) { transaction.abort(); reject(error); }
            };
        });
    });
    if (changed === null) {
        books = books.filter(book => book.id !== id); localFiles.delete(id); presentedBooks.delete(id);
        if (active?.record.id === id) active.deleted = true;
    } else if (changed) {
        const existing = books.find(book => book.id === id);
        if (existing) {
            const pending = active?.record === existing && active.dirty
                ? { fraction: existing.fraction, loc: existing.loc, opened: existing.opened, finished: existing.finished } : {};
            // Keep the in-memory cover instance: a fresh IndexedDB read is a new Blob object and would churn the cover's object URL.
            if (existing.cover && changed.cover) changed.cover = existing.cover;
            Object.assign(existing, changed, pending);
        } else books.push(changed);
    }
}
async function setupCloud() {
    const row = el('button', 'account-row'); row.id = 'account-button'; row.type = 'button';
    row.setAttribute('aria-haspopup', 'dialog');
    const summary = $('#account-summary');
    let user = null, statusKey = 'cloudUnsynced', statusProgress;
    function status(key, progress) {
        statusKey = key; statusProgress = key === 'cloudSyncing' ? progress : undefined;
        for (const container of [row, summary]) {
            const text = container.querySelector('[role="status"]');
            if (text) localize(text, statusProgress ? 'cloudSyncingCount' : key, statusProgress || {});
            const track = container.querySelector('.account-progress');
            if (track) {
                track.hidden = !statusProgress;
                track.firstElementChild.style.width = `${statusProgress?.total ? clamp(statusProgress.done / statusProgress.total) * 100 : 0}%`;
            }
        }
    }
    function account(next) {
        user = next;
        row.replaceChildren();
        summary.replaceChildren();
        localize(row, user ? 'account' : 'signIn', {}, 'aria-label');
        if (!user) { status('cloudUnsynced'); row.append(icon('cloud'), localize(el('span'), 'signIn')); return; }
        const name = user.name || user.email || t('account');
        const avatar = el('span', 'account-avatar', String(name).split(/\s+/).map(word => word[0]).slice(0, 2).join('').toUpperCase());
        if (typeof user.picture === 'string' && /^https:\/\//i.test(user.picture)) {
            const image = el('img'); image.src = user.picture; image.alt = ''; image.referrerPolicy = 'no-referrer';
            image.addEventListener('error', () => image.remove(), { once: true }); avatar.append(image);
        }
        const details = el('span', 'account-details');
        details.append(el('span', 'account-name', name));
        const text = el('span', 'account-status'); text.setAttribute('role', 'status');
        const track = el('span', 'account-progress'); track.setAttribute('aria-hidden', 'true'); track.append(el('span'));
        details.append(text, track); row.append(avatar, details);
        const summaryAvatar = avatar.cloneNode(true);
        const summaryImage = summaryAvatar.querySelector('img');
        summaryImage?.addEventListener('error', () => summaryImage.remove(), { once: true });
        summary.append(summaryAvatar, details.cloneNode(true));
        status(statusKey, statusProgress);
    }
    cloud = createCloud({
        all: () => all('books'), get: id => get('books', id), change: cloudChange,
        file: async id => (await get('files', id))?.file,
        async saveFile(id, file, valid) {
            await tx('files', 'readwrite', store => { if (valid()) return store.put({ id, file }); });
            if (valid()) { localFiles.add(id); renderLibrary(); }
        },
        async flush() { if (active?.dirty) await saveProgress(active, true); },
        // Never rebuild the grid behind the open filter sheet or an open book; render once it is visible again.
        async refresh() { if (filtersOpen || active) refreshPending = true; else renderLibrary(); },
        async wipe() {
            while (importing) await new Promise(resolve => setTimeout(resolve, 100));
            setImporting(true);
            try {
                if (active) await closeBook();
                const db = await database();
                await new Promise((resolve, reject) => {
                    const transaction = db.transaction(['books', 'files', 'roots'], 'readwrite');
                    transaction.oncomplete = resolve;
                    transaction.onerror = transaction.onabort = () => reject(transaction.error);
                    for (const store of ['books', 'files', 'roots']) transaction.objectStore(store).clear();
                });
                books = []; roots = []; localFiles.clear(); presentedBooks.clear(); renderLibrary();
            } finally { setImporting(false); }
        },
    }, {
        account,
        status,
        toast: (key, params) => toast(() => t(key, params)),
        confirm() {
            const dialog = $('#cloud-switch-dialog'); dialog.returnValue = '';
            return new Promise(resolve => {
                dialog.addEventListener('close', () => resolve(dialog.returnValue === 'confirm'), { once: true });
                dialog.showModal();
            });
        },
    });
    if (!await cloud.start()) { cloud = null; return; }
    for (const id of await tx('files', 'readonly', store => store.getAllKeys())) localFiles.add(id);
    const note = $('.device-note');
    note.querySelector(':scope > .icon').remove(); note.querySelector(':scope > span').remove();
    note.prepend(row);
    row.addEventListener('click', () => {
        const dialog = $(user ? '#account-dialog' : '#login-dialog');
        if (!dialog.open) dialog.showModal();
    });
    for (const button of document.querySelectorAll('[data-provider]')) button.addEventListener('click', async () => {
        const buttons = document.querySelectorAll('[data-provider]');
        for (const item of buttons) item.disabled = true;
        cloud.signIn();
    });
    $('#cloud-sync').addEventListener('click', () => { $('#account-dialog').close(); void cloud.sync(true); });
    $('#cloud-signout').addEventListener('click', () => { $('#account-dialog').close(); void cloud.signOut(); });
}

applyLanguage(); syncPreferences();
try {
    books = (await all('books')).map(book => ({ category: '', source: { kind: 'blob' }, ...book }));
    roots = await all('roots');
    setImporting(false); renderLibrary();
}
catch (error) { report(() => t('libraryFailed'), error); }
setupCloud().catch(() => { console.warn('Cloud accounts unavailable'); });
window.__leeslamp = { linkFolder, rescan };
async function registerServiceWorker() {
    if (!navigator.serviceWorker) return;
    const registration = await navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' });
    const prompt = $('#update-prompt');
    let refreshing = false;
    let reloading = false;
    let offeredWorker = null;
    const showUpdate = worker => {
        if (!navigator.serviceWorker.controller || !worker || worker === offeredWorker) return;
        offeredWorker = worker;
        prompt.hidden = false;
    };
    navigator.serviceWorker.addEventListener('controllerchange', async () => {
        if (!refreshing || reloading) return;
        reloading = true;
        const session = active;
        if (session) await saveProgress(session, true);
        location.reload();
    });
    $('#update-refresh').addEventListener('click', () => {
        const worker = registration.waiting;
        if (!worker || refreshing) return;
        refreshing = true;
        worker.postMessage({ type: 'SKIP_WAITING' });
    });
    $('#update-later').addEventListener('click', () => { prompt.hidden = true; });
    const trackInstalling = () => {
        const worker = registration.installing;
        if (!worker) return;
        const installed = () => {
            if (worker.state === 'installed') showUpdate(worker);
        };
        worker.addEventListener('statechange', installed);
        installed();
    };
    registration.addEventListener('updatefound', trackInstalling);
    trackInstalling();
    showUpdate(registration.waiting);

    const fiveMinutes = 5 * 60 * 1000;
    let lastCheck = Date.now(); // Registration already checks for an update.
    let checking = false;
    let timer;
    const checkForUpdate = async () => {
        if (document.hidden || checking || Date.now() - lastCheck < fiveMinutes) return;
        lastCheck = Date.now();
        checking = true;
        try { await registration.update(); }
        catch (error) { console.warn('Update check unavailable', error); }
        finally { checking = false; }
    };
    const schedule = () => {
        clearInterval(timer);
        if (!document.hidden) timer = setInterval(checkForUpdate, 30 * 60 * 1000);
    };
    document.addEventListener('visibilitychange', () => {
        schedule();
        if (!document.hidden) void checkForUpdate();
    });
    window.addEventListener('focus', checkForUpdate);
    schedule();
}
registerServiceWorker().catch(error => console.warn('Offline storage unavailable', error));
