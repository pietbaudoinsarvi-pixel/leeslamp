import assert from 'node:assert/strict';
import { setImmediate as tick } from 'node:timers/promises';
import { createCloud, mergeRow, planPush, pool, recordData } from '../sync.js';

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
console.log('PASS: pure push selection, tombstones, insert/update/ignore, local source/cover and field whitelist.');

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
async function settled() { for (let i = 0; i < 40; i++) await tick(); }
for (const fail of [false, true]) {
    let active = 0, peak = 0;
    const processed = [], items = Array.from({ length: 25 }, (_, i) => i);
    const work = pool(items, 4, async item => {
        peak = Math.max(peak, ++active);
        try {
            await tick(); processed.push(item);
            if (fail && item === 0) throw new Error('Item failed');
        } finally { active--; }
    });
    if (fail) await assert.rejects(work, AggregateError); else await work;
    assert.equal(peak, 4); assert.equal(active, 0);
    assert.deepEqual(processed.sort((a, b) => a - b), items);
}
console.log('PASS: pool processes all 25 items, peak concurrency 4, including an item failure.');
function fixture({ records = [], remote = [], uid = 'user-a', previous, confirm = true, tokenStatus = 200 } = {}) {
    const values = new Map(previous ? [['leeslamp.cloud.user', previous]] : []);
    const localBooks = new Map(records.map(record => [record.id, structuredClone(record)]));
    const files = new Map(records.filter(record => record.source?.kind === 'blob').map(record => [record.id, new Blob(['ebook'])]));
    const objects = new Map(), calls = [], statuses = [], progress = [], toasts = [], accounts = [];
    let inFlight = 0, peak = 0;
    let sequence = 0, confirmCount = 0, intercept = async () => undefined;
    const add = (name, data, appProperties = {}, space = 'appDataFolder') => {
        const id = `drive-${++sequence}`;
        objects.set(id, { id, name, data, appProperties, space, modifiedTime: '2026-09-15T10:00:00.000Z' });
        return id;
    };
    for (const row of remote) {
        add(`book-${row.id}.json`, { ...row.data, updated: row.updated, deleted: row.deleted === true },
            { updated: String(row.updated), deleted: row.deleted ? '1' : '0', file: row.file ? '1' : '0', cover: row.cover ? '1' : '0' });
        if (row.cover) add(`cover-${row.id}.jpg`, cover);
        if (row.file) add(`${row.id}.epub`, new Blob(['remote ebook']), { leeslampId: row.id }, 'drive');
    }
    globalThis.localStorage = { getItem: key => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
    globalThis.document = new EventTarget();
    globalThis.window = new EventTarget();
    globalThis.location = { pathname: '/en', href: 'https://reader.example/en?auth=cancelled&keep=yes#anchor', assign: url => calls.push({ type: 'redirect', url }) };
    globalThis.history = { state: { preserved: true }, replaceState(state, _title, url) { calls.push({ type: 'url', state, url }); } };
    const unquote = value => value.replace(/\\(.)/g, '$1');
    globalThis.fetch = async (path, init = {}) => {
        const url = new URL(path, 'https://reader.example');
        const call = { url, method: init.method || 'GET', init, type: 'http' };
        calls.push(call);
        const intercepted = await intercept(call);
        if (intercepted) return intercepted;
        if (url.pathname === '/api/auth/token') {
            assert.equal(init.method, 'POST');
            if (tokenStatus === 'network') throw new TypeError('offline');
            return json(tokenStatus === 200 ? { accessToken: `access-${uid}`, expiresIn: 3600, user: { id: uid, name: 'Reader' } } : {}, tokenStatus);
        }
        if (url.pathname === '/api/auth/logout') return new Response(null, { status: 204 });
        assert.equal(url.origin, 'https://www.googleapis.com', 'no other origins');
        assert.equal(init.headers.Authorization, `Bearer access-${uid}`);
        if (url.pathname === '/drive/v3/files' && call.method === 'GET') {
            const query = url.searchParams.get('q'); call.type = 'list'; call.query = query;
            assert.ok(query.includes('trashed = false'));
            assert.equal(url.searchParams.get('fields'), 'nextPageToken,files(id,name,modifiedTime,appProperties)');
            assert.equal(url.searchParams.get('pageSize'), '1000');
            let result = [...objects.values()];
            if (url.searchParams.has('spaces')) result = result.filter(file => file.space === url.searchParams.get('spaces'));
            if (query.includes("name contains 'book-'")) result = result.filter(file => file.name.includes('book-'));
            const names = [...query.matchAll(/name = '((?:\\.|[^'\\])*)'/g)].map(match => unquote(match[1]));
            if (names.length) result = result.filter(file => names.includes(file.name));
            const property = /key='([^']+)' and value='((?:\\.|[^'\\])*)'/.exec(query);
            if (property) result = result.filter(file => file.appProperties[property[1]] === unquote(property[2]));
            const cursor = /modifiedTime > '([^']+)'/.exec(query)?.[1];
            if (cursor) result = result.filter(file => file.modifiedTime > cursor);
            const offset = Number(url.searchParams.get('pageToken') || 0);
            return json({ files: result.slice(offset, offset + 1000).map(({ data, space, ...file }) => file),
                ...(offset + 1000 < result.length ? { nextPageToken: String(offset + 1000) } : {}) });
        }
        if (url.pathname === '/drive/v3/files' && call.method === 'POST') {
            const metadata = JSON.parse(init.body); call.type = 'folder'; call.metadata = metadata;
            const id = add(metadata.name, null, metadata.appProperties, 'drive');
            return json({ id });
        }
        if (url.pathname.startsWith('/upload/drive/v3/files')) {
            if (url.searchParams.get('uploadType') === 'resumable' && call.method === 'POST') {
                const metadata = JSON.parse(init.body); call.type = 'initiate'; call.metadata = metadata;
                const id = add(metadata.name, null, metadata.appProperties, 'drive');
                return new Response(null, { status: 200, headers: { Location: `https://www.googleapis.com/upload/drive/v3/files/${id}?uploadType=resumable` } });
            }
            const id = decodeURIComponent(url.pathname.split('/')[5] || '');
            if (call.method === 'PUT') {
                call.type = 'bytes'; objects.get(id).data = init.body;
                return json({ id });
            }
            call.type = 'multipart';
            assert.match(init.headers['Content-Type'], /^multipart\/related; boundary=/);
            const text = await init.body.text();
            assert.match(text, /Content-Type: application\/json; charset=UTF-8/);
            const parts = text.split('\r\n\r\n');
            const metadata = JSON.parse(parts[1].split('\r\n--')[0]); call.metadata = metadata;
            const content = parts[2].split('\r\n--')[0];
            const data = metadata.mimeType === 'application/json' ? JSON.parse(content) : new Blob([content], { type: metadata.mimeType });
            if (id && !objects.has(id)) return json({}, 404);
            const saved = id || add(metadata.name, data, metadata.appProperties, metadata.parents[0]);
            Object.assign(objects.get(saved), { data, ...metadata, modifiedTime: '2026-09-15T11:00:00.000Z' });
            call.data = data;
            return json({ id: saved });
        }
        const id = decodeURIComponent(url.pathname.split('/')[4]);
        const file = objects.get(id);
        if (!file) return json({}, 404);
        if (call.method === 'DELETE') { call.type = 'delete'; call.name = file.name; objects.delete(id); return new Response(null, { status: 204 }); }
        if (url.searchParams.get('alt') === 'media') {
            call.type = 'download'; call.name = file.name;
            return file.data instanceof Blob ? new Response(file.data) : json(file.data);
        }
        return json({ id: file.id });
    };
    const fetch = globalThis.fetch;
    globalThis.fetch = async (path, init) => {
        const drive = new URL(path, 'https://reader.example').hostname === 'www.googleapis.com';
        if (drive) peak = Math.max(peak, ++inFlight);
        try { return await fetch(path, init); } finally { if (drive) inFlight--; }
    };
    const local = {
        all: async () => structuredClone([...localBooks.values()]),
        get: async id => { calls.push({ type: 'get', id }); return structuredClone(localBooks.get(id)); },
        async change(id, merge) {
            const next = merge(structuredClone(localBooks.get(id)));
            if (next === null) { localBooks.delete(id); files.delete(id); }
            else if (next !== undefined) localBooks.set(id, structuredClone(next));
        },
        file: async id => files.get(id), saveFile: async (id, file, valid) => { if (valid()) files.set(id, file); },
        flush: async () => {}, refresh: async () => { calls.push({ type: 'refresh', size: localBooks.size, time: Date.now() }); },
        async wipe() { calls.push({ type: 'wipe' }); localBooks.clear(); files.clear(); },
    };
    let idle = Promise.resolve(), finish;
    const cloud = createCloud(local, { account: user => accounts.push(user), status: (key, params) => {
        statuses.push(key);
        if (params) progress.push({ key, ...params, time: Date.now() });
        if (key === 'cloudSyncing') { if (!finish) idle = new Promise(resolve => { finish = resolve; }); }
        else { finish?.(); finish = null; }
    },
        toast: key => toasts.push(key), confirm: async () => { confirmCount++; return confirm; } });
    const start = cloud.start;
    cloud.start = async () => { const enabled = await start(); await idle; await settled(); return enabled; };
    return { cloud, localBooks, files, objects, values, calls, statuses, progress, toasts, accounts, add,
        intercept(fn) { intercept = fn; }, setTokenStatus(value) { tokenStatus = value; }, setUser(value) { uid = value; },
        get confirmCount() { return confirmCount; }, get peak() { return peak; } };
}

