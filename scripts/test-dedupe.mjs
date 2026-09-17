import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { setImmediate as tick } from 'node:timers/promises';
import { planDedupe, createImportIndex } from '../dedupe.js';
import { createCloud, recordData } from '../sync.js';

const copy = (id, extra = {}) => ({ id, name: 'Café.epub', title: 'The Story', size: 3545111,
    source: { kind: 'blob' }, metadataReady: true, fraction: 0, updated: 1, ...extra });
const folder = (id, extra = {}) => copy(id, { source: { kind: 'fs', root: 'root', path: `${id}.epub` }, ...extra });
const roots = [{ id: 'root' }];
for (const [label, kinds] of Object.entries({ 'kopie+map': 'bf', 'kopie+kopie': 'bb',
    'kopie+kopie+map+map': 'bbff', 'kopie+kopie+map+map+map': 'bbfff',
    'kopie+map+map': 'bff', 'map+map': 'ff', singleton: 'b' })) {
    const records = [...kinds].map((kind, i) => (kind === 'f' ? folder : copy)(`${i}`));
    const before = structuredClone(records), plan = planDedupe(records, roots);
    assert.equal(plan.total, records.length - 1, label);
    assert.equal(plan.groups.length, records.length > 1 ? 1 : 0, label);
    assert.deepEqual(records, before, 'pure: inputs unchanged');
    assert.deepEqual(planDedupe(records, roots), plan, 'deterministic');
    console.log(`PASS: ${label}`);
}
const alone = Array.from({ length: 180 }, (_, i) => copy(`phone-${i}`, { name: `Phone ${i}.epub`, title: `Phone ${i}` }));
assert.equal(planDedupe(alone, roots).total, 0);
assert.equal(planDedupe([copy('a'), copy('b', { name: 'Unrelated.epub', title: 'Another story' })], roots).total, 0);
assert.equal(planDedupe([copy('a'), copy('b', { size: 3545112 })], roots).total, 0);
for (const size of [0, undefined, null, NaN, Infinity, -1, '3545111']) {
    assert.equal(planDedupe([copy('a', { size }), copy('b', { size })], roots).total, 0);
}
assert.equal(planDedupe([copy('a'), copy('b', { hidden: true })], roots).total, 0);
assert.equal(planDedupe([copy('a', { name: '', title: '' }), copy('b', { name: '', title: '' })], roots).total, 0);
assert.equal(planDedupe([copy('a'), copy('b', { name: '  CAFE.PDF  ', title: 'Other' })], roots).total, 1);
assert.equal(planDedupe([copy('a'), copy('b', { name: 'Other.epub', title: ' THE   Stóry ' })], roots).total, 1);
// A bridge joins both identities irrespective of enumeration order.
assert.equal(planDedupe([copy('a'), copy('b', { name: 'X.epub', title: 'Y' }), copy('c', { title: 'Y' })], roots).total, 2);
console.log('PASS: 180 phone-only books, unrelated identities, invalid sizes, hidden records and normalization.');

const cloud = copy('cloud', { cloudFile: true, driveFile: 'drive-book', updated: 30 });
const fs = folder('fs', { updated: 10 });
assert.equal(planDedupe([cloud, fs], roots).groups[0].keep.id, 'fs');
assert.equal(planDedupe([cloud, fs], []).groups[0].keep.id, 'cloud');
assert.equal(planDedupe([copy('b'), copy('a')], []).groups[0].keep.id, 'a');
assert.equal(planDedupe([copy('a'), copy('b', { updated: 2 })], []).groups[0].keep.id, 'b');
const transfer = planDedupe([cloud, fs, copy('other-cloud', { cloudFile: true, driveFile: 'other' })], roots).groups[0];
assert.equal(transfer.keep.driveFile, 'drive-book');
assert.equal(transfer.keep.cloudFile, true); assert.equal(transfer.keep.fileSynced, true);
assert.deepEqual(transfer.drop.map(record => record.keepFile), [true, false]);
assert.ok(planDedupe([cloud, copy('b', { cloudFile: true })], []).groups[0].drop.every(record => !record.keepFile));
console.log('PASS: keeper priorities, id ties and exactly one transferred Drive file.');

const state = planDedupe([folder('fs', { fraction: .4, loc: 'old', category: 'Default' }),
    copy('b', { fraction: 1, loc: 'end', opened: 99, finished: true, categoryManual: true, category: 'Manual', cover: 'cover' })], roots).groups[0].merged;
