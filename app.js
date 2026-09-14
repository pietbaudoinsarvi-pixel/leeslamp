import './vendor/foliate-js/view.js';
import { createTOCView } from './vendor/foliate-js/ui/tree.js';

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
    const request = indexedDB.open('leeslamp', 1);
    request.onupgradeneeded = () => {
        for (const name of ['files', 'books']) request.result.createObjectStore(name, { keyPath: 'id' });
    };
    request.onsuccess = () => {
        request.result.onversionchange = () => { request.result.close(); dbPromise = null; };
        resolve(request.result);
    };
    request.onerror = () => { dbPromise = null; reject(request.error); };
    request.onblocked = () => toast('Sluit andere Leeslamp-tabbladen om de opslag te openen.');
});
const tx = async (store, mode, fn) => {
    const db = await database();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(store, mode);
        let request;
        transaction.oncomplete = () => resolve(request?.result);
        transaction.onerror = transaction.onabort = () => reject(transaction.error ?? new Error('Opslag mislukt'));
        try { request = fn(transaction.objectStore(store), transaction); }
        catch (error) { transaction.abort(); reject(error); }
    });
};
const put = (store, obj) => tx(store, 'readwrite', s => s.put(obj));
const get = (store, id) => tx(store, 'readonly', s => s.get(id));
const all = store => tx(store, 'readonly', s => s.getAll());
const del = (store, id) => tx(store, 'readwrite', s => s.delete(id));
// Import/delete are atomic across both stores, including quota failures.
const bookTransaction = async (record, file, remove = false) => {
    const db = await database();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['files', 'books'], 'readwrite');
        transaction.oncomplete = resolve;
        transaction.onerror = transaction.onabort = () => reject(transaction.error ?? new Error('Opslag mislukt'));
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
const writeSetting = (key, value) => {
    try { localStorage.setItem(key, value); }
    catch { toast('Je voorkeuren konden niet worden opgeslagen.'); }
};
let toastTimer;
function toast(message, duration = 4000) {
    clearTimeout(toastTimer);
    $('#toast').textContent = message;
    $('#toast').hidden = false;
    if (duration) toastTimer = setTimeout(() => { $('#toast').hidden = true; }, duration);
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
    const name = { auto: 'systeem', light: 'licht', dark: 'donker' }[mode];
    $('#mode').title = `Weergave: ${name}`;
    $('#mode').setAttribute('aria-label', `Weergave: ${name}`);
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
let books = [], filter = 'all', query = '', searchTimer, importing = false;
const coverURLs = new Map();
// Stagger only covers not yet presented this session; searching never replays the grid.
const presentedBooks = new Set();
const collator = new Intl.Collator('nl', { sensitivity: 'base', numeric: true });
const filterName = () => filter === 'all' ? 'Alle boeken' : filter === 'recent' ? 'Laatst gelezen' : filter.toUpperCase();
function renderFilters() {
    const focusedFilter = document.activeElement?.closest('#filters button')?.dataset.filter;
    if (!['all', 'recent'].includes(filter) && !books.some(b => b.ext === filter)) filter = 'all';
    const fragment = document.createDocumentFragment();
    const add = (value, label, count) => {
        const button = el('button', '', label);
        button.dataset.filter = value;
        if (filter === value) button.setAttribute('aria-current', 'page');
        button.append(el('span', 'count', count));
        fragment.append(button);
    };
    add('all', 'Alle boeken', books.length);
    add('recent', 'Laatst gelezen', books.filter(b => b.opened).length);
    const extensions = [...new Set(books.map(b => b.ext))].sort();
    if (extensions.length) fragment.append(el('div', 'section-label', 'Formaat'));
    for (const ext of extensions) add(ext, ext.toUpperCase(), books.filter(b => b.ext === ext).length);
    $('#filters').replaceChildren(fragment);
    if (focusedFilter) [...$('#filters').children].find(node => node.dataset.filter === focusedFilter)?.focus({ preventScroll: true });
    $('#filter-title').textContent = filterName();
}
function renderLibrary() {
    renderFilters();
    const sort = $('#sort').value;
    const visible = books.filter(b => (filter === 'all' || (filter === 'recent' ? b.opened : b.ext === filter))
        && `${b.title} ${b.author}`.toLocaleLowerCase('nl').includes(query));
    visible.sort((a, b) => {
        if (sort === 'title' || sort === 'author') return collator.compare(a[sort], b[sort]) || collator.compare(a.title, b.title);
        return (sort === 'opened' ? (b.opened ?? 0) - (a.opened ?? 0) : 0) || b.added - a.added;
    });
    const fragment = document.createDocumentFragment();
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
        open.setAttribute('aria-label', `${book.title} openen`);
        open.title = `${book.title}${book.author ? ` · ${book.author}` : ''}`;
        const cover = el('span', 'cover');
        if (book.cover) {
            if (!coverURLs.has(book.id)) coverURLs.set(book.id, URL.createObjectURL(book.cover));
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
        if (book.fraction > 0) {
            const track = el('span', 'progress-track'), fill = el('span');
            fill.style.setProperty('--fraction', clamp(book.fraction));
            track.append(fill);
            open.append(track);
        }
        open.append(el('span', 'book-title', book.title), el('span', 'book-author', book.author));
        const meta = el('span', 'book-meta');
        meta.append(el('span', '', book.ext.toUpperCase()), el('span', '', book.fraction > 0 ? `${Math.round(clamp(book.fraction) * 100)}% gelezen` : book.opened ? 'Geopend' : 'Ongelezen'));
        open.append(meta);
        const remove = el('button', 'delete');
        remove.append(icon('delete'));
        remove.dataset.delete = 'true';
        remove.title = `${book.title} verwijderen`;
        remove.setAttribute('aria-label', remove.title);
        card.append(open, remove);
        fragment.append(card);
    }
    $('#grid').replaceChildren(fragment);
    $('#library-count').textContent = `${visible.length} ${visible.length === 1 ? 'boek' : 'boeken'}${visible.length !== books.length ? ` van ${books.length}` : ''}`;
    $('#empty').hidden = books.length !== 0;
    $('#no-results').hidden = !books.length || visible.length !== 0;
}
$('#grid').addEventListener('animationend', event => {
    const card = event.target.closest('.card');
    if (card && (event.animationName === 'progress-in' || (event.animationName === 'cover-in' && !card.querySelector('.progress-track')))) card.classList.remove('arriving');
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
    if (e.target.closest('[data-delete]')) {
        if (!confirm(`"${record.title}" verwijderen?`)) return;
        try {
            await bookTransaction(record, null, true);
            URL.revokeObjectURL(coverURLs.get(record.id));
            coverURLs.delete(record.id);
            presentedBooks.delete(record.id);
            books = books.filter(b => b.id !== record.id);
            renderLibrary();
        } catch (error) { report('Verwijderen is mislukt.', error); }
    } else if (e.target.closest('.book-open')) await openBook(record);
});

// Lazy format helpers and sequential import.
const scripts = new Map();
function loadScript(src) {
    if (!scripts.has(src)) scripts.set(src, new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = () => { script.remove(); scripts.delete(src); reject(new Error('Download mislukt')); };
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
    blob => blob ? resolve(blob) : reject(new Error('Omslag kon niet worden gemaakt')), 'image/jpeg', .8));
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
            catch (error) { console.warn('Omslag overgeslagen', error); }
            return { title: languageMap(book.metadata?.title), author: formatContributor(book.metadata?.author), cover };
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
            } catch (error) { console.warn('PDF-omslag overgeslagen', error); }
            return { title: typeof info.Title === 'string' ? info.Title : '', author: typeof info.Author === 'string' ? info.Author : '', cover };
        } finally { await task.destroy(); }
    }
    return { title: '', author: '', cover: null };
}
async function importFiles(files) {
    if (importing) { toast('Er worden al boeken geïmporteerd. Probeer het zo opnieuw.'); return; }
    if (!files.length) return;
    importing = true;
    $('#import-button').disabled = $('#empty-import').disabled = true;
    let count = 0;
    const failures = [];
    for (const [index, file] of [...files].entries()) {
        toast(`Importeren… ${index + 1}/${files.length}`, 0);
        const ext = file.name.split('.').pop().toLowerCase(), kind = kindFor(ext);
        if (!kind) { failures.push(`${file.name}: Dit bestandstype wordt niet ondersteund`); continue; }
        try {
            const meta = await importMetadata(file, kind);
            const record = { id: crypto.randomUUID(), name: file.name, ext, kind,
                title: meta.title.trim() || file.name.replace(/\.[^.]+$/, ''), author: meta.author || '', cover: meta.cover,
                added: Date.now(), opened: null, fraction: 0, loc: null };
            await bookTransaction(record, file);
            books.push(record);
            count++;
        } catch (error) { console.error(error); failures.push(`${file.name}: importeren mislukt`); }
    }
    importing = false;
    $('#import-button').disabled = $('#empty-import').disabled = false;
    renderLibrary();
    toast([`${count} ${count === 1 ? 'boek toegevoegd' : 'boeken toegevoegd'}`, ...failures].join('\n'), failures.length ? 12000 : 4000);
}
for (const id of ['#import-button', '#empty-import']) $(id).addEventListener('click', () => $('#file-input').click());
$('#file-input').addEventListener('change', e => { const files = [...e.target.files]; e.target.value = ''; void importFiles(files); });
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
$('#library').addEventListener('drop', e => {
    e.preventDefault(); dragDepth = 0; $('#library').classList.remove('dragging'); void importFiles([...e.dataTransfer.files]);
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
    const snapshot = { ...session.record };
    session.writes = session.writes.then(() => put('books', snapshot)).catch(error => {
        session.dirty = true;
        report('Je leesvoortgang kon niet worden opgeslagen.', error);
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
    $('#progress-label').textContent = label || `${Math.round(session.record.fraction * 100)}%`;
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
        Promise.resolve(select(href)).catch(error => report('Deze locatie kon niet worden geopend.', error));
        closePanels(); showBars();
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
        writes: Promise.resolve(), lastSave: 0, dirty: false, ready: false, urls: new Set() };
    active = session;
    $('#library').hidden = true; $('#reader').hidden = false;
    $('#r-title').textContent = record.title;
    document.title = `${record.title} · Leeslamp`;
    $('#toc-button').hidden = true;
    $('#ticks').replaceChildren(); $('#toc-list').replaceChildren();
    $('#slider').value = record.fraction;
    $('#slider-fill').style.setProperty('--fraction', clamp(record.fraction));
    $('#progress-label').textContent = `${Math.round(record.fraction * 100)}%`;
    $('#r-body').replaceChildren(Object.assign(el('div', '', 'Boek openen…'), { id: 'loading' }));
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
    try {
        const stored = await get('files', record.id);
        if (!live(session)) return;
        if (!stored?.file) throw new Error('Bestand ontbreekt in de opslag');
        if (record.kind === 'foliate') await openFoliate(session, stored.file);
        else if (record.kind === 'pdf') await openPDF(session, stored.file);
        else await openText(session, stored.file);
        if (!live(session)) return;
        session.ready = true;
        record.opened = Date.now(); session.dirty = true;
        saveProgress(session);
        $('#loading')?.remove();
        $('#slider').disabled = $('#prev').disabled = $('#next').disabled = false;
        session.pane?.focus({ preventScroll: true });
        showBars();
    } catch (error) {
        if (live(session)) { await closeBook(); report(`“${record.title}” kon niet worden geopend. Controleer het bestand en je verbinding.`, error); }
    }
}
function disposeView(view) {
    if (view.disposed) return;
    view.disposed = true;
    try { view.close(); } catch (error) { console.warn('Lezer afsluiten', error); }
    try { view.book?.destroy?.(); } catch (error) { console.warn('Boek vrijgeven', error); }
    view.remove();
}
async function closeBook() {
    if (!active) return closing;
    const session = active;
    session.capture?.();
    active = null;
    session.controller.abort();
    clearTimeout(session.barTimer); clearTimeout(session.saveTimer); clearTimeout(session.resizeTimer);
    for (const id of session.frames) cancelAnimationFrame(id);
    for (const cleanup of session.cleanups) { try { cleanup(); } catch (error) { console.warn(error); } }
    if (session.view && !session.openingView) disposeView(session.view);
    for (const url of session.urls) URL.revokeObjectURL(url);
    for (const url of coverURLs.values()) URL.revokeObjectURL(url);
    coverURLs.clear();
    closePanels(); $('#toc-list').replaceChildren(); $('#r-body').replaceChildren();
    $('#reader').hidden = true; $('#library').hidden = false;
    hideBars(false);
    document.title = 'Leeslamp'; applyMode();
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
    listen(session, view, 'load', ({ detail: { doc } }) => {
        if (view.isFixedLayout) styleFixedDocument(doc);
        listen(session, doc, 'keydown', keydown);
        listen(session, doc, 'pointermove', showBars, { passive: true });
        listen(session, doc, 'click', contentClick);
    });
    listen(session, view, 'relocate', ({ detail }) => {
        const { fraction, tocItem, cfi } = detail;
        // Some fixed-layout books do not expose section progress.
        const index = view.renderer.index ?? 0;
        const value = Number.isFinite(fraction) ? fraction : index / Math.max(1, view.book.sections.length - 1);
        progress(session, value, cfi ?? tocItem?.href ?? session.record.loc,
            `${tocItem?.label ? `${tocItem.label} · ` : ''}${Math.round(clamp(value) * 100)}%`);
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
        .catch(error => report('Bladeren is mislukt.', error));
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
        Promise.resolve(action).catch(error => report('Deze locatie kon niet worden geopend.', error));
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
            label = `Pagina ${low + 1} / ${session.pages.length}`;
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
    const pane = el('div'); pane.id = 'pdf'; pane.tabIndex = 0; pane.setAttribute('aria-label', 'PDF lezen');
    session.pane = pane;
    const fragment = document.createDocumentFragment();
    session.pages = Array.from({ length: doc.numPages }, (_, index) => {
        const box = el('div', 'page');
        box.style.aspectRatio = `${viewport.width} / ${viewport.height}`;
        box.dataset.page = index;
        box.setAttribute('aria-label', `Pagina ${index + 1}`);
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
            canvas.setAttribute('aria-label', `Pagina ${page.index + 1}`);
            const task = pdfPage.render({ canvasContext: canvas.getContext('2d'), viewport: scaled });
            page.task = task; page.canvas = canvas; page.box.append(canvas);
            await task.promise;
            if (!valid()) return;
            page.task = null;
            pdfPage.cleanup();
        } catch (error) {
            if (valid() && error.name !== 'RenderingCancelledException') {
                discard(page); report(`Pagina ${page.index + 1} kon niet worden getoond.`, error);
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
        return { label: item.title || 'Zonder titel', href: item.dest ? href : undefined, subitems: convert(item.items || []) };
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
            if (name.startsWith('on') || ['style', 'srcdoc', 'srcset', 'name', 'class', 'is', 'contenteditable', 'autofocus'].includes(name)) node.removeAttribute(attribute.name);
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
    const pane = el('div'); pane.id = 'text'; pane.tabIndex = 0; pane.setAttribute('aria-label', 'Tekst lezen');
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
        return { label: heading.textContent || 'Zonder titel', href: `#${heading.id}` };
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
    await Promise.all([...article.images].map(image => image.decode().catch(() => {})));
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
    button.title = name[0].toUpperCase() + name.slice(1);
    button.setAttribute('aria-label', button.title);
    button.style.setProperty('--sample-bg', theme.bg); button.style.setProperty('--sample-fg', theme.fg);
    button.append(el('span', 'theme-sample', 'A'), el('span', 'theme-name', button.title));
    $('#themes').append(button);
}
for (const font of fonts) {
    const button = el('button', '', font); button.dataset.font = font;
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
        }
        if (!changed || !['flow', 'width'].includes(changed)) {
            if (renderer.setStyles) renderer.setStyles(bookCSS());
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

applyMode(); syncPreferences();
try { books = await all('books'); renderLibrary(); }
catch (error) { report('De bibliotheek kon niet worden geladen. Controleer of browseropslag is toegestaan.', error); }
navigator.serviceWorker?.register('./sw.js').catch(error => console.warn('Offline opslag niet beschikbaar', error));
