// Only these fields cross the account boundary. Device flags and blobs never do.
const textFields = ['category', 'title', 'author', 'name', 'ext', 'kind'];
const numberFields = ['fraction', 'opened', 'size', 'lastModified', 'added'];
const booleanFields = ['hidden', 'finished', 'categoryManual', 'autoCategorized', 'metadataReady'];
export function recordData(record = {}) {
    if (!record || typeof record !== 'object') throw new Error('Invalid book data');
    const data = {};
    for (const key of textFields) if (typeof record[key] === 'string') data[key] = record[key];
    for (const key of numberFields) if (record[key] === null || Number.isFinite(record[key])) data[key] = record[key];
    for (const key of booleanFields) if (typeof record[key] === 'boolean') data[key] = record[key];
    if (record.loc === null || typeof record.loc === 'string' || Number.isFinite(record.loc)) data.loc = record.loc;
    if (Array.isArray(record.subjects)) data.subjects = record.subjects.filter(value => typeof value === 'string');
    if (record.source?.kind === 'blob') data.source = { kind: 'blob' };
    if (record.source?.kind === 'fs' && typeof record.source.root === 'string' && typeof record.source.path === 'string') {
        data.source = { kind: 'fs', root: record.source.root, path: record.source.path };
    }
    return data;
}
export const planPush = records => records.filter(record => record.updated > (record.synced ?? 0));
// undefined means ignore, null means delete, an object means insert/replace.
export function mergeRow(local, row) {
    if (typeof row?.id !== 'string' || !row.id || !Number.isFinite(row.updated)) throw new Error('Invalid cloud row');
    if (row.deleted === true) return local && (local.updated ?? 0) <= row.updated ? null : undefined;
    if (local && row.updated <= (local.updated ?? 0)) return undefined;
    const data = recordData(row.data);
    const record = { title: '', author: '', category: '', name: '', ext: '', kind: 'text', fraction: 0,
        source: { kind: 'blob' }, ...local, ...data, id: row.id,
        updated: row.updated, synced: row.updated, cloudFile: row.file === true,
        fileSynced: row.file === true, coverSynced: row.cover === true };
    if (local) { record.source = local.source; record.cover = local.cover; }
    return record;
}

