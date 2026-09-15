import assert from 'node:assert/strict';
import { setImmediate as tick } from 'node:timers/promises';
import { createCloud, mergeRow, planPush, recordData } from '../sync.js';

const source = { kind: 'fs', root: 'local-root', path: 'local.epub' };
const cover = new Blob(['cover'], { type: 'image/jpeg' });
const book = { id: 'one', title: 'Local', name: 'one.epub', ext: 'epub', kind: 'foliate', category: '',
    source, cover, updated: 20, synced: 10, fraction: .2 };
const row = { id: 'one', data: { title: 'Remote', category: 'Fiction', source: { kind: 'blob' } }, updated: 30, file: true, cover: true };
assert.deepEqual(planPush([book, { updated: 5 }, { updated: 5, synced: 5 }, { updated: 4, synced: 5 }, {}]), [book, { updated: 5 }]);
assert.equal(mergeRow(book, { ...row, deleted: true, updated: 19 }), undefined);
assert.equal(mergeRow(book, { ...row, deleted: true, updated: 20 }), null);
assert.equal(mergeRow(undefined, { ...row, deleted: true }), undefined);
const inserted = mergeRow(undefined, row);
assert.equal(inserted.updated, 30); assert.equal(inserted.synced, 30); assert.equal(inserted.cloudFile, true);
assert.deepEqual(inserted.source, { kind: 'blob' });
const merged = mergeRow(book, row);
assert.equal(merged.title, 'Remote'); assert.equal(merged.category, 'Fiction');
assert.equal(merged.source, source); assert.equal(merged.cover, cover);
assert.equal(merged.synced, 30); assert.equal(merged.updated, 30);
assert.equal(mergeRow(book, { ...row, updated: 19 }), undefined);
assert.equal(mergeRow(book, { ...row, updated: 20 }), undefined);
const hostile = JSON.parse('{"title":"Allowed","id":"other","updated":999,"synced":999,"cloudFile":true,"fileSkipped":true,"cover":"bad","__proto__":{"polluted":true},"subjects":["History",{}]}');
assert.deepEqual(recordData(hostile), { title: 'Allowed', subjects: ['History'] });
assert.equal(mergeRow(book, { ...row, data: hostile }).source, source);
assert.equal({}.polluted, undefined);
assert.equal(createCloud({ url: '', anonKey: '' }), null);
console.log('PASS: pure push selection, tombstones, insert/update/ignore, local source/cover, field whitelist, disabled config.');

