import assert from 'node:assert/strict';
import { bookKey, planDedupe } from '../dedupe.js';

const base = { name: 'Boek.epub', ext: 'epub', size: 1234, title: 'Boek', author: '', category: '',
    source: { kind: 'blob' }, added: 10, opened: null, fraction: 0, loc: null };

assert.equal(bookKey(base), 'epub|1234|boek.epub');
assert.equal(bookKey({ ...base, name: ' BOEK.EPUB ', ext: 'EPUB' }), 'epub|1234|boek.epub');
assert.equal(bookKey({ ...base, size: 1235 }), 'epub|1235|boek.epub');
assert.equal(bookKey({ ...base, ext: 'pdf' }), 'pdf|1234|boek.epub');
for (const broken of [null, {}, { ...base, size: 0 }, { ...base, size: undefined }, { ...base, name: '  ' }]) {
    assert.equal(bookKey(broken), '');
}
console.log('PASS: identity is file name, extension and size; incomplete records never match.');

// Books without a usable key, single copies and hidden copies are left alone.
const untouched = planDedupe([{ ...base, id: 'a', size: 0 }, { ...base, id: 'b', size: 0 },
    { ...base, id: 'c' }, { ...base, id: 'd', hidden: true }]);
assert.deepEqual(untouched, { updates: [], removals: [], transfers: [] });

// Two imports of one file: the oldest record stays and takes over progress, category and cover.
const cover = { cover: true };
const first = { ...base, id: 'first', added: 10, fraction: .1, opened: 100, loc: 'old', metadataReady: false, title: 'Boek.epub' };
const second = { ...base, id: 'second', added: 20, fraction: .6, opened: 500, loc: 'new', finished: true,
    metadataReady: true, title: 'Het boek', author: 'Auteur', subjects: ['Roman'], category: 'Fictie',
    categoryManual: true, cover };
const merge = planDedupe([first, second]);
assert.deepEqual(merge.removals, [second]);
assert.deepEqual(merge.transfers, []);
assert.equal(merge.updates.length, 1);
assert.equal(merge.updates[0].record, first);
assert.deepEqual(merge.updates[0].changes, { opened: 500, fraction: .6, loc: 'new', finished: true,
    category: 'Fictie', categoryManual: true, title: 'Het boek', author: 'Auteur', metadataReady: true,
    subjects: ['Roman'], cover });
console.log('PASS: one card survives an import twice, with the newest reading progress and metadata.');

// The readable copy wins: a cloud copy serves every device, so it outranks a local-only record.
const cloudCopy = { ...base, id: 'cloud', added: 50, cloudFile: true };
const localCopy = { ...base, id: 'local', added: 10 };
const ranked = planDedupe([localCopy, cloudCopy], { hasFile: id => id === 'local' });
assert.deepEqual(ranked.removals, [localCopy]);
assert.deepEqual(ranked.transfers, [{ from: 'local', to: 'cloud' }]);
assert.deepEqual(ranked.updates.map(item => item.record), [cloudCopy]);
assert.deepEqual(ranked.updates[0].changes, { added: 10 });
// Bytes already at hand mean no transfer.
assert.deepEqual(planDedupe([localCopy, cloudCopy], { hasFile: () => true }).transfers, []);
// The open book is never the copy that goes.
const open = planDedupe([localCopy, cloudCopy], { activeId: 'local', hasFile: id => id === 'local' });
assert.deepEqual(open.removals, [cloudCopy]);
console.log('PASS: the copy that stays readable stays, the open book is never removed.');

// One folder linked on two devices: the folder copy is hidden, never deleted, so a rescan keeps it away.
const linked = { ...base, id: 'fs:root-a:Boek.epub', source: { kind: 'fs', root: 'root-a', path: 'Boek.epub' }, added: 5 };
const mine = { ...base, id: 'fs:root-b:Boek.epub', source: { kind: 'fs', root: 'root-b', path: 'Boek.epub' }, added: 40 };
const folders = planDedupe([linked, mine], { reachable: record => record.source.root === 'root-b' });
assert.deepEqual(folders.removals, []);
assert.deepEqual(folders.updates, [{ record: mine, changes: { added: 5 } }, { record: linked, changes: { hidden: true } }]);
console.log('PASS: a copy from a linked folder is hidden, the file on disk is left alone.');

// Three copies collapse into one and the plan is stable when it runs again.
const trio = [{ ...base, id: 'c', added: 30 }, { ...base, id: 'a', added: 30 }, { ...base, id: 'b', added: 30 }];
const collapsed = planDedupe(trio);
assert.deepEqual(collapsed.removals.map(record => record.id), ['c', 'b']);
assert.deepEqual(collapsed.updates, []);
for (const record of collapsed.removals) trio.splice(trio.indexOf(record), 1);
assert.deepEqual(planDedupe(trio), { updates: [], removals: [], transfers: [] });
console.log('PASS: more than two copies collapse to one and a second pass changes nothing.');