export function createCloud(config, local, ui) {
    if (!config?.url || !config?.anonKey || typeof window === 'undefined') return null;
    const client = window.supabase.createClient(config.url, config.anonKey, {
        auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true },
    });
    const storage = client.storage.from('books');
    const queueKey = 'leeslamp.cloud.tombstones', userKey = 'leeslamp.cloud.user';
    let session = null, ready = false, epoch = 0, running = null, again = false, notifyFailure = false, timer;
    let authWork = Promise.resolve();
    let sessionFailed = false, recovering = null;
    const uploads = new Map();
    const cursorKey = uid => `leeslamp.cloud.pull.${uid}`;
    const valid = (uid, generation) => ready && session?.user.id === uid && epoch === generation;
    const check = (uid, generation) => { if (!valid(uid, generation)) throw new Error('Account changed'); };
    const result = async promise => {
        const { data, error } = await promise;
        if (error) throw new Error('Cloud request failed'); // Never log provider payloads or tokens.
        return data;
    };
    const queue = () => {
        const value = JSON.parse(localStorage.getItem(queueKey) || '[]');
        if (!Array.isArray(value)) throw new Error('Invalid deletion queue');
        return value;
    };
    function failure(userInitiated = false) {
        ui.status(navigator.onLine === false ? 'cloudOffline' : 'cloudUnsynced');
        console.warn('Cloud sync unavailable');
        if (userInitiated) ui.toast('cloudFailed');
    }
    // uid is always captured from the current session, never from row.data or source.
    function path(uid, generation, id, cover = false) {
        check(uid, generation);
        if (typeof id !== 'string' || !id || id.split('/').some(part => !part || part === '.' || part === '..') || /[\\\u0000-\u001f]/.test(id)) throw new Error('Invalid book id');
        return `${uid}/${id}${cover ? '.jpg' : ''}`;
    }
    async function pull(uid, generation) {
        const cursor = localStorage.getItem(cursorKey(uid)) || '1970-01-01T00:00:00.000Z';
        let latest = cursor;
        for (let offset = 0; ; offset += 1000) {
            check(uid, generation);
            const rows = await result(client.from('books').select('*').gt('updated_at', cursor).order('updated_at').range(offset, offset + 999));
            check(uid, generation);
            for (const row of rows) {
                if (row.user_id !== uid || typeof row.updated_at !== 'string' || !Number.isFinite(Date.parse(row.updated_at))) throw new Error('Invalid cloud row');
                const pending = queue().find(item => item.uid === uid && item.id === row.id);
                if (!pending || pending.updated < row.updated) {
                    let cover;
                    if (!await local.get(row.id) && row.deleted !== true && row.cover === true) {
                        cover = await result(storage.download(path(uid, generation, row.id, true)));
                    }
                    check(uid, generation);
                    await local.change(row.id, current => {
                        if (!valid(uid, generation)) return undefined;
                        const merged = mergeRow(current, row);
                        if (merged && !current && cover) merged.cover = cover;
                        return merged;
                    });
                }
                if (row.updated_at > latest) latest = row.updated_at;
            }
            if (rows.length < 1000) break;
        }
        check(uid, generation);
        localStorage.setItem(cursorKey(uid), latest);
    }
    async function drain(uid, generation) {
        for (const item of queue().filter(item => item.uid === uid)) {
            check(uid, generation);
            const current = await local.get(item.id);
            if (!current || (current.updated ?? 0) <= item.updated) {
                const filePath = path(uid, generation, item.id), coverPath = path(uid, generation, item.id, true);
                await result(client.from('books').upsert([{ user_id: uid, id: item.id, data: {}, updated: item.updated, deleted: true, file: false, cover: false }]));
                check(uid, generation);
                await result(storage.remove([filePath, coverPath]));
            }
            check(uid, generation);
            localStorage.setItem(queueKey, JSON.stringify(queue().filter(value => !(value.uid === uid && value.id === item.id && value.updated === item.updated))));
        }
    }
    async function push(uid, generation) {
        const records = planPush(await local.all());
        for (let offset = 0; offset < records.length; offset += 100) {
            const batch = records.slice(offset, offset + 100), rows = [];
            for (const record of batch) {
                check(uid, generation);
                const flags = {};
                if (!record.fileSynced && !record.fileSkipped && (record.source?.kind === 'blob' || uploads.has(record.id))) {
                    const file = uploads.get(record.id) || await local.file(record.id);
                    if (file) {
                        if (file.size > 50 * 1024 * 1024) {
                            flags.fileSkipped = true;
                            await local.change(record.id, current => current && valid(uid, generation) ? { ...current, fileSkipped: true } : undefined);
                            check(uid, generation);
                            ui.toast('cloudFileTooLarge', { name: record.name });
                        } else {
                            await result(storage.upload(path(uid, generation, record.id), file, { upsert: true, contentType: file.type || 'application/octet-stream' }));
                            flags.fileSynced = flags.cloudFile = true;
                        }
                    }
                }
                if (record.cover && !record.coverSynced) {
                    await result(storage.upload(path(uid, generation, record.id, true), record.cover, { upsert: true, contentType: 'image/jpeg' }));
                    flags.coverSynced = true;
                }
                check(uid, generation);
                await local.change(record.id, current => current && valid(uid, generation) ? { ...current, ...flags } : undefined);
                Object.assign(record, flags);
                rows.push({ user_id: uid, id: record.id, data: recordData(record), updated: record.updated,
                    deleted: false, file: record.cloudFile === true || record.fileSynced === true, cover: record.coverSynced === true });
            }
            check(uid, generation);
            await result(client.from('books').upsert(rows));
            check(uid, generation);
            for (const record of batch) {
                await local.change(record.id, current => current && valid(uid, generation) ? { ...current, synced: record.updated } : undefined);
                if (record.fileSynced || record.fileSkipped) uploads.delete(record.id);
            }
        }
    }
    function sync(userInitiated = false) {
        clearTimeout(timer);
        if (!ready) return sessionFailed ? restoreSession(userInitiated) : Promise.resolve();
        notifyFailure ||= userInitiated;
        if (running) { again = true; return running; }
        running = (async () => {
            do {
                again = false;
                const uid = session.user.id, generation = epoch;
                ui.status('cloudSyncing');
                try {
                    await local.flush();
                    check(uid, generation);
                    await pull(uid, generation);
                    await drain(uid, generation);
                    // ponytail: small race between pull and push; add per-field merge if it ever bites.
                    await push(uid, generation);
                    check(uid, generation);
                    ui.status('cloudSynced');
                } catch {
                    if (valid(uid, generation)) failure(notifyFailure);
                } finally { await local.refresh(); }
            } while (again && ready);
        })().catch(() => failure(notifyFailure)).finally(() => { running = null; notifyFailure = false; });
        return running;
    }
    function changed() {
        if (!ready) return;
        if (running) { again = true; return; }
        ui.status('cloudUnsynced');
        clearTimeout(timer); timer = setTimeout(() => void sync(), 2000);
    }
    async function acceptSession(next, generation) {
        if (running) await running;
        if (generation !== epoch) return;
        if (!next) { ui.account(null); ui.status('cloudUnsynced'); return; }
        const uid = next.user.id, previous = localStorage.getItem(userKey);
        if (previous && previous !== uid) {
            if ((await local.all()).length && !await ui.confirm()) {
                await result(client.auth.signOut());
                if (epoch === generation) receive(null);
                return;
            }
            if (generation !== epoch) return;
            await local.wipe();
            localStorage.removeItem(queueKey);
            localStorage.removeItem(cursorKey(uid));
        }
        if (generation !== epoch) return;
        // Books created before cloud support need one initial push as well.
        for (const record of await local.all()) if (!record.updated) {
            await local.change(record.id, current => current && epoch === generation ? { ...current, updated: Date.now() } : undefined);
        }
        if (generation !== epoch) return;
        localStorage.setItem(userKey, uid);
        ready = true;
        ui.account(next.user);
        await sync();
    }
    function receive(next) {
        if (ready && next?.user.id === session?.user.id) { session = next; ui.account(next.user); return; }
        const previous = session?.user.id;
        session = next; ready = false; sessionFailed = false; again = false; clearTimeout(timer);
        const generation = ++epoch;
        uploads.clear();
        if (previous && !next) {
            try { localStorage.removeItem(cursorKey(previous)); } catch { failure(); }
        }
        // Auth callbacks must return synchronously; SDK auth calls otherwise deadlock.
        authWork = authWork.then(() => acceptSession(next, generation)).catch(() => { ready = false; sessionFailed = true; failure(); });
    }
    function restoreSession(userInitiated = false) {
        if (recovering) return recovering;
        const initialEpoch = epoch;
        recovering = (async () => {
            try {
                const data = await result(client.auth.getSession());
                if (epoch === initialEpoch) receive(data.session);
            } catch {
                if (epoch === initialEpoch) { sessionFailed = true; failure(userInitiated); }
            }
        })().finally(() => { recovering = null; });
        return recovering;
    }
    async function start() {
        client.auth.onAuthStateChange((_event, next) => receive(next));
        try { await restoreSession(); }
        finally {
            const url = new URL(location.href);
            for (const key of ['code', 'state', 'error', 'error_description']) url.searchParams.delete(key);
            history.replaceState(history.state, '', `${url.pathname}${url.search}${url.hash}`);
        }
        document.addEventListener('visibilitychange', () => { if (!document.hidden) void sync(); });
        for (const event of ['focus', 'online']) window.addEventListener(event, () => void sync());
    }
    return {
        start, changed, sync,
        get signedIn() { return ready; },
        async signIn(provider) {
            try {
                await result(client.auth.signInWithOAuth({ provider, options: { redirectTo: `${location.origin}${location.pathname === '/en' ? '/en' : '/'}` } }));
                return true;
            } catch { failure(true); return false; }
        },
        async signOut() {
            const next = session;
            ready = false; ++epoch; again = false; clearTimeout(timer);
            if (running) await running;
            try { await result(client.auth.signOut()); receive(null); }
            catch { receive(next); failure(true); }
        },
        remove(record) {
            try {
                const uid = ready ? session.user.id : localStorage.getItem(userKey);
                if (!uid) return;
                const items = queue().filter(item => !(item.uid === uid && item.id === record.id));
                items.push({ uid, id: record.id, updated: Date.now() });
                localStorage.setItem(queueKey, JSON.stringify(items));
                changed();
            } catch { failure(true); }
        },
        async upload(record, file) {
            if (!ready || !file) return;
            const uid = session.user.id, generation = epoch;
            uploads.set(record.id, file);
            await local.change(record.id, current => current && valid(uid, generation) ? { ...current, updated: Date.now() } : undefined);
            check(uid, generation);
            await sync(true);
        },
        async download(record) {
            const uid = session?.user.id, generation = epoch;
            const blob = await result(storage.download(path(uid, generation, record.id)));
            check(uid, generation);
            await local.saveFile(record.id, blob, () => valid(uid, generation));
            check(uid, generation);
            return blob;
        },
    };
}
