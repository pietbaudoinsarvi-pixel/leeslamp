import './vendor/foliate-js/view.js';
import { createTOCView } from './vendor/foliate-js/ui/tree.js';
import { autoCategory, collectSubjects, normalizeCategory, sameCategory } from './autocat.js';

const STRINGS = {
    nl: {
        updateAvailable: 'Nieuwe versie beschikbaar',
        refreshApp: 'Vernieuwen',
        updateLater: 'Later',
        appTitle: 'Leeslamp · Je eigen leesruimte',
        description: 'Je boeken, rustig bij elkaar. Lees lokaal met Leeslamp.',
        library: 'Bibliotheek',
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
        format: 'Formaat',
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
        emptyTitle: 'Ruimte voor je volgende boek.',
        emptyText: 'Sleep je boeken hierheen.\nJe bibliotheek begint met één goed verhaal.',
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
        updateAvailable: 'New version available',
        refreshApp: 'Refresh',
        updateLater: 'Later',
        appTitle: 'Leeslamp · Your reading space',
        description: 'A quiet home for your books. Read locally with Leeslamp.',
        library: 'Library',
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
        format: 'Format',
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
        emptyTitle: 'Make room for your next read.',
        emptyText: 'Drop your books here.\nOne good story is all it takes to begin.',
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
let dbPromise;
const database = () => dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open('leeslamp', 2);
    request.onupgradeneeded = () => {
        for (const name of ['files', 'books', 'roots']) {
            if (!request.result.objectStoreNames.contains(name)) request.result.createObjectStore(name, { keyPath: 'id' });
        }
    };
    request.onsuccess = () => {
        request.result.onversionchange = () => { request.result.close(); dbPromise = null; };
        resolve(request.result);
    };
    request.onerror = () => { dbPromise = null; reject(request.error); };
    request.onblocked = () => toast(() => t('storageBlocked'));
});
const tx = async (store, mode, fn) => {
    const db = await database();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(store, mode);
        let request;
        transaction.oncomplete = () => resolve(request?.result);
        transaction.onerror = transaction.onabort = () => reject(transaction.error ?? new Error(t('storageFailed')));
        try { request = fn(transaction.objectStore(store), transaction); }
        catch (error) { transaction.abort(); reject(error); }
    });
};
const put = (store, obj) => tx(store, 'readwrite', s => s.put(obj));
const get = (store, id) => tx(store, 'readonly', s => s.get(id));
const all = store => tx(store, 'readonly', s => s.getAll());
// Import/delete are atomic across both stores, including quota failures.
const bookTransaction = async (record, file, remove = false) => {
    const db = await database();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['files', 'books'], 'readwrite');
        transaction.oncomplete = resolve;
        transaction.onerror = transaction.onabort = () => reject(transaction.error ?? new Error(t('storageFailed')));
        if (remove) {
            transaction.objectStore('books').delete(record.id);
            transaction.objectStore('files').delete(record.id);
        } else {
            transaction.objectStore('files').put({ id: record.id, file });
            transaction.objectStore('books').put(record);
        }
    });
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
    catch { toast(() => t('prefsFailed')); }
};
let toastTimer, toastMessage;
function toast(message, duration = 4000) {
    clearTimeout(toastTimer);
    toastMessage = typeof message === 'function' ? message : () => message;
    $('#toast').textContent = toastMessage();
    $('#toast').hidden = false;
    if (duration) toastTimer = setTimeout(() => { $('#toast').hidden = true; toastMessage = null; }, duration);
}
const report = (message, error) => { console.error(error); toast(message); };

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
const defaults = { theme: 'dag', font: 'Lora', size: 18, lh: 1.5, width: 2, flow: 'paginated', justify: true };
let savedPrefs;
try { savedPrefs = JSON.parse(readSetting('leeslamp.prefs', '{}')); } catch { savedPrefs = {}; }
const prefs = { ...defaults, ...savedPrefs };
if (!Object.hasOwn(THEMES, prefs.theme)) prefs.theme = defaults.theme;
if (!fonts.includes(prefs.font)) prefs.font = defaults.font;
prefs.size = Math.round(clamp(prefs.size, 12, 32));
prefs.lh = Math.round(clamp(prefs.lh, 1.2, 2) * 10) / 10;
prefs.width = Math.round(clamp(prefs.width, 1, 4));
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
const coverURLs = new Map();
const coverBlobs = new Map();
// Stagger only covers not yet presented this session; searching never replays the grid.
const presentedBooks = new Set();
const collator = new Intl.Collator('nl', { sensitivity: 'base', numeric: true });
const visibleBooks = () => books.filter(book => !book.hidden);
const isCurrentlyReading = book => Boolean(book.opened) && book.fraction > 0 && book.finished !== true && book.fraction < 0.98;
let listedBooks = [];
const categories = () => [...new Set(visibleBooks().map(book => book.category))].sort(collator.compare);
const categoryFilter = () => filter.startsWith('category:');
const filterName = () => categoryFilter() ? filter.slice(9) || t('noCategory')
    : filter === 'all' ? t('allBooks') : filter === 'reading' ? t('currentlyReading') : filter === 'recent' ? t('recent') : filter.toUpperCase();
