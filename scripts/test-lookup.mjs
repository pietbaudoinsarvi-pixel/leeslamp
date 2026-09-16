import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { buildQueries, pickWikipedia, pickWiktionary, truncate, lookup, cancelLookup } from '../lookup.js';

const summary = { title: 'Jalal ad-Din Rumi', description: 'Persian poet', type: 'standard',
    extract: 'Rumi was a poet and scholar. His poetry is widely read.',
    content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/Rumi' } } };
const disambiguation = { title: 'Rumi', type: 'disambiguation', extract: 'Rumi may refer to…' };
const search = { query: { search: [{ title: 'Jalal ad-Din Rumi', pageid: 123, snippet: '<em>Rumi</em><img src=x onerror=alert(1)>' }] } };
const dictionary = '== Frans ==\n===== Zelfstandig naamwoord =====\nFrench meaning\n== Nederlands ==\n===== Betekenis =====\n# Een voorwerp dat licht geeft.\n# Een lichtbron.\n===== Uitspraak =====\nlɑmp';
const withoutDutch = '== English ==\n===== Noun =====\n# A device that produces light.\n===== Etymology =====\nOld word.';
const response = (json, status = 200) => ({ ok: status < 400, status, json: async () => json });
const empty = { query: { search: [], pages: { '-1': { missing: '' } } } };
const calls = [];
const fixture = handler => async (url, options) => {
    calls.push(url);
    assert.ok(options.signal instanceof AbortSignal);
    if (url.includes('/w/api.php')) { assert.equal(options.headers, undefined); assert.match(url, /origin=\*/); }
    else assert.equal(options.headers['Api-User-Agent'], 'Leeslamp/1.0 (https://leeslamp.vercel.app)');
    return handler(url, options);
};
assert.deepEqual(buildQueries('  “...lamp!”  ', 'nl'), { term: 'lamp', lang: 'nl', wikipedia: 'lamp', wiktionary: 'lamp' });
assert.equal(buildQueries('een   woord', 'nl').wiktionary, 'een woord');
assert.equal(buildQueries('meer dan twee woorden', 'nl').wiktionary, null);
assert.equal(buildQueries(Array(15).fill('woord').join(' '), 'nl').wikipedia.split(' ').length, 12);
assert.equal(buildQueries('x'.repeat(300), 'nl'), null);
assert.ok(buildQueries('x'.repeat(299), 'nl'));
assert.equal(buildQueries('“...”', 'nl'), null);
assert.equal(truncate('one two three four five', 15), 'one two three…');
assert.ok(truncate('A '.repeat(300), 400).length <= 400);
assert.equal(pickWikipedia(summary).title, summary.title);
assert.equal(pickWikipedia(disambiguation), null);
assert.equal(pickWikipedia({ ...summary, type: 'no-extract' }), null);
assert.equal(pickWikipedia(null, search), summary.title);
assert.ok(!JSON.stringify(pickWikipedia(summary, search)).includes('<'));
assert.equal(pickWiktionary(dictionary, 'nl'), 'Een voorwerp dat licht geeft. Een lichtbron.');
assert.equal(pickWiktionary(withoutDutch, 'nl'), 'A device that produces light.');
assert.equal(pickWiktionary('A plain definition.', 'en'), 'A plain definition.');

for (const [term, initial] of [['Rumi', response(disambiguation)], ['Missing poet title', response({}, 404)], ['No extract title', response({ type: 'no-extract' })]]) {
    calls.length = 0;
    const result = await lookup(term, 'nl', fixture(url => {
        if (url.includes('wiktionary')) return response(empty);
        if (url.includes('/w/api.php')) return response(search);
        return url.includes('Jalal') ? response(summary) : initial;
    }));
    assert.equal(result.kind, 'wikipedia');
    assert.ok(calls.some(url => url.includes('list=search')));
    assert.equal(calls.some(url => url.includes('wiktionary')), term === 'Rumi');
    assert.ok(calls.every(url => !url.startsWith('https://en.')), 'no English retry when Dutch succeeds');
}
calls.length = 0;
let started = 0, release;
const gate = new Promise(resolve => { release = resolve; });
const parallel = lookup('lichtbron', 'nl', fixture(async url => {
    if (++started === 2) release();
    await gate;
    return response(url.includes('wiktionary') ? { query: { pages: { 1: { extract: dictionary } } } } : summary);
}));
assert.equal((await parallel).kind, 'wiktionary');
assert.equal(started, 2, 'both sources start in parallel');
await lookup('lichtbron', 'nl', () => assert.fail('cache made another request'));

calls.length = 0;
await lookup('English retry only', 'nl', fixture(url => response(url.startsWith('https://en.') && url.includes('/summary/') ? summary : empty)));
assert.equal(calls.filter(url => url.startsWith('https://en.')).length, 1);
calls.length = 0;
assert.equal(await lookup('Nowhere at all', 'nl', fixture(() => response(empty))), null);
assert.equal(calls.length, 4, 'two requests per Wikipedia language, exactly two languages');
assert.deepEqual([...new Set(calls.map(url => new URL(url).hostname))], ['nl.wikipedia.org', 'en.wikipedia.org']);
calls.length = 0;
assert.equal(await lookup('Only English empty', 'en', fixture(() => response(empty))), null);
assert.equal(calls.length, 2, 'English is never retried');
await assert.rejects(lookup('Network failure fixture', 'nl', async () => { throw new TypeError('offline'); }), /lookupNetwork/);
const waiting = lookup('Cancelled lookup fixture', 'en', (url, { signal }) => new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true })));
cancelLookup();
await assert.rejects(waiting, { name: 'AbortError' });
assert.equal(await lookup('x'.repeat(300), 'nl', () => assert.fail('long selection fetched')), null);
console.log('PASS: lookup fixtures, headers, parallel sources, fallbacks, language limit, extraction, cache and cancellation.');