assert.deepEqual(state, { fraction: 1, loc: 'end', opened: 99, finished: true, category: 'Manual', categoryManual: true, cover: 'cover' });
const tied = planDedupe([copy('b', { fraction: .7, loc: 'copy', opened: 9, finished: true, category: 'Other', cover: 'other' }),
    folder('fs', { fraction: .7, loc: 'keeper', opened: 10, categoryManual: true, category: 'Own', cover: 'own' })], roots).groups[0].merged;
assert.equal(tied.loc, 'keeper'); assert.equal(tied.opened, 10); assert.equal(tied.category, 'Own'); assert.equal(tied.cover, 'own');
assert.equal(planDedupe([copy('a', { fraction: .5, finished: true }), copy('b', { fraction: .8 })], []).groups[0].merged.finished, false);
assert.equal(planDedupe([folder('f'), copy('b', { category: 'First' })], roots).groups[0].merged.category, 'First');
console.log('PASS: furthest reading progress, tied keeper location, finished state, manual categories and covers.');

const index = createImportIndex([copy('a')]);
assert.ok(index.has(copy('b', { name: ' CAFÉ.PDF ', metadataReady: false })));
assert.ok(index.has(copy('b', { name: 'Changed.epub', title: '  THE  Stóry ' })));
assert.ok(!index.has(copy('b', { name: 'Changed.epub', metadataReady: false })));
assert.ok(!createImportIndex([copy('a', { metadataReady: false })]).has(copy('b', { name: 'Changed.epub' })));
assert.ok(!createImportIndex([copy('a', { hidden: true })]).has(copy('b')));
assert.ok(!createImportIndex([copy('a', { title: 'Café' })]).has(copy('b', { name: 'Other.epub', title: 'Café' })));
for (const size of [0, undefined, NaN, Infinity]) assert.ok(!index.has(copy('b', { size })));
index.add(copy('c', { name: 'New.epub', title: 'New title' }));
assert.ok(index.has(copy('d', { name: 'New.epub' })));
console.log('PASS: import identity, metadata provenance, hidden/invalid sizes and same-import additions.');

