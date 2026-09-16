// A book lands in the library twice whenever the same file arrives twice: importing it again,
// linking one folder on two devices (each device gives a folder its own root id, so every path
// gets a second book id), linking a folder inside an already linked folder, or importing a file
// that the cloud already holds. Book ids are random, so only the file itself identifies a book:
// name, extension and size travel with every record and cross the account boundary unchanged.
const text = value => typeof value === 'string' ? value.trim().toLowerCase() : '';
const number = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
export function bookKey(record) {
    const name = text(record?.name), ext = text(record?.ext);
    if (!name || !Number.isFinite(record?.size) || record.size <= 0) return '';
    return `${ext}|${record.size}|${name}`;
}
// The copy that stays is the one that stays readable: the open book first, then a cloud copy
// (its bytes serve every device), then bytes or a linked folder on this device, then the oldest.
const rank = (record, settings) => [record.id === settings.activeId,
    record.cloudFile === true || record.fileSynced === true,
    settings.hasFile(record.id) || settings.reachable(record)].map(Number);
function better(candidate, current, settings) {
    const left = rank(candidate, settings), right = rank(current, settings);
    for (const [index, value] of left.entries()) if (value !== right[index]) return value > right[index];
    const added = number(candidate.added, Infinity) - number(current.added, Infinity);
    return added ? added < 0 : String(candidate.id) < String(current.id);
}
function changesFor(keeper, group) {
    const changes = {};
    const set = (key, value) => { if (value !== undefined && value !== keeper[key]) changes[key] = value; };
    // Reading progress belongs to the copy read last; an untouched copy never overwrites it.
    const read = group.reduce((best, record) => number(record.opened) > number(best.opened)
        || (number(record.opened) === number(best.opened) && number(record.fraction) > number(best.fraction)) ? record : best);
    if (read !== keeper) {
        set('opened', read.opened ?? null);
        set('fraction', number(read.fraction));
        set('loc', read.loc ?? null);
    }
    if (group.some(record => record.finished === true)) set('finished', true);
    const added = Math.min(...group.map(record => number(record.added, Infinity)));
    if (Number.isFinite(added)) set('added', added);
    // A category chosen by hand outranks an automatic one, and any category outranks none.
    const chosen = group.find(record => record.categoryManual === true && record.category)
        || group.find(record => record.category);
    if (chosen) set('category', chosen.category);
    if (group.some(record => record.categoryManual === true)) set('categoryManual', true);
    if (keeper.metadataReady !== true) {
        const parsed = group.find(record => record.metadataReady === true);
        if (parsed) {
            set('title', parsed.title); set('author', parsed.author); set('metadataReady', true);
            if (Array.isArray(parsed.subjects)) set('subjects', parsed.subjects);
        }
    }
    if (!keeper.cover) {
        const covered = group.find(record => record.cover);
        if (covered) set('cover', covered.cover);
    }
    return changes;
}
// Hidden books stay hidden: they were put away on purpose and must not return through a merge.
export function planDedupe(records, options = {}) {
    const settings = { activeId: null, hasFile: () => false, reachable: () => false, ...options };
    const groups = new Map();
    for (const record of records) {
        if (!record || record.hidden === true) continue;
        const key = bookKey(record);
        if (!key) continue;
        if (groups.has(key)) groups.get(key).push(record); else groups.set(key, [record]);
    }
    const updates = [], removals = [], transfers = [];
    for (const group of groups.values()) {
        if (group.length < 2) continue;
        const keeper = group.reduce((best, record) => better(record, best, settings) ? record : best);
        const changes = changesFor(keeper, group);
        if (Object.keys(changes).length) updates.push({ record: keeper, changes });
        let readable = settings.hasFile(keeper.id) || settings.reachable(keeper);
        for (const record of group) {
            if (record === keeper) continue;
            if (!readable && settings.hasFile(record.id)) { transfers.push({ from: record.id, to: keeper.id }); readable = true; }
            // A linked folder offers the same path at every scan, so its copy is hidden, never deleted.
            if (record.source?.kind === 'fs') updates.push({ record, changes: { hidden: true } });
            else removals.push(record);
        }
    }
    return { updates, removals, transfers };
}