function renderFilters() {
    const focusedFilter = document.activeElement?.closest('#filters button')?.dataset.filter;
    const visible = visibleBooks();
    if (!['all', 'reading', 'recent'].includes(filter) && !visible.some(b => categoryFilter() ? b.category === filter.slice(9) : b.ext === filter)) filter = 'all';
    const fragment = document.createDocumentFragment();
    const add = (value, label, count) => {
        const button = el('button', '', label);
        button.dataset.filter = value;
        if (filter === value) button.setAttribute('aria-current', 'page');
        button.append(el('span', 'count', count));
        fragment.append(button);
    };
    add('all', t('allBooks'), visible.length);
    add('reading', t('currentlyReading'), visible.filter(isCurrentlyReading).length);
    add('recent', t('recent'), visible.filter(b => b.opened).length);
    if (visible.length) fragment.append(el('div', 'section-label', t('categories')));
    for (const category of categories()) add(`category:${category}`, category || t('noCategory'), visible.filter(b => b.category === category).length);
    const extensions = [...new Set(visible.map(b => b.ext))].sort();
    if (extensions.length) fragment.append(el('div', 'section-label', t('format')));
    for (const ext of extensions) add(ext, ext.toUpperCase(), visible.filter(b => b.ext === ext).length);
    $('#filters').replaceChildren(fragment);
    if (focusedFilter) [...$('#filters').children].find(node => node.dataset.filter === focusedFilter)?.focus({ preventScroll: true });
    $('#filter-title').textContent = filterName();
}
function renderLibrary() {
    renderFilters();
    const sort = filter === 'reading' ? 'opened' : $('#sort').value;
    $('#sort').hidden = filter === 'reading';
    const allBooks = visibleBooks();
    const visible = allBooks.filter(b => (filter === 'all' || (categoryFilter() ? b.category === filter.slice(9) : filter === 'reading' ? isCurrentlyReading(b) : filter === 'recent' ? b.opened : b.ext === filter))
        && `${b.title} ${b.author}`.toLocaleLowerCase('nl').includes(query));
    visible.sort((a, b) => {
        if (sort === 'title' || sort === 'author') return collator.compare(a[sort], b[sort]) || collator.compare(a.title, b.title);
        return (sort === 'opened' ? (b.opened ?? 0) - (a.opened ?? 0) : 0) || b.added - a.added;
    });
    const fragment = document.createDocumentFragment();
    const retiredURLs = [];
    const currentCovers = new Map(visibleBooks().map(book => [book.id, book.cover]));
    for (const [id, url] of coverURLs) {
        if (currentCovers.get(id) !== coverBlobs.get(id)) {
            retiredURLs.push(url); coverURLs.delete(id); coverBlobs.delete(id);
        }
    }
    let arrival = 0;
    for (const book of visible) {
        const card = el('div', 'card');
        card.dataset.id = book.id;
        if (!presentedBooks.has(book.id)) {
            card.classList.add('arriving');
            card.style.setProperty('--delay', `${Math.min(arrival++, 8) * 40}ms`);
            presentedBooks.add(book.id);
        }
        const open = el('button', 'book-open');
        open.setAttribute('aria-label', t('openBook', { title: book.title }));
        open.title = `${book.title}${book.author ? ` · ${book.author}` : ''}`;
        const cover = el('span', 'cover');
        if (book.cover) {
            if (!coverURLs.has(book.id)) {
                coverURLs.set(book.id, URL.createObjectURL(book.cover)); coverBlobs.set(book.id, book.cover);
            }
            const image = el('img');
            image.src = coverURLs.get(book.id);
            image.alt = '';
            image.loading = 'lazy';
            image.decoding = 'async';
            cover.append(image);
        } else {
            let hash = 0;
            for (const character of book.title) hash = (hash * 31 + character.charCodeAt(0)) | 0;
            cover.classList.add('no-cover');
            cover.style.setProperty('--cover-color', `var(--cover-${Math.abs(hash) % 6})`);
            const placeholder = el('span', 'placeholder');
            placeholder.append(el('span', 'placeholder-format', book.ext.toUpperCase()),
                el('span', 'placeholder-title', book.title), el('span', 'placeholder-author', book.author || 'Leeslamp'));
            cover.append(placeholder);
        }
        open.append(cover);
        const track = el('span', 'progress-track'), fill = el('span');
        track.setAttribute('aria-hidden', 'true');
        fill.style.setProperty('--fraction', clamp(book.fraction));
        track.append(fill);
        open.append(track);
        open.append(el('span', 'book-title', book.title), el('span', 'book-author', book.author));
        const meta = el('span', 'book-meta');
        meta.append(el('span', '', book.ext.toUpperCase()), el('span', 'book-percent', book.finished === true ? t('finishedLabel') : t('percentRead', { percent: Math.round(clamp(book.fraction) * 100) })));
        open.append(meta);
        const remove = el('button', 'delete');
        remove.append(icon('delete'));
        remove.dataset.delete = 'true';
        remove.title = t(book.source.kind === 'fs' ? 'hideBook' : 'deleteBook', { title: book.title });
        remove.setAttribute('aria-label', remove.title);
        const change = el('button', 'delete category-change', '⋯');
        change.dataset.actions = 'true';
        change.setAttribute('aria-haspopup', 'dialog');
        change.title = t('bookActions', { title: book.title });
        change.setAttribute('aria-label', change.title);
        change.disabled = remove.disabled = importing;
        card.append(open, change, remove);
        fragment.append(card);
    }
    $('#grid').classList.toggle('currently-reading', filter === 'reading');
    $('#grid').replaceChildren(fragment);
    listedBooks = visible;
    // Detach every old image before revoking URLs it could still request lazily.
    for (const url of retiredURLs) URL.revokeObjectURL(url);
    $('#library-count').textContent = visible.length === allBooks.length ? t(visible.length === 1 ? 'bookCountOne' : 'bookCountOther', { count: visible.length }) : t('countOf', { count: visible.length, total: allBooks.length });
    $('#clear-recent').hidden = filter !== 'recent';
    $('#clear-recent').disabled = importing || !visible.length;
    $('#empty').hidden = allBooks.length !== 0 || filter === 'reading';
    $('#no-results').hidden = (!allBooks.length && filter !== 'reading') || visible.length !== 0;
    localize($('#no-results h2'), filter === 'reading' && !query ? 'currentlyReading' : 'noResultsTitle');
    localize($('#no-results p'), filter === 'reading' && !query ? 'currentlyReadingEmpty' : 'noResultsText');
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
    if (button) { filter = button.dataset.filter; renderLibrary(); }
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
        await tx('books', 'readwrite', store => {
            for (const record of records) store.put({ ...record, opened: null });
        });
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
function setImporting(value) {
    importing = value;
    for (const selector of ['#import-button', '#empty-import', '#find-books', '#link-folder', '#folder-import', '#rescan']) $(selector).disabled = value;
    for (const button of $('#grid').querySelectorAll('.delete')) button.disabled = value;
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
    let count = 0;
    const failures = [];
    const pipeline = categoryPipeline();
    let lastRender = performance.now();
    for (const [index, file] of [...files].entries()) {
        toast(() => t('importProgress', { current: index + 1, total: files.length }), 0);
        const ext = file.name.split('.').pop().toLowerCase(), kind = kindFor(ext);
        if (!kind) { failures.push(() => t('unsupportedFile', { name: file.name })); continue; }
        try {
            const category = categoryForFile(file);
            const record = newRecord(file, category === AUTO_CATEGORY ? '' : category, { kind: 'blob' });
            record.categoryManual = category !== AUTO_CATEGORY;
            try {
                const meta = await importMetadata(file, kind);
                Object.assign(record, meta, { title: meta.title.trim() || record.title, metadataReady: true });
            } catch (error) { console.warn(file.name, error); failures.push(() => t('metadataSkipped', { name: file.name })); }
            pipeline.local(record);
            await bookTransaction(record, file);
            books.push(record);
            count++;
            pipeline.remember(record.category);
            await pipeline.enqueue(record);
        } catch (error) { console.error(error); failures.push(() => t('importFailedFile', { name: file.name })); }
        if (performance.now() - lastRender >= 500) { renderLibrary(); lastRender = performance.now(); }
        await yieldUI();
    }
    try { await pipeline.flush(); }
    catch (error) { report(() => t('categoryFailed'), error); }
    setImporting(false);
    renderLibrary();
    toast(() => [t(count === 1 ? 'addedOne' : 'addedOther', { count }) + categorySummary(pipeline), ...failures.map(message => message())].join('\n'), failures.length ? 12000 : 4000);
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
const writeBookBatch = (records, removed = []) => tx('books', 'readwrite', store => {
    for (const record of records) store.put(record);
    for (const record of removed) store.delete(record.id);
});
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
    $('#folder-import').hidden = mobileImport.matches || hasDirectoryPicker || !('webkitdirectory' in $('#folder-input'));
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
            store.put({ ...current, fraction: session.record.fraction, loc: session.record.loc, opened: session.record.opened, finished: session.record.finished });
        };
        return request;
    })).catch(error => {
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
        if ($('#prefs').hidden && $('#toc').hidden && !$('#reader').querySelector('.reader-bar :focus-visible')) hideBars(true);
    }, 2500);
}
function closePanels() {
    const focusedPanel = document.activeElement?.closest('.popover');
    $('#prefs').hidden = $('#toc').hidden = true;
    $('#aa').setAttribute('aria-expanded', 'false');
    $('#toc-button').setAttribute('aria-expanded', 'false');
    if (focusedPanel && active) $(focusedPanel.id === 'prefs' ? '#aa' : '#toc-button').focus({ preventScroll: true });
}
function contentClick(event) {
    const doc = event.target.ownerDocument;
    if (event.target.closest('a,button,input,select,textarea,[contenteditable]') || !doc.getSelection()?.isCollapsed) return;
    if (!$('#prefs').hidden || !$('#toc').hidden) { closePanels(); showBars(); return; }
    if ($('#reader').classList.contains('bars-hidden')) showBars();
    else { clearTimeout(active?.barTimer); hideBars(true); }
}
function keydown(event) {
    if (!active || event.defaultPrevented) return;
    // Tab can always reach reader controls, even when pointer chrome is hidden.
    if (event.key === 'Tab') showBars();
    if (event.key === 'Escape') {
        event.preventDefault();
        if (!$('#toc').hidden || !$('#prefs').hidden) { closePanels(); showBars(); }
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
    listen(session, document, 'keydown', keydown);
    listen(session, $('#reader'), 'focusin', showBars);
    listen(session, $('#reader'), 'pointermove', showBars, { passive: true });
    listen(session, document, 'pointerdown', e => {
        if (!e.target.closest('#prefs,#aa,#toc,#toc-button')) closePanels();
    });
    listen(session, document, 'visibilitychange', () => {
        if (document.hidden) { session.capture?.(); void saveProgress(session, true); }
    });
    listen(session, window, 'pagehide', () => { session.capture?.(); void saveProgress(session, true); });
    let resolvingFile = true;
    try {
        let file;
        if (record.source.kind === 'fs') {
            const root = roots.find(root => root.id === record.source.root);
            if (!root || !await readPermission(root.handle)) throw new Error(t('readAccess'));
            file = await resolveFile(root, record.source.path);
        } else file = (await get('files', record.id))?.file;
        if (!live(session)) return;
        if (!file) throw new Error(t('fileStorageMissing'));
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
            report(() => resolvingFile ? t('fileMissing', { name: record.name })
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
        listen(session, doc, 'keydown', keydown);
        listen(session, doc, 'pointermove', showBars, { passive: true });
        listen(session, doc, 'wheel', handleWheel, { passive: true });
        listen(session, doc, 'click', contentClick);
    });
    listen(session, view, 'relocate', ({ detail }) => {
        const { fraction, tocItem, cfi } = detail;
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

// PDF: placeholders for every page, canvases only inside the observer's near range.
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
    const fragment = document.createDocumentFragment();
    session.pages = Array.from({ length: doc.numPages }, (_, index) => {
        const box = el('div', 'page');
        box.style.aspectRatio = `${viewport.width} / ${viewport.height}`;
        box.dataset.page = index;
        localize(box, 'pageNumber', { page: index + 1 }, 'aria-label');
        fragment.append(box);
        return { box, index, visible: false, generation: 0, task: null, canvas: null, rendering: false };
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
            const scaled = pdfPage.getViewport({ scale: width / base.width * (devicePixelRatio || 1) });
            const canvas = el('canvas');
            canvas.width = Math.ceil(scaled.width); canvas.height = Math.ceil(scaled.height);
            localize(canvas, 'pageNumber', { page: page.index + 1 }, 'aria-label');
            const task = pdfPage.render({ canvasContext: canvas.getContext('2d'), viewport: scaled });
            page.task = task; page.canvas = canvas; page.box.append(canvas);
            await task.promise;
            if (!valid()) return;
            page.task = null;
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
        for (const page of session.pages) discard(page);
        measure();
        // Resize may not change intersection thresholds, so explicitly queue near pages.
        for (const page of session.pages) if (page.visible) void render(page);
    };
    const resize = new ResizeObserver(() => {
        clearTimeout(session.resizeTimer);
        session.resizeTimer = setTimeout(() => { if (live(session)) session.refreshPDF(); }, 150);
    });
    resize.observe(pane);
    session.cleanups.push(() => { observer.disconnect(); resize.disconnect(); for (const page of session.pages) discard(page); });
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
    for (const node of $('#themes').children) node.setAttribute('aria-pressed', String(node.dataset.theme === prefs.theme));
    for (const node of $('#fonts').children) node.setAttribute('aria-pressed', String(node.dataset.font === prefs.font));
    for (const node of $('#flows').children) node.setAttribute('aria-pressed', String(node.dataset.flow === prefs.flow));
    for (const key of ['size', 'lh', 'width']) $(`#${key}-value`).value = prefs[key];
    const limits = { size: [12, 32], lh: [1.2, 2], width: [1, 4] };
    for (const button of $('#prefs').querySelectorAll('[data-step]')) {
        const [key, delta] = button.dataset.step.split(':');
        button.disabled = Number(delta) < 0 ? prefs[key] <= limits[key][0] : prefs[key] >= limits[key][1];
    }
    $('#justify').checked = prefs.justify;
    $('#flow-row').hidden = active?.record.kind !== 'foliate';
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
        if (!changed || ['flow', 'width'].includes(changed)) {
            renderer.setAttribute('flow', prefs.flow); renderer.setAttribute('max-column-count', '2');
            renderer.setAttribute('max-inline-size', widthPx()); renderer.setAttribute('gap', '6%'); renderer.setAttribute('margin', '56px');
            renderer.setAttribute('animated', '');
        }
        if (!changed || !['flow', 'width'].includes(changed)) {
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
        const session = active;
        session.resizeTimer = setTimeout(() => { if (live(session)) session.refreshPDF(); }, 150);
    }
    syncPreferences(); applyMode();
}
$('#prefs').addEventListener('click', e => {
    const button = e.target.closest('button');
    if (!button) return;
    let changed;
    for (const key of ['theme', 'font', 'flow']) if (button.dataset[key]) { prefs[key] = button.dataset[key]; changed = key; }
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

applyLanguage(); syncPreferences();
try {
    books = (await all('books')).map(book => ({ category: '', source: { kind: 'blob' }, ...book }));
    roots = await all('roots');
    setImporting(false); renderLibrary();
}
catch (error) { report(() => t('libraryFailed'), error); }
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