// In-memory Supabase and IDB substitutes. No browser, dependencies or network.
function fixture({ records = [], remote = [], uid = 'user-a', previous, confirm = true } = {}) {
    const values = new Map(previous ? [['leeslamp.cloud.user', previous]] : []);
    const localBooks = new Map(records.map(record => [record.id, structuredClone(record)]));
    const files = new Map(records.filter(record => record.source?.kind === 'blob').map(record => [record.id, new Blob(['ebook'])]));
    const objects = new Map(), calls = [], statuses = [], toasts = [];
    let current = { user: { id: uid } }, authCallback, failure = '', holdPull, holdUpload, confirmCount = 0;
    globalThis.localStorage = { getItem: key => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
    globalThis.document = new EventTarget();
    globalThis.location = { origin: 'https://reader.example', pathname: '/en', href: 'https://reader.example/en?code=secret&state=state&error=e&error_description=d&keep=yes#anchor' };
    globalThis.history = { state: { preserved: true }, replaceState(state, _title, url) { calls.push(['url', state, url]); } };
    const response = (kind, data) => ({ data, error: failure === kind ? { message: 'secret must not be logged' } : null });
    const client = {
        auth: {
            getSession: async () => response('auth', { session: current }),
            onAuthStateChange(callback) { authCallback = callback; },
            async signOut() { calls.push(['signOut']); if (!failure) { current = null; authCallback('SIGNED_OUT', null); } return response('signOut', null); },
            async signInWithOAuth(options) { calls.push(['oauth', options]); return response('oauth', null); },
        },
        from(table) {
            assert.equal(table, 'books');
            return {
                select(value) { assert.equal(value, '*'); return this; },
                gt(key, cursor) { assert.equal(key, 'updated_at'); this.cursor = cursor; return this; },
                order(key) { assert.equal(key, 'updated_at'); return this; },
                async range(a, b) {
                    calls.push(['pull', a, b, this.cursor]);
                    if (holdPull) { const wait = holdPull; holdPull = null; await wait; }
                    return response('pull', remote.filter(row => row.updated_at > this.cursor).slice(a, b + 1));
                },
                async upsert(rows) { calls.push(['upsert', structuredClone(rows)]); return response('upsert', null); },
            };
        },
        storage: { from(bucket) {
            assert.equal(bucket, 'books');
            return {
                async upload(path, blob, options) {
                    calls.push(['upload', path, options]);
                    if (holdUpload) { const wait = holdUpload; holdUpload = null; await wait; }
                    objects.set(path, blob); return response('upload', {});
                },
                async download(path) { calls.push(['download', path]); return response('download', objects.get(path) || cover); },
                async remove(paths) { calls.push(['remove', paths]); for (const path of paths) objects.delete(path); return response('remove', {}); },
            };
        } },
    };
    globalThis.window = new EventTarget();
    window.supabase = { createClient(url, key, options) {
        assert.equal(url, 'https://supabase.invalid'); assert.equal(key, 'public');
        assert.deepEqual(options, { auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true } });
        return client;
    } };
    const local = {
        all: async () => structuredClone([...localBooks.values()]), get: async id => structuredClone(localBooks.get(id)),
        async change(id, merge) {
            const next = merge(structuredClone(localBooks.get(id)));
            if (next === null) { localBooks.delete(id); files.delete(id); }
            else if (next !== undefined) localBooks.set(id, structuredClone(next));
        },
        file: async id => files.get(id), saveFile: async (id, file, valid) => { if (valid()) files.set(id, file); },
        flush: async () => {}, refresh: async () => {},
        async wipe() { calls.push(['wipe']); localBooks.clear(); files.clear(); },
    };
    const cloud = createCloud({ url: 'https://supabase.invalid', anonKey: 'public' }, local, {
        account: user => calls.push(['account', user?.id]), status: key => statuses.push(key),
        toast: key => toasts.push(key), confirm: async () => { confirmCount++; return confirm; },
    });
    return { cloud, calls, statuses, toasts, localBooks, files, values, objects,
        setFailure(value) { failure = value; }, hold(promise) { holdPull = promise; },
        holdUpload(promise) { holdUpload = promise; },
        signIn(nextUid) { current = { user: { id: nextUid } }; authCallback('SIGNED_IN', current); },
        get confirmCount() { return confirmCount; },
    };
}
async function settled() { for (let i = 0; i < 30; i++) await tick(); }
const warnings = [];
const originalWarn = console.warn;
console.warn = (...args) => warnings.push(args);
try {
    const local = { ...book, source: { kind: 'blob' } };
    const f = fixture({ records: [local], remote: [{ ...row, id: 'new', user_id: 'user-a', updated_at: '2026-09-15T10:00:00.123456+00:00' }] });
    await f.cloud.start(); await settled();
    assert.equal(f.statuses.at(-1), 'cloudSynced');
    assert.equal(f.calls.find(call => call[0] === 'url')[2], '/en?keep=yes#anchor');
    assert.ok(f.calls.findIndex(call => call[0] === 'pull') < f.calls.findIndex(call => call[0] === 'upsert'));
    assert.ok(f.calls.findIndex(call => call[0] === 'upload') < f.calls.findIndex(call => call[0] === 'upsert'));
    assert.equal(f.localBooks.get('one').synced, 20);
    assert.equal(f.localBooks.get('new').cover.type, 'image/jpeg');
    assert.ok(f.calls.filter(call => call[0] === 'upload').every(call => call[1].startsWith('user-a/')));
    assert.equal(f.calls.find(call => call[0] === 'upsert')[1][0].file, true);
    const downloaded = await f.cloud.download(f.localBooks.get('new'));
    assert.equal(f.files.get('new'), downloaded);
    await f.cloud.signIn('google');
    assert.deepEqual(f.calls.find(call => call[0] === 'oauth')[1], { provider: 'google', options: { redirectTo: 'https://reader.example/en' } });
    f.localBooks.delete('one'); f.cloud.remove(local); await f.cloud.sync();
    assert.ok(f.calls.some(call => call[0] === 'upsert' && call[1][0].deleted));
    assert.ok(f.calls.some(call => call[0] === 'remove' && call[1].join(',') === 'user-a/one,user-a/one.jpg'));
    assert.deepEqual(JSON.parse(f.values.get('leeslamp.cloud.tombstones')), []);
    await f.cloud.signOut(); await settled();
    assert.equal(f.values.has('leeslamp.cloud.pull.user-a'), false);
    assert.ok(f.localBooks.has('new')); assert.ok(f.files.has('new'));
    console.log('PASS: PKCE, clean OAuth URL, pull before push, truthful uploads, cover/file download, tombstone drain, sign-out retention.');

    const many = fixture({ records: Array.from({ length: 205 }, (_, id) => ({ ...book, id: String(id), cover: null })),
        remote: Array.from({ length: 1001 }, (_, id) => ({ ...row, id: `remote-${id}`, cover: false, user_id: 'user-a', updated_at: '2026-09-15T10:00:00Z' })) });
    await many.cloud.start(); await settled();
    assert.deepEqual(many.calls.filter(call => call[0] === 'upsert').map(call => call[1].length), [100, 100, 5]);
    assert.deepEqual(many.calls.filter(call => call[0] === 'pull').map(call => call.slice(1, 3)), [[0, 999], [1000, 1999]]);
    assert.equal(many.calls.filter(call => call[0] === 'upload').length, 0, 'linked files are never uploaded automatically');
    console.log('PASS: 100-row push chunks, 1000-row pull pagination, linked files stay local.');

    const failed = fixture({ records: [{ ...local, cover: null }] });
    failed.setFailure('upsert'); await failed.cloud.start(); await settled();
    assert.equal(failed.localBooks.get('one').synced, 10);
    assert.equal(failed.statuses.at(-1), 'cloudUnsynced');
    assert.deepEqual(failed.toasts, []);
    failed.setFailure(''); await failed.cloud.sync();
    assert.equal(failed.localBooks.get('one').synced, 20);
    failed.setFailure('pull'); await failed.cloud.sync(true);
    assert.equal(failed.toasts.at(-1), 'cloudFailed');
    failed.setFailure('');
    let release;
    failed.hold(new Promise(resolve => { release = resolve; }));
    const before = failed.calls.filter(call => call[0] === 'pull').length;
    const first = failed.cloud.sync(); await tick();
    const second = failed.cloud.sync(); failed.cloud.sync();
    assert.equal(first, second, 'one in-flight promise');
    release(); await first;
    assert.equal(failed.calls.filter(call => call[0] === 'pull').length - before, 2, 'one rerun for concurrent triggers');
    failed.cloud.changed();
    const beforeOnline = failed.calls.filter(call => call[0] === 'pull').length;
    window.dispatchEvent(new Event('online')); await settled();
    assert.equal(failed.calls.filter(call => call[0] === 'pull').length - beforeOnline, 1);
    console.log('PASS: resolved HTTP errors preserve unsynced state, retry, user-only error toast, single flight, rerun, online trigger.');

    const large = fixture({ records: [{ ...local, cover: null }] });
    large.files.set('one', { size: 50 * 1024 * 1024 + 1 });
    await large.cloud.start(); await settled();
    assert.equal(large.localBooks.get('one').fileSkipped, true);
    assert.equal(large.toasts.filter(key => key === 'cloudFileTooLarge').length, 1);
    large.localBooks.get('one').updated++;
    await large.cloud.sync();
    assert.equal(large.toasts.filter(key => key === 'cloudFileTooLarge').length, 1);
    assert.equal(large.calls.filter(call => call[0] === 'upload').length, 0);
    const linked = fixture({ records: [{ ...book, cover: null }] });
    await linked.cloud.start(); await settled();
    await linked.cloud.upload(book, new Blob(['linked']));
    assert.equal(linked.localBooks.get('one').cloudFile, true);
    assert.equal(linked.calls.filter(call => call[0] === 'upload').length, 1);
    console.log('PASS: permanent >50 MB skip with one toast, explicit linked-file upload.');

    const cancelled = fixture({ records: [book], previous: 'user-b', confirm: false });
    await cancelled.cloud.start(); await settled();
    assert.equal(cancelled.confirmCount, 1);
    assert.equal(cancelled.cloud.signedIn, false);
    assert.ok(cancelled.localBooks.has('one'));
    assert.equal(cancelled.calls.filter(call => ['pull', 'upsert', 'wipe'].includes(call[0])).length, 0);
    const accepted = fixture({ records: [book], previous: 'user-b' });
    await accepted.cloud.start(); await settled();
    assert.equal(accepted.confirmCount, 1); assert.equal(accepted.localBooks.size, 0);
    assert.ok(accepted.calls.findIndex(call => call[0] === 'wipe') < accepted.calls.findIndex(call => call[0] === 'pull'));
    const same = fixture({ records: [book], previous: 'user-a', confirm: false });
    await same.cloud.start(); await settled(); assert.equal(same.confirmCount, 0);
    console.log('PASS: different-account cancel signs out without syncing, confirm wipes before pull, same account has no prompt.');

    const offlineDelete = fixture({ records: [{ ...local, cover: null }] });
    await offlineDelete.cloud.start(); await settled(); await offlineDelete.cloud.signOut(); await settled();
    offlineDelete.localBooks.delete('one'); offlineDelete.cloud.remove(local);
    assert.equal(JSON.parse(offlineDelete.values.get('leeslamp.cloud.tombstones'))[0].uid, 'user-a');
    offlineDelete.signIn('user-a'); await settled();
    assert.equal(offlineDelete.localBooks.size, 0);
    assert.ok(offlineDelete.calls.some(call => call[0] === 'upsert' && call[1][0].deleted));
    assert.deepEqual(JSON.parse(offlineDelete.values.get('leeslamp.cloud.tombstones')), []);

    const pending = fixture({ remote: [{ ...row, user_id: 'user-a', updated_at: '2026-09-15T10:00:00Z' }] });
    pending.values.set('leeslamp.cloud.tombstones', JSON.stringify([{ uid: 'user-a', id: 'one', updated: 40 }]));
    await pending.cloud.start(); await settled();
    assert.equal(pending.localBooks.size, 0, 'pending deletion prevents pull resurrection');
    assert.equal(pending.calls.filter(call => call[0] === 'download').length, 0);

    const switching = fixture({ records: [{ ...local, cover: null }] });
    let releaseUpload;
    switching.holdUpload(new Promise(resolve => { releaseUpload = resolve; }));
    await switching.cloud.start(); await settled();
    assert.equal(switching.calls.filter(call => call[0] === 'upload').length, 1);
    switching.signIn('user-b'); releaseUpload(); await settled();
    assert.equal(switching.confirmCount, 1);
    assert.equal(switching.localBooks.size, 0);
    assert.equal(switching.calls.filter(call => call[0] === 'upsert').length, 0, 'old upload cannot publish a row after switching accounts');
    assert.ok(switching.calls.filter(call => call[0] === 'upload').every(call => call[1].startsWith('user-a/')));
    console.log('PASS: signed-out deletion queue, pending tombstones prevent resurrection, account switch fences an in-flight upload.');
    const authRetry = fixture({ records: [{ ...local, cover: null }] });
    authRetry.setFailure('auth'); await authRetry.cloud.start(); await settled();
    assert.equal(authRetry.cloud.signedIn, false);
    assert.equal(authRetry.calls.filter(call => call[0] === 'pull').length, 0);
    authRetry.setFailure(''); window.dispatchEvent(new Event('online')); await settled();
    assert.equal(authRetry.cloud.signedIn, true); assert.equal(authRetry.statuses.at(-1), 'cloudSynced');
    console.log('PASS: failed initial session lookup retries on the next online trigger.');
    assert.ok(warnings.every(args => args.length === 1 && args[0] === 'Cloud sync unavailable'), 'warnings contain no provider payloads');
} finally { console.warn = originalWarn; }
console.log('PASS: all sync tests (Node built-ins only; no network or browser).');