const warnings = [], originalWarn = console.warn, originalFetch = globalThis.fetch;
console.warn = (...args) => warnings.push(args);
try {
    // Chunked binary response: progress is bounded, totals prefer the header, bytes survive intact.
    const streamed = fixture({ remote: [{ ...row, cover: false }] });
    await streamed.cloud.start();
    const payload = Uint8Array.from({ length: 8192 }, (_, i) => i % 256), downloadProgress = [];
    streamed.intercept(async call => {
        if (call.url.searchParams.get('alt') !== 'media') return;
        let offset = 0;
        return new Response(new ReadableStream({ async pull(controller) {
            if (offset === payload.length) { controller.close(); return; }
            await new Promise(resolve => setTimeout(resolve, 35));
            controller.enqueue(payload.slice(offset, offset += 1024));
        } }), { headers: { 'Content-Length': String(payload.length), 'Content-Type': 'application/epub+zip' } });
    });
    const streamedBlob = await streamed.cloud.download({ ...streamed.localBooks.get('one'), size: 1 },
        (received, total) => downloadProgress.push({ received, total, time: performance.now() }));
    assert.deepEqual(new Uint8Array(await streamedBlob.arrayBuffer()), payload);
    assert.equal(streamed.files.get('one'), streamedBlob);
    assert.equal(streamedBlob.type, 'application/epub+zip');
    assert.equal(downloadProgress[0].received, 0);
    assert.equal(downloadProgress.at(-1).received, payload.length);
    assert.ok(downloadProgress.some(p => p.received > 0 && p.received < payload.length));
    for (const [i, p] of downloadProgress.entries()) {
        assert.equal(p.total, payload.length);
        if (i) assert.ok(p.received >= downloadProgress[i - 1].received);
        if (i && i < downloadProgress.length - 1) assert.ok(p.time - downloadProgress[i - 1].time >= 99);
    }
    console.log('PASS: streamed download reports throttled progress and yields the full binary bytes.');
    const assertProgress = (f, total) => {
        assert.ok(f.progress.length > 0);
        assert.equal(f.progress.at(-1).done, total);
        assert.equal(f.progress.at(-1).total, total);
        for (const [i, value] of f.progress.entries()) {
            assert.equal(value.key, 'cloudSyncing');
            assert.ok(value.done >= 0 && value.done <= value.total);
            if (i) assert.ok(value.time - f.progress[i - 1].time >= 100, 'progress throttled to 100 ms');
        }
    };
    const selective = fixture({
        remote: Array.from({ length: 10 }, (_, i) => ({ ...row, id: `select-${i}`, file: false, cover: false })),
        records: Array.from({ length: 9 }, (_, i) => ({ ...book, id: `select-${i + 1}`,
            updated: i < 2 ? 20 : i < 6 ? 30 : 40, synced: i < 2 ? 20 : i < 6 ? 30 : 40 })),
    });
    await selective.cloud.start();
    assert.equal(selective.calls.filter(call => call.type === 'download').length, 3);
    assert.ok(selective.progress.every(value => value.total === 3));
    assertProgress(selective, 3);
    assert.equal(selective.values.get('leeslamp.cloud.pull.user-a'), '2026-09-15T10:00:00.000Z');

    const unknownDeleted = fixture({ remote: [{ ...row, deleted: true, file: false, cover: false }] });
    await unknownDeleted.cloud.start();
    assert.deepEqual(unknownDeleted.progress, []);
    assert.deepEqual(unknownDeleted.statuses, ['cloudSyncing', 'cloudSynced']);
    assert.equal(unknownDeleted.calls.filter(call => call.type === 'download').length, 0);
    assert.equal(unknownDeleted.values.get('leeslamp.cloud.pull.user-a'), '2026-09-15T10:00:00.000Z');
    const knownDeleted = fixture({ records: [{ ...book, synced: 20 }],
        remote: [{ ...row, updated: 20, deleted: true, file: false, cover: false }] });
    await knownDeleted.cloud.start();
    assertProgress(knownDeleted, 1);
    assert.equal(knownDeleted.localBooks.size, 0);

    const echo = fixture({ records: [book, { ...book, id: 'synced', synced: 20 },
        { ...book, id: 'ahead', synced: 30 }] });
    await echo.cloud.start();
    assertProgress(echo, 1);
    assert.deepEqual(echo.calls.filter(call => call.type === 'multipart' && call.metadata.name.startsWith('book-'))
        .map(call => call.metadata.name), ['book-one.json']);
    echo.calls.length = 0; echo.progress.length = 0;
    await echo.cloud.sync();
    assert.equal(echo.calls.filter(call => call.type === 'get' || call.type === 'download').length, 0);
    assert.deepEqual(echo.progress, []);
    assert.equal(echo.values.get('leeslamp.cloud.pull.user-a'), '2026-09-15T11:00:00.000Z');
    const echoFile = [...echo.objects.values()].find(file => file.name === 'book-one.json');
    echoFile.appProperties.updated = '30'; echoFile.data = { title: 'Newer remote' };
    echoFile.modifiedTime = '2026-09-15T12:00:00.000Z';
    await echo.cloud.sync();
    assertProgress(echo, 1);
    assert.equal(echo.localBooks.get('one').title, 'Newer remote');
    echoFile.appProperties.updated = '20'; echoFile.modifiedTime = '2026-09-15T13:00:00.000Z';
    echo.calls.length = 0; echo.progress.length = 0;
    await echo.cloud.sync();
    assert.equal(echo.calls.filter(call => call.type === 'get').length, 1, 'newer remote expires the pushed entry');
    assert.deepEqual(echo.progress, []);
    echo.localBooks.get('one').updated = 40;
    await echo.cloud.sync(); // Repopulate the echo cache before ending the session.
    await echo.cloud.signOut();
    echo.calls.length = 0;
    await echo.cloud.start();
    assert.equal(echo.calls.filter(call => call.type === 'get').length, 1, 'new session reads local state');
    console.log('PASS: 10 listed books count only 3 downloads; unknown tombstones and own echoes count zero; cursor advances, newer remote expires echoes; push excludes synced records.');
    const remote = Array.from({ length: 30 }, (_, i) => ({ ...row, id: `remote-${i}`, file: false }));
    for (const fail of [false, true]) {
        const f = fixture({ remote });
        f.intercept(async call => {
            if (call.url.hostname !== 'www.googleapis.com') return;
            await tick();
            if (fail && call.url.searchParams.get('alt') === 'media'
                && f.objects.get(call.url.pathname.split('/').at(-1))?.name === 'book-remote-0.json') return json({}, 400);
        });
        await f.cloud.start();
        assert.equal(f.peak, 4, 'JSON and cover requests stay within four workers');
        assert.equal(f.localBooks.size, fail ? 29 : 30);
        assert.equal(f.calls.filter(call => call.type === 'download' && call.name.startsWith('cover-')).length, fail ? 29 : 30);
        assert.ok(f.calls.some(call => call.type === 'refresh' && call.size >= 25 && call.size < 30), 'render before last merge (25-item batch)');
        assert.equal(f.statuses.at(-1), fail ? 'cloudUnsynced' : 'cloudSynced');
        assert.equal(f.values.has('leeslamp.cloud.pull.user-a'), !fail);
        assertProgress(f, 30);
    }
    const slow = fixture({ remote: remote.slice(0, 5).map(row => ({ ...row, cover: false })) });
    const lastDownload = deferred();
    slow.intercept(async call => {
        if (call.url.searchParams.get('alt') === 'media'
            && slow.objects.get(call.url.pathname.split('/').at(-1))?.name === 'book-remote-4.json') await lastDownload.promise;
    });
    const slowStart = slow.cloud.start();
    try {
        await new Promise(resolve => setTimeout(resolve, 1700));
        assert.equal(slow.localBooks.size, 4);
        assert.ok(slow.calls.some(call => call.type === 'refresh' && call.size === 4), '1500 ms timer renders fewer than 25 while last download is held');
    } finally { lastDownload.resolve(); await slowStart; }
    assertProgress(slow, 5);
    const cancelledPull = fixture({ remote });
    const heldPull = deferred(); let downloads = 0;
    cancelledPull.intercept(async call => {
        if (call.url.searchParams.get('alt') === 'media') { downloads++; await heldPull.promise; }
    });
    const cancelledStart = cancelledPull.cloud.start(); await settled();
    assert.equal(downloads, 4);
    const progressBeforeSignOut = cancelledPull.progress.length;
    const cancelledSignOut = cancelledPull.cloud.signOut(); heldPull.resolve();
    await Promise.all([cancelledStart, cancelledSignOut]);
    assert.equal(downloads, 4, 'queued workers cannot request after sign-out');
    assert.equal(cancelledPull.localBooks.size, 0, 'in-flight pulls cannot merge after sign-out');
    assert.equal(cancelledPull.progress.length, progressBeforeSignOut, 'no stale progress after sign-out');
    console.log('PASS: pull peak 4 (JSON + covers); 25-record batches and 1500 ms timer render before final merge; partial failure continues without cursor commit; counts finish at 30/30 and 5/5.');

    const records = Array.from({ length: 12 }, (_, i) => ({ ...book, id: `local-${i}`, source: { kind: 'blob' } }));
    for (const fail of [false, true]) {
        const f = fixture({ records });
        f.intercept(async call => {
            if (call.url.hostname !== 'www.googleapis.com') return;
            await tick();
            if (fail && call.url.searchParams.get('uploadType') === 'resumable' && call.method === 'POST'
                && JSON.parse(call.init.body).appProperties.leeslampId === 'local-0') return json({}, 400);
        });
        await f.cloud.start();
        assert.equal(f.peak, 4, 'upload and lookup requests stay within four workers');
        assert.equal([...f.localBooks.values()].filter(record => record.synced === 20).length, fail ? 11 : 12);
        assert.equal(f.calls.filter(call => call.type === 'folder').length, 1, 'parallel uploads share one folder');
        assert.equal(f.statuses.at(-1), fail ? 'cloudUnsynced' : 'cloudSynced');
        assertProgress(f, 12); // Each record counts once, including its cover and book file.
    }
    const phases = fixture({ remote: remote.slice(0, 5), records: records.slice(0, 2) });
    await phases.cloud.start();
    assertProgress(phases, 2);
    assert.ok(phases.progress.some(value => value.done === 5 && value.total === 5));
    assert.equal(phases.statuses.at(-1), 'cloudSynced');
    console.log('PASS: push peak 4 (resumable + covers + JSON), one folder, other records finish after failure; 12/12 counts; sequential phases finish at 5/5 then 2/2.');

    const expectedWarnings = warnings.length;
    for (const tokenStatus of [501, 404, 405, 'network']) {
        const f = fixture({ tokenStatus });
        assert.equal(await f.cloud.start(), false);
        window.dispatchEvent(new Event('online')); await settled();
        assert.equal(f.calls.filter(call => call.type === 'http').length, 1);
        assert.deepEqual(f.accounts, []); assert.deepEqual(f.statuses, []);
    }
    assert.equal(warnings.length, expectedWarnings, 'static-server bootstrap is silent');
    const signedOut = fixture({ tokenStatus: 401 });
    assert.equal(await signedOut.cloud.start(), true); assert.equal(signedOut.cloud.signedIn, false);
    assert.deepEqual(signedOut.accounts, [null]);
    signedOut.cloud.signIn();
    assert.equal(signedOut.calls.at(-1).url, '/api/auth/login?return=/en');
    assert.equal(signedOut.calls.find(call => call.type === 'url').url, '/en?keep=yes#anchor');
    console.log('PASS: silent 501/404/405/network bootstrap, 401 signed-out UI, redirect login and auth URL cleanup.');

    const local = { ...book, source: { kind: 'blob' } };
    const f = fixture({ records: [local, { ...book, id: 'older' }, { ...book, id: 'equal' }], remote: [
        { ...row, id: 'new', data: { ...row.data, ...hostile } },
        { ...row, id: 'older', updated: 19 }, { ...row, id: 'equal', updated: 20 }] });
    assert.equal(await f.cloud.start(), true); assert.equal(f.cloud.signedIn, true);
    assert.equal(f.statuses.at(-1), 'cloudSynced');
    assert.equal(f.calls.filter(call => call.type === 'download' && call.name.startsWith('book-')).length, 1);
    // Pull before push: the remote book-new.json download must precede the first push write.
    assert.ok(f.calls.findIndex(call => call.type === 'download' && call.name === 'book-new.json') < f.calls.findIndex(call => call.type === 'multipart'));
    assert.ok(f.calls.findIndex(call => call.type === 'initiate') < f.calls.findIndex(call => call.type === 'bytes'));
    assert.ok(f.calls.findIndex(call => call.type === 'bytes') < f.calls.findIndex(call => call.type === 'multipart' && call.metadata.name === 'book-one.json'));
    const written = f.calls.find(call => call.type === 'multipart' && call.metadata.name === 'book-one.json');
    assert.deepEqual(written.metadata.appProperties, { updated: '20', deleted: '0', file: '1', cover: '1' });
    assert.deepEqual(written.metadata.parents, ['appDataFolder']);
    assert.equal(f.localBooks.get('one').synced, 20); assert.ok(f.localBooks.get('one').driveFile);
    assert.equal(f.localBooks.get('new').cover.type, 'image/jpeg');
    assert.equal(f.localBooks.get('new').fileSkipped, undefined);
    assert.equal(f.localBooks.get('new').id, 'new');
    const downloaded = await f.cloud.download(f.localBooks.get('new'));
    assert.equal(f.files.get('new'), downloaded);
    f.localBooks.delete('one'); f.cloud.remove(local); await f.cloud.sync();
    assert.ok(f.calls.some(call => call.type === 'multipart' && call.metadata.appProperties?.deleted === '1'));
    assert.deepEqual(f.calls.filter(call => call.type === 'delete').map(call => call.name).sort(), ['cover-one.jpg', 'one.epub']);
    assert.deepEqual(JSON.parse(f.values.get('leeslamp.cloud.tombstones')), []);
    assert.ok(f.values.has('leeslamp.cloud.folder.user-a'));
    await f.cloud.signOut();
    assert.equal(f.values.has('leeslamp.cloud.pull.user-a'), false);
    assert.equal(f.values.has('leeslamp.cloud.folder.user-a'), false);
    assert.ok(f.localBooks.has('new')); assert.ok(f.files.has('new'));
    assert.ok(!JSON.stringify([...f.values]).includes('access-user'));
    console.log('PASS: list-driven downloads, pull before push, resumable ebooks, multipart JSON/cover, truthful flags, safe merge, tombstone cleanup and sign-out retention.');

    const many = fixture({ remote: Array.from({ length: 1001 }, (_, id) => ({ ...row, id: `remote-${id}`, file: false, cover: false })) });
    await many.cloud.start();
    assert.equal(many.localBooks.size, 1001);
    assert.deepEqual(many.calls.filter(call => call.type === 'list').map(call => call.url.searchParams.get('pageToken')), [null, '1000']);
    assert.equal(many.values.get('leeslamp.cloud.pull.user-a'), '2026-09-15T10:00:00.000Z');
    const escapedId = "fs:root:folder/a'\\b.epub";
    const linked = fixture({ records: [{ ...book, id: escapedId, cover: null }] });
    await linked.cloud.start();
    assert.equal(linked.calls.filter(call => call.type === 'initiate').length, 0);
    assert.ok(linked.calls.find(call => call.type === 'list' && call.query.includes("a\\'\\\\b")));
    await linked.cloud.upload(linked.localBooks.get(escapedId), new Blob(['linked']));
    assert.equal(linked.localBooks.get(escapedId).cloudFile, true);
    const large = fixture({ records: [{ ...local, cover: null, fileSkipped: true }] });
    const bigFile = new Blob(['bytes']); Object.defineProperty(bigFile, 'size', { value: 51 * 1024 * 1024 });
    large.files.set('one', bigFile);
    await large.cloud.start();
    assert.equal(large.localBooks.get('one').cloudFile, true); assert.deepEqual(large.toasts, []);
    console.log('PASS: pagination/cursor, linked files opt in, verbatim fs ids with query escaping and no size skip.');

    const failed = fixture({ records: [{ ...local, cover: null }] });
    failed.intercept(async call => call.url.searchParams.get('uploadType') === 'resumable' ? json({}, 400) : undefined);
    await failed.cloud.start();
    assert.equal(failed.localBooks.get('one').synced, 10);
    assert.equal(failed.localBooks.get('one').fileSkipped, undefined);
    assert.equal(failed.statuses.at(-1), 'cloudUnsynced'); assert.deepEqual(failed.toasts, []);
    failed.intercept(async () => undefined); await failed.cloud.sync();
    assert.equal(failed.localBooks.get('one').synced, 20);
    let pulls = 0; const hold = deferred();
    failed.intercept(async call => {
        if (call.url.searchParams.get('q')?.includes('modifiedTime')) { pulls++; if (pulls === 1) await hold.promise; }
    });
    const first = failed.cloud.sync(); await settled();
    assert.equal(first, failed.cloud.sync()); failed.cloud.sync(); hold.resolve(); await first;
    assert.equal(pulls, 2);
    failed.intercept(async () => undefined);
    for (const event of ['focus', 'online', 'visibilitychange']) {
        const before = failed.calls.filter(call => call.type === 'list').length;
        (event === 'visibilitychange' ? document : window).dispatchEvent(new Event(event)); await settled();
        assert.equal(failed.calls.filter(call => call.type === 'list').length, before + 1);
    }
    failed.cloud.changed(); failed.cloud.changed();
    const before = failed.calls.filter(call => call.type === 'list').length;
    await new Promise(resolve => setTimeout(resolve, 2100)); await settled();
    assert.equal(failed.calls.filter(call => call.type === 'list').length, before + 1);
    failed.intercept(async call => call.url.hostname === 'www.googleapis.com' ? json({}, 400) : undefined);
    await failed.cloud.sync(true); assert.equal(failed.toasts.at(-1), 'cloudFailed');
    console.log('PASS: upload failure retries, status/error policy, single flight/rerun, two-second debounce, focus/online/visibility triggers.');

    for (const status of [401, 429, 500, 403]) {
        const retry = fixture(); let attempts = 0;
        retry.intercept(async call => {
            if (call.url.hostname !== 'www.googleapis.com') return;
            attempts++;
            if (attempts < (status === 401 ? 2 : 3)) return json({ error: { errors: [{ reason: 'userRateLimitExceeded' }] } }, status);
        });
        await retry.cloud.start();
        assert.equal(attempts, status === 401 ? 2 : 3); assert.equal(retry.statuses.at(-1), 'cloudSynced');
        assert.equal(retry.calls.filter(call => call.url?.pathname === '/api/auth/token').length, status === 401 ? 2 : 1);
    }
    for (const [status, reason, expected] of [[401, '', 2], [403, 'forbidden', 1], [429, '', 3], [503, '', 3]]) {
        const retry = fixture(); let attempts = 0;
        retry.intercept(async call => {
            if (call.url.hostname === 'www.googleapis.com') { attempts++; return json({ error: { errors: [{ reason }] } }, status); }
        });
        await retry.cloud.start(); assert.equal(attempts, expected); assert.equal(retry.statuses.at(-1), 'cloudUnsynced');
    }
    console.log('PASS: one 401 refresh/retry, bounded exponential 403-rate/429/5xx retries, no retry on other 403.');

    const cancelled = fixture({ records: [book], previous: 'user-b', confirm: false });
    await cancelled.cloud.start(); await settled();
    assert.equal(cancelled.confirmCount, 1); assert.equal(cancelled.cloud.signedIn, false);
    assert.ok(cancelled.localBooks.has('one'));
    assert.equal(cancelled.calls.filter(call => ['list', 'multipart', 'wipe'].includes(call.type)).length, 0);
    assert.ok(cancelled.calls.some(call => call.url?.pathname === '/api/auth/logout'));
    const accepted = fixture({ records: [book], previous: 'user-b' });
    await accepted.cloud.start();
    assert.equal(accepted.confirmCount, 1); assert.equal(accepted.localBooks.size, 0);
    assert.ok(accepted.calls.findIndex(call => call.type === 'wipe') < accepted.calls.findIndex(call => call.type === 'list'));
    const same = fixture({ records: [book], previous: 'user-a', confirm: false });
    await same.cloud.start(); assert.equal(same.confirmCount, 0);
    const pending = fixture({ remote: [row] });
    pending.values.set('leeslamp.cloud.tombstones', JSON.stringify([{ sub: 'user-a', id: 'one', updated: 40 }]));
    await pending.cloud.start();
    assert.equal(pending.localBooks.size, 0); assert.equal(pending.calls.filter(call => call.type === 'download').length, 0);
    assert.deepEqual(pending.progress, [], 'pending local deletion excludes remote download from the count');
    await pending.cloud.signOut(); pending.cloud.remove({ id: 'offline' });
    assert.equal(JSON.parse(pending.values.get('leeslamp.cloud.tombstones'))[0].sub, 'user-a');
    await pending.cloud.start(); assert.deepEqual(JSON.parse(pending.values.get('leeslamp.cloud.tombstones')), []);
    console.log('PASS: different-account cancel/confirm, same-account continuity, offline deletion queue and no tombstone resurrection.');

    const switching = fixture({ records: [{ ...local, cover: null }] });
    const held = deferred(); let uploading = false;
    switching.intercept(async call => { if (call.method === 'PUT') { uploading = true; await held.promise; } });
    const starting = switching.cloud.start(); await settled(); assert.equal(uploading, true);
    const signingOut = switching.cloud.signOut(); held.resolve(); await Promise.all([starting, signingOut]);
    assert.equal(switching.calls.filter(call => call.type === 'multipart').length, 0);
    assert.equal(switching.localBooks.get('one').driveFile, undefined);
    assert.ok(switching.files.has('one'));
    switching.setUser('user-b'); await switching.cloud.start();
    assert.equal(switching.confirmCount, 1); assert.equal(switching.localBooks.size, 0);

    const missing = fixture({ remote: [row] }); await missing.cloud.start();
    missing.localBooks.get('one').driveFile = 'missing';
    await missing.cloud.download(missing.localBooks.get('one'));
    assert.notEqual(missing.localBooks.get('one').driveFile, 'missing');
    missing.localBooks.get('one').driveJson = 'missing'; missing.localBooks.get('one').updated = 50;
    await missing.cloud.sync();
    assert.equal([...missing.objects.values()].filter(file => file.name === 'book-one.json').length, 1);
    assert.equal(missing.localBooks.get('one').synced, 50);

    const expired = fixture(); let tokenRequests = 0;
    expired.intercept(async call => {
        if (call.url.pathname === '/api/auth/token' && ++tokenRequests === 1) {
            return json({ accessToken: 'access-user-a', expiresIn: 30, user: { id: 'user-a' } });
        }
    });
    await expired.cloud.start();
    assert.equal(tokenRequests, 2, 'refresh before expiry');
    assert.equal(expired.statuses.at(-1), 'cloudSynced');

    const removed = fixture({ records: [{ ...local, synced: 20 }], remote: [{ ...row, deleted: true }] });
    await removed.cloud.start();
    assert.equal(removed.localBooks.has('one'), false); assert.equal(removed.files.has('one'), false);
    assert.equal(removed.calls.filter(call => call.type === 'download').length, 0, 'tombstone needs no content download');
    const newer = fixture({ records: [{ ...local, cover: null, updated: 40 }], remote: [{ ...row, deleted: true }] });
    await newer.cloud.start(); assert.equal(newer.localBooks.get('one').updated, 40);

    const failedPull = fixture({ remote: [{ ...row, cover: false }] });
    failedPull.intercept(async call => call.url.searchParams.get('alt') === 'media' ? json({}, 400) : undefined);
    await failedPull.cloud.start();
    assert.equal(failedPull.values.has('leeslamp.cloud.pull.user-a'), false, 'partial pull never commits its cursor');
    failedPull.intercept(async () => undefined); await failedPull.cloud.sync();
    assert.ok(failedPull.localBooks.has('one'));

    const authRetry = fixture({ tokenStatus: 502 }); await authRetry.cloud.start();
    assert.equal(authRetry.cloud.signedIn, false);
    authRetry.setTokenStatus(200); window.dispatchEvent(new Event('online')); await settled();
    assert.equal(authRetry.cloud.signedIn, true); assert.equal(authRetry.statuses.at(-1), 'cloudSynced');
    assert.ok(warnings.every(args => args.length === 1 && args[0] === 'Cloud sync unavailable'));
    console.log('PASS: epoch fencing, account change, stale ids, token expiry, remote deletion, partial-pull cursor, auth recovery and private warnings.');
} finally { console.warn = originalWarn; globalThis.fetch = originalFetch; }