// Exercise the real selection handler with document/viewport fixtures. No browser or network needed.
const source = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const hook = source.slice(source.indexOf('function hookSelection('), source.indexOf('\nfunction updateAskButton('));
const inside = {}, outside = {};
const nodes = {
    '#lookup-panel': { hidden: true }, '#lookup-button': { hidden: true, offsetWidth: 96, offsetHeight: 36, style: {} },
    '#top-bar': { offsetHeight: 48 }, '#bottom-bar': { offsetHeight: 48 },
};
const mainWindow = { visualViewport: { width: 360, height: 640, offsetLeft: 0, offsetTop: 0 } };
const doc = new EventTarget();
doc.body = { contains: node => node === inside };
let selected = 'lamp';
const selection = { rangeCount: 1, isCollapsed: false, anchorNode: inside, focusNode: inside, toString: () => selected,
    getRangeAt: () => ({ cloneRange() { return this; }, collapse() {}, getBoundingClientRect: () => ({ right: 900, bottom: 1100, height: 20 }), getClientRects: () => [] }) };
doc.getSelection = () => selection;
doc.defaultView = { parent: mainWindow, frameElement: { clientWidth: 1000, clientHeight: 1000,
    getBoundingClientRect: () => ({ left: 16, top: 64, width: 500, height: 500 }) } };
const context = { buildQueries, live: s => !s.controller.signal.aborted, $: key => nodes[key], window: mainWindow,
    innerWidth: 360, innerHeight: 640, lang: 'nl', getComputedStyle: () => ({ getPropertyValue: () => '8px' }),
    listen: (s, target, type, fn) => target.addEventListener(type, fn, { signal: s.controller.signal }), closeLookup() {} };
runInNewContext('let selectedPassage = "", selectionDoc;\n' + hook + '\nthis.attach = hookSelection;', context);
const session = { controller: new AbortController() };
context.attach(session, doc);
doc.dispatchEvent(new Event('selectionchange'));
assert.equal(nodes['#lookup-button'].hidden, false);
assert.equal(nodes['#lookup-button'].style.left, '248px', 'iframe selection clamps inside viewport');
assert.equal(nodes['#lookup-button'].style.top, '548px', 'button reserves bottom bar space');
selected = 'x'.repeat(300); doc.dispatchEvent(new Event('selectionchange'));
assert.equal(nodes['#lookup-button'].hidden, true);
selected = 'lamp'; selection.focusNode = outside; doc.dispatchEvent(new Event('selectionchange'));
assert.equal(nodes['#lookup-button'].hidden, true, 'selection must remain entirely inside book');
selection.focusNode = inside; doc.dispatchEvent(new Event('selectionchange'));
selection.isCollapsed = true; doc.dispatchEvent(new Event('selectionchange'));
assert.equal(nodes['#lookup-button'].hidden, true, 'empty selection hides button');
session.controller.abort(); selection.isCollapsed = false; doc.dispatchEvent(new Event('selectionchange'));
assert.equal(nodes['#lookup-button'].hidden, true, 'session abort tears down listeners');
console.log('PASS: reader selection fixtures, iframe coordinates, viewport/bar bounds, 300-character limit and session listener teardown.');

// An inflected form points at its lemma; the lookup must follow it once and show the real meaning.
{
    const { inflectionOf, lookup: run } = await import('../lookup.js');
    assert.equal(inflectionOf('passes plural of pass', 'passes'), 'pass');
    assert.equal(inflectionOf('meervoud van pas', 'passen'), 'pas');
    assert.equal(inflectionOf('A narrow route through mountains.', 'pass'), null, 'a real definition is not an inflection');
    assert.equal(inflectionOf('plural of pass', 'pass'), null, 'never point a word at itself');
    const asked = [];
    const result = await run('passes', 'en', async url => {
        asked.push(url);
        if (url.includes('wikipedia')) return { ok: true, status: 200, json: async () => ({}) };
        const word = decodeURIComponent(new URL(url).searchParams.get('titles'));
        const noun = ['== English ==', '=== Noun ==='];
        const extract = word === 'passes' ? noun.concat('passes plural of pass').join(String.fromCharCode(10))
            : noun.concat('A narrow route through a mountain range.').join(String.fromCharCode(10));
        return { ok: true, status: 200, json: async () => ({ query: { pages: { 1: { extract } } } }) };
    });
    assert.equal(result.kind, 'wiktionary');
    assert.match(result.text, /narrow route/, 'the lemma meaning is shown');
    assert.match(result.title, /passes/); assert.match(result.title, /pass\b/);
    assert.match(result.url, /wiki\/pass$/, 'the link points at the lemma');
    assert.equal(asked.filter(url => url.includes('wiktionary')).length, 2, 'exactly one extra hop');
    console.log('PASS: an inflected form follows through to its lemma, once.');
}