// Execute the actual app transaction helper against a small atomic IDB double.
const appSource = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
// A stored record and the in-memory rebuild differ only in key order; the guard must not trip.
{
    const marker = String.fromCharCode(10) + 'async function applyDedupeBatch';
    const source = appSource.slice(appSource.indexOf('const stableValue ='), appSource.indexOf(marker));
    const revision = new Function(source + '; return dedupeRevision;')();
    const stored = { id: 'x', name: 'B.epub', ext: 'epub', kind: 'text', category: '', source: { kind: 'blob' }, size: 10, updated: 1 };
    const inMemory = { category: '', source: { kind: 'blob' }, ...stored };
    assert.equal(revision(stored), revision(inMemory), 'key order must not change the revision');
    assert.notEqual(revision(stored), revision({ ...stored, updated: 2 }), 'a real change must change the revision');
    assert.notEqual(revision(stored), revision({ ...stored, source: { kind: 'fs', root: 'r', path: 'p' } }));
    console.log('PASS: the revision guard ignores key order and still catches real changes.');
}
const batchSource = appSource.slice(appSource.indexOf('const stableValue ='), appSource.indexOf('\nasync function dedupeBooks()'));
function databaseFixture(records, blobs) {
    const data = { books: new Map(records.map(record => [record.id, structuredClone(record)])), files: new Map(blobs) };
    let writes = 0;
    const database = async () => ({ transaction() {
        const working = { books: new Map(data.books), files: new Map(data.files) };
        let pending = 0, aborted = false;
        const transaction = {
            abort() { if (!aborted) { aborted = true; queueMicrotask(() => transaction.onabort({ target: {} })); } },
            objectStore(name) { return {
                get(id) {
                    const request = {}; pending++;
                    queueMicrotask(() => {
                        if (aborted) return;
                        request.result = structuredClone(working[name].get(id)); request.onsuccess?.(); pending--;
                        if (!pending && !aborted) { Object.assign(data, working); transaction.oncomplete(); }
                    });
                    return request;
                },
                put(record) { writes++; working[name].set(record.id, structuredClone(record)); },
                delete(id) { writes++; working[name].delete(id); },
            }; },
        };
        return transaction;
    } });
    const apply = new Function('database', 't', `${batchSource}; return applyDedupeBatch;`)(database, key => key);
    return { data, apply, get writes() { return writes; } };
}
const keeper = folder('keeper');
const drops = Array.from({ length: 24 }, (_, i) => copy(`drop-${i}`));
const byteCopy = new Blob(['original ebook']);
const storage = databaseFixture([keeper, ...drops, ...alone], [['drop-0', { id: 'drop-0', file: byteCopy }]]);
await storage.apply(keeper, { ...keeper, fraction: .8, updated: 2 }, drops);
assert.equal(storage.writes, 50, 'no more than 50 writes per transaction');
assert.equal(storage.data.books.size, 181);
assert.equal(storage.data.books.get('keeper').fraction, .8);
assert.equal(await storage.data.files.get('keeper').file.text(), 'original ebook');
assert.ok(!storage.data.files.has('drop-0'));
for (const record of alone) assert.deepEqual(storage.data.books.get(record.id), record);
const stale = databaseFixture([keeper, copy('drop', { updated: 99 })], []);
await assert.rejects(stale.apply(keeper, { ...keeper, updated: 2 }, [copy('drop')]), /dedupeUnsafe/);
assert.equal(stale.writes, 0); assert.equal(stale.data.books.size, 2);
const hidden = databaseFixture([keeper, folder('drop')], []);
await hidden.apply(keeper, { ...keeper, updated: 2 }, [folder('drop')]);
assert.equal(hidden.data.books.get('drop').hidden, true);
assert.equal(hidden.data.books.get('drop').synced, hidden.data.books.get('drop').updated);
await assert.rejects(hidden.apply(keeper, keeper, [keeper]), /dedupeUnsafe/);
console.log('PASS: atomic batch, 50-write ceiling, local ebook retained, folder hidden, 180 singles untouched and stale plan aborted.');
// A transfer group now runs end to end: the keeper adopts the donor's Drive file.
const actionSource = appSource.slice(appSource.indexOf('async function dedupeBooks()'), appSource.indexOf("\nfor (const selector of ['#dedupe', '#dedupe-mobile'])"));
const guarded = [folder('fs'), cloud], errors = [];
let writes = 0, close;
const dialog = { open: false, addEventListener(_event, fn) { close = fn; },
    showModal() { this.returnValue = 'confirm'; queueMicrotask(close); } };
const removed = [];
const action = new Function('planDedupe', 'books', 'roots', '$', 't', 'setImporting', 'report', 'renderLibrary', 'applyDedupeBatch',
    'cloud', 'get', 'localFiles', 'presentedBooks', 'toast', 'setFiltersOpen', 'yieldUI',
    `let importing = false, filtersOpen = false, dedupeCount; ${appSource.slice(appSource.indexOf('const stableValue ='), appSource.indexOf('\nasync function applyDedupeBatch'))}\n${actionSource}; return dedupeBooks;`)(
    planDedupe, guarded, roots, selector => selector === '#dedupe-dialog' ? dialog : { textContent: '' }, key => key,
    () => {}, (_message, error) => errors.push(error), () => {}, () => { writes++; },
    { remove: (record, options) => removed.push({ id: record.id, ...options }), changed: () => {} }, async () => undefined,
    new Set(), new Set(), () => {}, () => {}, async () => {});
await action();
assert.equal(errors.length, 0, errors[0]?.message);
assert.ok(writes > 0, 'the cleanup writes');
// The folder record is the keeper and adopts the copy's Drive file in place.
assert.equal(guarded[0].id, 'fs');
assert.equal(guarded[0].driveFile, 'drive-book');
assert.equal(guarded[0].cloudFile, true);
// The donor's Drive ebook is explicitly spared.
assert.deepEqual(removed, [{ id: 'cloud', keepFile: true }]);
console.log('PASS: a transfer group completes and the keeper adopts the donor Drive file.');