// Serverless handler exercised directly with request/response and Google substitutes.
const { default: auth } = await import('../api/auth/[action].js');
const { createHash, createDecipheriv } = await import('node:crypto');
const envNames = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'COOKIE_SECRET'];
const savedEnv = Object.fromEntries(envNames.map(key => [key, process.env[key]]));
const serverCalls = [];
const idToken = user => `header.${Buffer.from(JSON.stringify(user)).toString('base64url')}.signature`;
const cookieValue = (response, name) => [].concat(response.headers['Set-Cookie'] || []).find(value => value.startsWith(name + '='))?.split(';')[0];
async function request(action, { method = ['login', 'callback'].includes(action) ? 'GET' : 'POST', query = {}, cookie = '' } = {}) {
    const response = { headers: {}, statusCode: 200, body: undefined,
        setHeader(key, value) { this.headers[key] = value; }, status(code) { this.statusCode = code; return this; },
        json(body) { this.body = body; return this; }, end() { return this; } };
    await auth({ method, query: { action, ...query }, headers: { host: 'leeslamp.vercel.app', cookie } }, response);
    assert.equal(response.headers['Cache-Control'], 'no-store');
    assert.ok(!Object.keys(response.headers).some(key => key.toLowerCase().startsWith('access-control-')));
    assert.ok(!JSON.stringify(response.body || '').includes('refresh-secret'));
    return response;
}
try {
    globalThis.fetch = async () => { throw new Error('Unexpected network'); };
    for (const key of envNames) delete process.env[key];
    for (const action of ['login', 'callback', 'token', 'logout']) {
        const response = await request(action); assert.equal(response.statusCode, 501);
        assert.deepEqual(response.body, { error: 'Cloud unavailable' });
    }
    Object.assign(process.env, { GOOGLE_CLIENT_ID: 'client-id', GOOGLE_CLIENT_SECRET: 'client-secret', COOKIE_SECRET: 'a-secret-at-least-thirty-two-characters-long' });
    for (const invalid of ['//evil.example', 'https://evil.example', '/en/', '/?next=evil', ['/']]) {
        assert.equal((await request('login', { query: { return: invalid } })).statusCode, 400);
    }
    const login = await request('login', { query: { return: '/en' } });
    assert.equal(login.statusCode, 302);
    const url = new URL(login.headers.Location);
    assert.equal(url.origin + url.pathname, 'https://accounts.google.com/o/oauth2/v2/auth');
    assert.equal(url.searchParams.get('scope'), 'openid email profile https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata');
    assert.equal(url.searchParams.get('access_type'), 'offline');
    assert.equal(url.searchParams.get('response_type'), 'code');
    assert.equal(url.searchParams.get('include_granted_scopes'), 'true');
    assert.equal(url.searchParams.get('redirect_uri'), 'https://leeslamp.vercel.app/api/auth/callback');
    const state = url.searchParams.get('state'), stateCookie = cookieValue(login, 'leeslamp_state');
    assert.ok(state); assert.ok(stateCookie);
    assert.match(login.headers['Set-Cookie'], /HttpOnly; Secure; SameSite=Lax; Path=\/api\/auth; Max-Age=600/);
    for (const wrong of ['wrong', 'x'.repeat(state.length), undefined]) {
        assert.equal((await request('callback', { query: { code: 'code', state: wrong }, cookie: stateCookie })).statusCode, 400);
    }
    assert.equal((await request('callback', { query: { code: 'code', state } })).statusCode, 400);
    const cancelled = await request('callback', { query: { error: 'access_denied', state }, cookie: stateCookie });
    assert.equal(cancelled.headers.Location, '/en?auth=cancelled');
    assert.match(cancelled.headers['Set-Cookie'], /Max-Age=0/);
    assert.equal((await request('token')).statusCode, 401);
    assert.equal((await request('token', { method: 'GET' })).statusCode, 405);
    assert.equal((await request('logout', { method: 'GET' })).statusCode, 405);

    let mode = 'success';
    globalThis.fetch = async (url, init) => {
        serverCalls.push({ url, init });
        assert.equal(url, 'https://oauth2.googleapis.com/token');
        assert.equal(init.method, 'POST');
        const params = new URLSearchParams(init.body);
        assert.equal(params.get('client_id'), 'client-id');
        assert.equal(params.get('client_secret'), 'client-secret');
        if (mode === 'invalid_grant') return json({ error: 'invalid_grant' }, 400);
        if (mode === 'failure') return json({ error: 'upstream secret' }, 503);
        if (params.get('grant_type') === 'authorization_code') {
            assert.equal(params.get('redirect_uri'), 'https://leeslamp.vercel.app/api/auth/callback');
            return json(mode === 'no_refresh' ? {} : { refresh_token: 'refresh-secret' });
        }
        assert.equal(params.get('grant_type'), 'refresh_token');
        assert.equal(params.get('refresh_token'), 'refresh-secret');
        return json({ access_token: 'access-secret', expires_in: 3600,
            id_token: idToken({ sub: 'google-sub', email: 'reader@example.test', name: 'Reader', picture: 'https://example.test/avatar.jpg' }) });
    };
    const callback = () => request('callback', { query: { code: 'code', state }, cookie: stateCookie });
    const complete = await callback();
    assert.equal(complete.statusCode, 302); assert.equal(complete.headers.Location, '/en');
    const refreshCookie = cookieValue(complete, 'leeslamp_rt');
    assert.ok(refreshCookie.startsWith('leeslamp_rt=v1.'));
    assert.ok(!refreshCookie.includes('refresh-secret'));
    assert.match(complete.headers['Set-Cookie'][1], /HttpOnly; Secure; SameSite=Lax; Path=\/api\/auth; Max-Age=34560000/);
    const sealed = Buffer.from(refreshCookie.split('v1.')[1], 'base64url');
    const decipher = createDecipheriv('aes-256-gcm', createHash('sha256').update(process.env.COOKIE_SECRET).digest(), sealed.subarray(0, 12));
    decipher.setAuthTag(sealed.subarray(12, 28));
    assert.equal(Buffer.concat([decipher.update(sealed.subarray(28)), decipher.final()]).toString(), 'refresh-secret');
    assert.notEqual(cookieValue(await callback(), 'leeslamp_rt'), refreshCookie, 'fresh random IV for every cookie');
    const token = await request('token', { cookie: refreshCookie });
    assert.equal(token.statusCode, 200);
    assert.deepEqual(token.body, { accessToken: 'access-secret', expiresIn: 3600,
        user: { id: 'google-sub', email: 'reader@example.test', name: 'Reader', picture: 'https://example.test/avatar.jpg' } });
    const corrupted = Buffer.from(sealed); corrupted[15] ^= 1;
    const beforeTamper = serverCalls.length;
    assert.equal((await request('token', { cookie: 'leeslamp_rt=v1.' + corrupted.toString('base64url') })).statusCode, 401);
    assert.equal(serverCalls.length, beforeTamper, 'tampered cookie never reaches Google');

    mode = 'no_refresh';
    const consent = await callback(), consentURL = new URL(consent.headers.Location);
    assert.equal(consentURL.searchParams.get('prompt'), 'consent');
    assert.notEqual(consentURL.searchParams.get('state'), state);
    const noLoop = await request('callback', { query: { code: 'code', state: consentURL.searchParams.get('state') }, cookie: cookieValue(consent, 'leeslamp_state') });
    assert.equal(noLoop.headers.Location, '/en?auth=cancelled');
    mode = 'failure';
    assert.equal((await request('token', { cookie: refreshCookie })).statusCode, 502);
    assert.equal((await callback()).statusCode, 502);
    mode = 'invalid_grant';
    const revoked = await request('token', { cookie: refreshCookie });
    assert.equal(revoked.statusCode, 401); assert.match(revoked.headers['Set-Cookie'], /Max-Age=0/);
    const logout = await request('logout', { cookie: refreshCookie });
    assert.equal(logout.statusCode, 204); assert.match(logout.headers['Set-Cookie'], /Max-Age=0/);
    console.log('PASS: auth env/method/return guards, exact OAuth scopes, state CSRF, cancel/consent loop, AES-GCM cookie roundtrip/tampering, token whitelist, invalid_grant, upstream failures and cookie-only logout.');
} finally {
    for (const key of envNames) { if (savedEnv[key] === undefined) delete process.env[key]; else process.env[key] = savedEnv[key]; }
    globalThis.fetch = originalFetch;
}
console.log('PASS: all cloud tests (Node built-ins only; no network or browser).');
