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
export async function pool(items, limit, fn) {
    let next = 0;
    const errors = [];
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (next < items.length) {
            const item = items[next++];
            try { await fn(item); } catch (error) { errors.push(error); }
        }
    }));
    if (errors.length) throw new AggregateError(errors, 'Cloud items failed');
}
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

export function createCloud(local, ui) {
    const queueKey = 'leeslamp.cloud.tombstones', userKey = 'leeslamp.cloud.user';
    let session = null, ready = false, epoch = 0, running = null, again = false, notifyFailure = false, timer;
    let authWork = Promise.resolve(), refreshing = null, folderWork = null;
    let lastProgress = -Infinity;
    let sessionFailed = false, recovering = null, enabled = true;
    const uploads = new Map();
    const cursorKey = uid => `leeslamp.cloud.pull.${uid}`;
    const folderKey = uid => `leeslamp.cloud.folder.${uid}`;
    const valid = (uid, generation) => ready && session?.user.id === uid && epoch === generation;
    const check = (uid, generation) => { if (!valid(uid, generation)) throw new Error('Account changed'); };
    function progress(uid, generation, total) {
        let done = 0, shown = -1;
        const update = (count = 0) => {
            done += count;
            if (total && valid(uid, generation) && Date.now() - lastProgress >= 100) {
                ui.status('cloudSyncing', { done, total });
                lastProgress = Date.now(); shown = done;
            }
        };
        update();
        return { update, async finish() {
            if (!total || shown === done) return;
            while (Date.now() - lastProgress < 100) {
                await new Promise(resolve => setTimeout(resolve, 100 - (Date.now() - lastProgress)));
            }
            check(uid, generation);
            update();
        } };
    }
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
    async function token() {
        const response = await fetch('/api/auth/token', { method: 'POST', credentials: 'same-origin', cache: 'no-store' });
        if (response.status === 401) return null;
        if (!response.ok) throw Object.assign(new Error('Authentication unavailable'), { status: response.status });
        const data = await response.json();
        if (!data.accessToken || typeof data.user?.id !== 'string' || !Number.isFinite(data.expiresIn)) throw new Error('Invalid session');
        return { ...data, expires: Date.now() + data.expiresIn * 1000 };
    }
    async function refresh(uid, generation) {
        if (!refreshing) refreshing = token().finally(() => { refreshing = null; });
        const next = await refreshing;
        check(uid, generation);
        if (!next || next.user.id !== uid) { receive(next); throw new Error('Account changed'); }
        session = next;
    }
    async function drive(path, init = {}, uid = session?.user.id, generation = epoch) {
        const { format = 'json', ...options } = init;
        const url = new URL(path, 'https://www.googleapis.com');
        if (url.origin !== 'https://www.googleapis.com' || !/^\/(upload\/)?drive\/v3\/files(?:\/|$)/.test(url.pathname)) throw new Error('Invalid Drive URL');
        check(uid, generation);
        if (session.expires - Date.now() < 60000) await refresh(uid, generation);
        let refreshed = false, attempts = 0;
        for (;;) {
            check(uid, generation);
            const response = await fetch(url.href, { ...options, headers: { ...options.headers, Authorization: `Bearer ${session.accessToken}` } });
            check(uid, generation);
            if (response.status === 401 && !refreshed) {
                refreshed = true; await refresh(uid, generation); continue;
            }
            let limited = response.status === 429 || response.status >= 500;
            if (response.status === 403) {
                const error = await response.clone().json().catch(() => ({}));
                limited = error.error?.errors?.some(item => ['rateLimitExceeded', 'userRateLimitExceeded'].includes(item.reason));
            }
            if (limited && ++attempts < 3) { await new Promise(resolve => setTimeout(resolve, 250 * 2 ** (attempts - 1))); continue; }
            if (!response.ok) throw Object.assign(new Error('Drive request failed'), { status: response.status });
            if (format === 'raw') return response;
            if (format === 'blob') return response.blob();
            return response.status === 204 ? null : response.json();
        }
    }
    const literal = value => `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
    const name = (id, cover = false) => {
        if (typeof id !== 'string' || !id) throw new Error('Invalid book id');
        return `${cover ? 'cover-' : 'book-'}${id}${cover ? '.jpg' : '.json'}`;
    };
    const filePath = id => `/drive/v3/files/${encodeURIComponent(id)}`;
    async function list(uid, generation, query, hidden = true) {
        const files = [];
        let pageToken;
        do {
            const params = new URLSearchParams({ q: `trashed = false and (${query})`,
                fields: 'nextPageToken,files(id,name,modifiedTime,appProperties)', pageSize: '1000' });
            if (hidden) params.set('spaces', 'appDataFolder');
            if (pageToken) params.set('pageToken', pageToken);
            const page = await drive(`/drive/v3/files?${params}`, {}, uid, generation);
            files.push(...page.files); pageToken = page.nextPageToken;
        } while (pageToken);
        return files;
    }
    const findName = async (uid, generation, value) => (await list(uid, generation, `name = ${literal(value)}`))[0]?.id;
    const findFile = async (uid, generation, id) => (await list(uid, generation,
        `appProperties has { key='leeslampId' and value=${literal(id)} }`, false))[0]?.id;
    async function multipart(uid, generation, metadata, content, id) {
        const boundary = `leeslamp-${crypto.randomUUID()}`;
        const body = new Blob([`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
            JSON.stringify(metadata), `\r\n--${boundary}\r\nContent-Type: ${content.type}\r\n\r\n`, content, `\r\n--${boundary}--\r\n`]);
        return drive(`/upload/drive/v3/files${id ? '/' + encodeURIComponent(id) : ''}?uploadType=multipart`, {
            method: id ? 'PATCH' : 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body,
        }, uid, generation);
    }
    async function writeNamed(uid, generation, value, content, properties, cached) {
        let id = cached || await findName(uid, generation, value);
        const write = () => multipart(uid, generation, { name: value, mimeType: content.type,
            ...(id ? {} : { parents: ['appDataFolder'] }), ...(properties ? { appProperties: properties } : {}) }, content, id);
        try { return (await write()).id; }
        catch (error) {
            if (error.status !== 404) throw error;
            id = await findName(uid, generation, value);
            return (await write()).id;
        }
    }
    async function folder(uid, generation) {
        const cached = localStorage.getItem(folderKey(uid));
        if (cached) return cached;
        // Parallel uploads share folder creation within the current sync.
        if (folderWork) return folderWork;
        folderWork = (async () => {
            let id = (await list(uid, generation, "name = 'Leeslamp' and mimeType = 'application/vnd.google-apps.folder' and appProperties has { key='leeslamp' and value='library' }", false))[0]?.id;
            if (!id) id = (await drive('/drive/v3/files', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Leeslamp', mimeType: 'application/vnd.google-apps.folder', appProperties: { leeslamp: 'library' } }) }, uid, generation)).id;
            check(uid, generation);
            localStorage.setItem(folderKey(uid), id);
            return id;
        })().finally(() => { folderWork = null; });
        return folderWork;
    }
    async function uploadFile(uid, generation, record, file) {
        const existing = record.driveFile || await findFile(uid, generation, record.id);
        if (existing) {
            try { await drive(filePath(existing), {}, uid, generation); return existing; }
            catch (error) { if (error.status !== 404) throw error; }
            const found = await findFile(uid, generation, record.id);
            if (found) return found;
        }
        const parent = await folder(uid, generation), type = file.type || 'application/octet-stream';
        const response = await drive('/upload/drive/v3/files?uploadType=resumable', { method: 'POST', format: 'raw',
            headers: { 'Content-Type': 'application/json', 'X-Upload-Content-Type': type },
            body: JSON.stringify({ name: record.name || record.id, parents: [parent], appProperties: { leeslampId: record.id }, mimeType: type }) }, uid, generation);
        const location = response.headers.get('Location');
        if (!location) throw new Error('Missing upload URL');
        return (await drive(location, { method: 'PUT', headers: { 'Content-Type': type }, body: file }, uid, generation)).id;
    }
    async function pull(uid, generation) {
        const cursor = localStorage.getItem(cursorKey(uid)) || '1970-01-01T00:00:00.000Z';
        let latest = cursor;
        const files = await list(uid, generation, `name contains 'book-' and modifiedTime > ${literal(cursor)}`);
        const count = progress(uid, generation, files.length);
        let mergedCount = 0, lastRender = Date.now(), renderTimer, rendering = Promise.resolve();
        const refreshBatch = () => {
            clearTimeout(renderTimer); renderTimer = null;
            mergedCount = 0; lastRender = Date.now();
            rendering = rendering.then(() => { check(uid, generation); return local.refresh(); });
            // Timer-triggered failures are collected when the pull finishes.
            void rendering.catch(() => {});
            return rendering;
        };
        try { await pool(files, 4, async file => {
            try {
                check(uid, generation);
                if (!file.name.startsWith('book-') || !file.name.endsWith('.json')) return;
                const id = file.name.slice(5, -5), properties = file.appProperties || {};
                const updated = Number(properties.updated);
                if (!Number.isFinite(updated) || !Number.isFinite(Date.parse(file.modifiedTime))) throw new Error('Invalid cloud row');
                const pending = queue().find(item => item.sub === uid && item.id === id);
                const current = await local.get(id);
                if ((!pending || pending.updated < updated) && (!current || (current.updated ?? 0) <= updated)) {
                    const row = { id, updated, deleted: properties.deleted === '1', file: properties.file === '1', cover: properties.cover === '1' };
                    if (!row.deleted && (!current || updated > (current.updated ?? 0))) {
                        row.data = await drive(`${filePath(file.id)}?alt=media`, {}, uid, generation);
                    }
                    let cover;
                    if (!current && !row.deleted && row.cover) {
                        const coverId = await findName(uid, generation, name(id, true));
                        if (coverId) cover = await drive(`${filePath(coverId)}?alt=media`, { format: 'blob' }, uid, generation);
                        // Safari: a stream-backed fetch Blob stored in IndexedDB can render as a broken image; copy the bytes into a plain typed Blob.
                        if (cover) cover = new Blob([await cover.arrayBuffer()], { type: 'image/jpeg' });
                    }
                    check(uid, generation);
                    let changed = false;
                    await local.change(id, localRecord => {
                        if (!valid(uid, generation)) return undefined;
                        const merged = mergeRow(localRecord, row);
                        changed = merged !== undefined;
                        if (merged) { merged.driveJson = file.id; if (!localRecord && cover) merged.cover = cover; }
                        return merged;
                    });
                    if (changed) {
                        if (++mergedCount >= 10 || Date.now() - lastRender >= 500) await refreshBatch();
                        else if (!renderTimer) renderTimer = setTimeout(refreshBatch, Math.max(0, 500 - (Date.now() - lastRender)));
                    }
                }
                if (file.modifiedTime > latest) latest = file.modifiedTime;
            } finally { count.update(1); }
        }); } finally {
            clearTimeout(renderTimer);
            await rendering;
            check(uid, generation);
            await local.refresh();
            await count.finish();
        }
        check(uid, generation);
        localStorage.setItem(cursorKey(uid), latest);
    }
    async function deleteFile(uid, generation, id) {
        if (!id) return;
        try { await drive(filePath(id), { method: 'DELETE', format: 'raw' }, uid, generation); }
        catch (error) { if (error.status !== 404) throw error; }
    }
    async function drain(uid, generation) {
        for (const item of queue().filter(item => item.sub === uid)) {
            check(uid, generation);
            const current = await local.get(item.id);
            if (!current || (current.updated ?? 0) <= item.updated) {
                await writeNamed(uid, generation, name(item.id), new Blob([JSON.stringify({ updated: item.updated, deleted: true })], { type: 'application/json' }),
                    { updated: String(item.updated), deleted: '1', file: '0', cover: '0' });
                await deleteFile(uid, generation, await findName(uid, generation, name(item.id, true)));
                await deleteFile(uid, generation, await findFile(uid, generation, item.id));
            }
            check(uid, generation);
            localStorage.setItem(queueKey, JSON.stringify(queue().filter(value => !(value.sub === uid && value.id === item.id && value.updated === item.updated))));
        }
    }
    async function push(uid, generation) {
        const items = planPush(await local.all()).map(record => ({ record }));
        // Blob references let the phase count actual files without reading their bytes.
        await pool(items, 4, async item => {
            try {
                check(uid, generation);
                const { record } = item;
                if (!record.fileSynced && (record.source?.kind === 'blob' || uploads.has(record.id))) {
                    item.file = uploads.get(record.id) || await local.file(record.id);
                }
            } catch (error) { item.error = error; }
            item.remaining = 1 + Number(!!item.file) + Number(!!item.record.cover && !item.record.coverSynced);
        });
        const count = progress(uid, generation, items.reduce((sum, item) => sum + item.remaining, 0));
        try { await pool(items, 4, async item => {
            const { record, file } = item;
            const completed = () => { item.remaining--; count.update(1); };
            try {
                check(uid, generation);
                if (item.error) throw item.error;
                const flags = {};
                if (file) {
                    flags.driveFile = await uploadFile(uid, generation, record, file);
                    flags.fileSynced = flags.cloudFile = true;
                    completed();
                }
                if (record.cover && !record.coverSynced) {
                    await writeNamed(uid, generation, name(record.id, true), new Blob([record.cover], { type: 'image/jpeg' }), null);
                    flags.coverSynced = true;
                    completed();
                }
                check(uid, generation);
                await local.change(record.id, current => current && valid(uid, generation) ? { ...current, ...flags } : undefined);
                Object.assign(record, flags);
                const properties = { updated: String(record.updated), deleted: '0',
                    file: record.cloudFile === true || record.fileSynced === true ? '1' : '0', cover: record.coverSynced === true ? '1' : '0' };
                const driveJson = await writeNamed(uid, generation, name(record.id), new Blob([JSON.stringify({ ...recordData(record), updated: record.updated, deleted: false })], { type: 'application/json' }), properties, record.driveJson);
                check(uid, generation);
                await local.change(record.id, current => current && valid(uid, generation) ? { ...current, driveJson, synced: record.updated } : undefined);
                if (record.fileSynced) uploads.delete(record.id);
            } finally {
                // Failed/skipped work is processed too; the pool still reports failure.
                count.update(item.remaining); item.file = null;
            }
        }); } finally { await count.finish(); }
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
                try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin', cache: 'no-store' }); }
                finally { if (epoch === generation) receive(null); }
                return;
            }
            if (generation !== epoch) return;
            await local.wipe();
            localStorage.removeItem(queueKey);
            localStorage.removeItem(cursorKey(uid));
            localStorage.removeItem(folderKey(uid));
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
        void sync();
    }
    function receive(next) {
        if (ready && next?.user.id === session?.user.id) { session = next; ui.account(next.user); return; }
        const previous = session?.user.id;
        session = next; ready = false; sessionFailed = false; again = false; clearTimeout(timer);
        const generation = ++epoch;
        uploads.clear();
        if (previous) {
            try { localStorage.removeItem(cursorKey(previous)); localStorage.removeItem(folderKey(previous)); } catch { failure(); }
        }
        authWork = authWork.then(() => acceptSession(next, generation)).catch(() => { ready = false; sessionFailed = true; failure(); });
    }
    function restoreSession(userInitiated = false, initial = false) {
        if (recovering) return recovering;
        const initialEpoch = epoch;
        recovering = (async () => {
            try {
                const next = await token();
                if (epoch === initialEpoch) receive(next);
            } catch (error) {
                if (epoch !== initialEpoch) return;
                if (initial && (!error.status || [501, 404, 405].includes(error.status))) { enabled = false; return; }
                sessionFailed = true; ui.account(null); failure(userInitiated);
            }
        })().finally(() => { recovering = null; });
        return recovering;
    }
    async function start() {
        const url = new URL(location.href);
        url.searchParams.delete('auth');
        history.replaceState(history.state, '', `${url.pathname}${url.search}${url.hash}`);
        await restoreSession(false, true);
        if (!enabled) return false;
        await authWork;
        document.addEventListener('visibilitychange', () => { if (!document.hidden) void sync(); });
        for (const event of ['focus', 'online']) window.addEventListener(event, () => void sync());
        return true;
    }
    return {
        start, changed, sync,
        get signedIn() { return ready; },
        signIn() { location.assign('/api/auth/login?return=' + (location.pathname === '/en' ? '/en' : '/')); },
        async signOut() {
            ready = false; ++epoch; again = false; clearTimeout(timer);
            if (running) await running;
            try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin', cache: 'no-store' }); }
            catch { failure(true); }
            finally { receive(null); await authWork; }
        },
        remove(record) {
            try {
                if (!enabled) return;
                const uid = ready ? session.user.id : localStorage.getItem(userKey);
                if (!uid) return;
                const items = queue().filter(item => !(item.sub === uid && item.id === record.id));
                items.push({ sub: uid, id: record.id, updated: Date.now() });
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
        async download(record, onProgress) {
            const uid = session?.user.id, generation = epoch;
            check(uid, generation);
            const started = performance.now();
            let id = record.driveFile || await findFile(uid, generation, record.id), response;
            if (!id) throw new Error('File unavailable');
            try { response = await drive(`${filePath(id)}?alt=media`, { format: 'raw' }, uid, generation); }
            catch (error) {
                if (error.status !== 404) throw error;
                id = await findFile(uid, generation, record.id);
                if (!id) throw new Error('File unavailable');
                response = await drive(`${filePath(id)}?alt=media`, { format: 'raw' }, uid, generation);
            }
            check(uid, generation);
            const length = Number(response.headers.get('Content-Length'));
            const total = Number.isFinite(length) && length > 0 ? length : Number.isFinite(record.size) ? Math.max(0, record.size) : 0;
            const reader = response.body?.getReader(), chunks = [];
            let received = 0, lastProgress = performance.now(), blob;
            onProgress?.(0, total);
            if (reader) {
                try {
                    for (;;) {
                        check(uid, generation);
                        const { done, value } = await reader.read();
                        check(uid, generation);
                        if (done) break;
                        chunks.push(value); received += value.byteLength;
                        if (performance.now() - lastProgress >= 100) {
                            onProgress?.(received, total); lastProgress = performance.now();
                        }
                    }
                } catch (error) { await reader.cancel().catch(() => {}); throw error; }
                finally { reader.releaseLock(); }
                blob = new Blob(chunks, { type: response.headers.get('Content-Type') || '' });
            } else { blob = await response.blob(); received = blob.size; }
            check(uid, generation);
            onProgress?.(received, total);
            console.info(`cloud download ${record.name} ${received} ${Math.round(performance.now() - started)}`);
            await local.saveFile(record.id, blob, () => valid(uid, generation));
            await local.change(record.id, current => current && valid(uid, generation) ? { ...current, driveFile: id } : undefined);
            check(uid, generation);
            return blob;
        },
    };
}
