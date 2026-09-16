// Shared identity rules. Empty identities never match; size is always exact.
export const normalizeIdentity = value => typeof value === 'string'
    ? value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim().replace(/\s+/g, ' ') : '';
export const normalizeName = value => normalizeIdentity(value).replace(/\.[^.]+$/, '').trim();
const eligible = record => !record.hidden && Number.isFinite(record.size) && record.size > 0;
const keys = (record, metadataOnly) => {
    if (!eligible(record)) return [];
    const name = normalizeName(record.name), title = normalizeIdentity(record.title);
    // An epub and a pdf of one title are two books, never a duplicate pair.
    const scope = `${normalizeIdentity(record.ext)}:${record.size}`;
    // Older records do not retain title provenance. A filename fallback is not
    // evidence of a metadata title, even when metadata parsing succeeded.
    const metadataTitle = record.metadataReady === true && title && title !== name;
    return [name && `n:${scope}:${name}`,
        title && (!metadataOnly || metadataTitle) && `t:${scope}:${title}`].filter(Boolean);
};
export function createImportIndex(records) {
    const identities = new Set();
    const add = record => { for (const key of keys(record, true)) identities.add(key); };
    records.forEach(add);
    return { add, has: record => keys(record, true).some(key => identities.has(key)) };
}

export function planDedupe(records, roots) {
    const rootIds = new Set(roots.map(root => typeof root === 'string' ? root : root.id));
    const parent = [], rank = [], entries = [], identities = new Map();
    const find = index => {
        while (parent[index] !== index) { parent[index] = parent[parent[index]]; index = parent[index]; }
        return index;
    };
    const join = (a, b) => {
        a = find(a); b = find(b);
        if (a === b) return;
        if (rank[a] < rank[b]) [a, b] = [b, a];
        parent[b] = a;
        if (rank[a] === rank[b]) rank[a]++;
    };
    for (const record of records) {
        const matches = keys(record, false);
        if (!matches.length) continue;
        const index = entries.length;
        entries.push(record); parent.push(index); rank.push(0);
        for (const key of matches) {
            if (identities.has(key)) join(index, identities.get(key));
            else identities.set(key, index);
        }
    }
    const buckets = new Map();
    entries.forEach((record, index) => {
        const key = find(index);
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(record);
    });
    const priority = record => record.source?.kind === 'fs' && rootIds.has(record.source.root) ? 2 : record.cloudFile === true ? 1 : 0;
    const updated = record => Number.isFinite(record.updated) ? record.updated : 0;
    const fraction = record => Number.isFinite(record.fraction) ? record.fraction : 0;
    const better = (a, b) => priority(a) > priority(b) || priority(a) === priority(b)
        && (updated(a) > updated(b) || updated(a) === updated(b) && a.id < b.id);
    const groups = [];
    let total = 0;
    for (const group of buckets.values()) {
        if (group.length < 2) continue;
        const original = group.reduce((a, b) => better(b, a) ? b : a);
        const keep = { ...original }, drop = group.filter(record => record !== original).map(record => ({ ...record, keepFile: false }));
        const furthest = group.reduce((a, b) => fraction(b) > fraction(a) ? b : a, original);
        const manual = original.categoryManual ? original : group.find(record => record.categoryManual && record.category);
        const category = manual || group.find(record => record.category);
        const opened = group.map(record => record.opened).filter(Number.isFinite);
        const merged = { fraction: fraction(furthest), loc: furthest.loc ?? null,
            opened: opened.length ? Math.max(...opened) : null,
            finished: group.some(record => record.finished === true && fraction(record) === fraction(furthest)),
            category: category?.category || '', categoryManual: !!manual,
            cover: original.cover || group.find(record => record.cover)?.cover || null };
        if (keep.cloudFile !== true) {
            const donor = drop.find(record => record.cloudFile === true);
            if (donor) {
                Object.assign(keep, { driveFile: donor.driveFile, cloudFile: true, fileSynced: true });
                donor.keepFile = true;
            }
        }
        groups.push({ keep, drop, merged }); total += drop.length;
    }
    return { groups, total };
}