// Reuse the existing offline Drive fixture without changing test-cloud.mjs.
const source = readFileSync(new URL('./test-cloud.mjs', import.meta.url), 'utf8');
const fixtureText = source.slice(source.indexOf('function fixture('), source.indexOf('\nconst warnings ='));
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
const settled = async () => { for (let i = 0; i < 40; i++) await tick(); };
const fixture = new Function('assert', 'createCloud', 'json', 'cover', 'settled', `${fixtureText}; return fixture;`)(assert, createCloud, json, new Blob(['cover']), settled);
for (const keepFile of [true, false]) {
    const f = fixture({ remote: [{ id: 'donor', updated: 1, file: true, cover: true, data: copy('donor') }] });
    await f.cloud.start();
    const donor = f.localBooks.get('donor');
    f.localBooks.delete('donor'); f.cloud.remove(donor, { keepFile });
    assert.equal(JSON.parse(f.values.get('leeslamp.cloud.tombstones'))[0].keepFile, keepFile);
    await f.cloud.sync();
    assert.ok(f.calls.some(call => call.type === 'multipart' && call.metadata.appProperties?.deleted === '1'));
    assert.deepEqual(f.calls.filter(call => call.type === 'delete').map(call => call.name).sort(),
        keepFile ? ['cover-donor.jpg'] : ['cover-donor.jpg', 'donor.epub']);
    assert.deepEqual(JSON.parse(f.values.get('leeslamp.cloud.tombstones')), []);
}
console.log('PASS: keepFile survives the tombstone queue; ebook retained, cover removed; ordinary deletion unchanged.');
// The transferred Drive file id must reach every other device.
assert.equal(recordData({ driveFile: 'drive-2' }).driveFile, 'drive-2');
const stranded = fixture({ remote: [
    { id: 'donor', updated: 1, file: true, cover: false, data: copy('donor') },
    { id: 'keeper', updated: 2, file: true, cover: false, data: { ...folder('keeper'), driveFile: 'drive-2' } },
] });
for (const [id, object] of stranded.objects) {
    if (object.appProperties.leeslampId === 'keeper') stranded.objects.delete(id);
}
await stranded.cloud.start();
assert.equal(stranded.localBooks.get('keeper').driveFile, 'drive-2');
// Different formats of one title are never merged.
const formats = planDedupe([copy('a', { ext: 'epub', name: 'boek.epub' }), copy('b', { ext: 'pdf', name: 'boek.pdf', title: copy('a').title })], roots);
assert.equal(formats.total, 0);
// One book in two formats: only with a metadata title AND an author, and the epub wins.
const book = { title: 'The Dimensions of Paradise', author: 'John Michell', metadataReady: true };
const asEpub = (id, extra = {}) => copy(id, { ...book, ext: 'epub', name: 'michell.epub', size: 3000000, ...extra });
const asPdf = (id, extra = {}) => copy(id, { ...book, ext: 'pdf', name: 'michell.pdf', size: 9000000, ...extra });
const mixed = planDedupe([asEpub('e'), asPdf('p')], roots);
assert.equal(mixed.total, 1);
assert.equal(mixed.groups[0].keep.id, 'e', 'the epub is kept');
assert.equal(mixed.groups[0].drop[0].id, 'p');
// A PDF in the linked folder still loses to an epub that only exists as a copy.
const folderPdf = planDedupe([asEpub('e'), asPdf('p', { source: { kind: 'fs', root: 'root', path: 'p.pdf' } })], roots);
assert.equal(folderPdf.groups[0].keep.id, 'e');
// The PDF's Drive file is not the epub's file and must never be adopted.
const donorPdf = planDedupe([asEpub('e'), asPdf('p', { cloudFile: true, driveFile: 'drive-pdf' })], roots);
assert.equal(donorPdf.groups[0].keep.driveFile, undefined);
assert.equal(donorPdf.groups[0].drop[0].keepFile, false);
// Same format still transfers.
const donorEpub = planDedupe([asEpub('e'), asEpub('e2', { cloudFile: true, driveFile: 'drive-epub', size: 3000000 })], roots);
assert.equal(donorEpub.groups[0].keep.driveFile, 'drive-epub');
// Not enough evidence: a different author, no author at all, or a title taken from the filename.
assert.equal(planDedupe([asEpub('e'), asPdf('p', { author: 'Someone Else' })], roots).total, 0);
assert.equal(planDedupe([asEpub('e', { author: '' }), asPdf('p', { author: '' })], roots).total, 0);
assert.equal(planDedupe([asEpub('e', { metadataReady: false }), asPdf('p', { metadataReady: false })], roots).total, 0);
assert.equal(planDedupe([asEpub('e', { title: 'michell' }), asPdf('p', { title: 'michell' })], roots).total, 0);
console.log('PASS: driveFile travels to other devices; one book in two formats merges to the epub without adopting the pdf file.');
console.log('PASS: all dedupe tests (Node built-ins only; no network).');
