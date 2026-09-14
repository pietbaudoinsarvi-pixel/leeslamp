// Pure, synchronous metadata matching. No browser globals or network work.
const collator = new Intl.Collator('nl', { sensitivity: 'base' });
export const sameCategory = (a, b) => collator.compare(a, b) === 0;
export const normalizeCategory = value => {
    if (typeof value !== 'string') return '';
    const text = value.trim().replace(/\s+/g, ' ').replace(/[\p{P}\s]+$/gu, '');
    return /\p{L}/u.test(text) && text.length <= 200 ? text[0].toLocaleUpperCase('nl') + text.slice(1) : '';
};
const values = value => Array.isArray(value) ? value.flatMap(values)
    : typeof value === 'string' ? [value] : value?.name
        ? values(typeof value.name === 'object' && !Array.isArray(value.name) ? Object.values(value.name) : value.name) : [];
function candidates(meta = {}) {
    meta = meta?.metadata ?? meta ?? {};
    let calibre = meta['calibre:user_metadata'];
    if (typeof calibre === 'string') {
        try { calibre = JSON.parse(calibre); } catch { calibre = null; }
    }
    // Only tag/genre/subject fields, never arbitrary Calibre custom columns.
    const custom = Object.entries(calibre ?? {}).filter(([key, field]) =>
        /tag|genre|subject/i.test(key) || /tag|genre|subject/i.test(field?.name ?? ''))
        .flatMap(([, field]) => values(field?.['#value#'] ?? field?.value ?? field));
    return [meta.subject, meta.subjects, meta.tags, meta.genre, meta.genres,
        meta.info?.Keywords, meta.info?.Subject, ...custom].flatMap(values);
}
const usable = value => value && !/^(unknown|onbekend|none|n\/a|general|algemeen|unspecified|other|overig)$/i.test(value);
export const collectSubjects = (meta, split = true) => [...new Set(candidates(meta).filter(value => usable(normalizeCategory(value)))
    .flatMap(value => split ? value.split(/[;/,]/) : [value]).map(normalizeCategory).filter(usable))];
const groups = [
    'fiction|literary|literature|novel|roman|fictie|poetry|poëzie|fantasy|thriller|detective',
    'business|management|leadership|ondernemen|ondernemerschap|leiderschap',
    'psychology|psychologie|gedrag|behavior|behaviour',
    'history|philosophy|geschiedenis|filosofie|maatschappij|society',
    'science|nature|technology|wetenschap|natuur|techniek|scientific',
    'religion|religious|spirituality|bible|spiritualiteit|religieuze|religie|bijbel',
    'self help|personal development|persoonlijke ontwikkeling|zelfhulp',
    'marketing|branding|sales|verkoop',
    'music|muziek',
    'art|arts|kunst|creativity|creativiteit',
    'biography|memoir|biografie|biografieën|autobiography',
    'reference|encyclopedia|encyclopedie|naslag',
    'architecture|geometry|architectuur|geometrie|meetkunde',
].map(group => ({ pattern: new RegExp(`(?:^|[^\\p{L}])(?:${group})(?=$|[^\\p{L}])`, 'iu'), keywords: group.split('|') }));
const keywordText = value => value.replace(/[_-]/g, ' ');
export function autoCategory(meta, existingCategories = []) {
    const existing = [...existingCategories].filter(value => typeof value === 'string' && value.trim());
    const subjects = collectSubjects(meta);
    // Preserve exact compound names before splitting subjects (e.g. a category with commas).
    for (const subject of [...candidates(meta).map(normalizeCategory).filter(usable), ...subjects]) {
        const exact = existing.find(category => sameCategory(category, subject));
        if (exact) return exact;
    }
    for (const subject of subjects) {
        for (const group of groups) {
            if (!group.pattern.test(keywordText(subject))) continue;
            const match = existing.find(category => group.keywords.some(word => keywordText(category).toLocaleLowerCase('nl').includes(word)));
            if (match) return match;
        }
    }
    return subjects[0] ?? '';
}
