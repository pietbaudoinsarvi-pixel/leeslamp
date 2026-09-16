// No DOM: queries, extraction and transport also run against Node fixtures.
const cache = new Map();
let pending;
export function truncate(text, max) {
    text = String(text || '').replace(/\s+/g, ' ').trim();
    if (text.length <= max) return text;
    const head = text.slice(0, max - 1);
    const boundary = head.lastIndexOf(' ');
    return (boundary > 0 ? head.slice(0, boundary) : head).trimEnd() + '…';
}
export function buildQueries(selection, lang) {
    const raw = String(selection || '').trim();
    // The acceptance boundary is exclusive: 300 characters are refused.
    if (!raw || raw.length >= 300) return null;
    const term = raw.replace(/\s+/g, ' ').replace(/^[\p{P}\p{S}\s]+|[\p{P}\p{S}\s]+$/gu, '');
    if (!term) return null;
    const words = term.split(' ');
    return { term, lang: lang === 'nl' ? 'nl' : 'en', wikipedia: words.slice(0, 12).join(' '),
        wiktionary: words.length <= 2 ? term : null };
}
export function pickWikipedia(summaryJson, searchJson) {
    if (summaryJson?.extract && !['disambiguation', 'no-extract'].includes(summaryJson.type)) {
        const url = summaryJson.content_urls?.desktop?.page;
        if (!/^https:\/\/[a-z-]+\.wikipedia\.org\//i.test(url || '')) return null;
        return { kind: 'wikipedia', title: summaryJson.title, description: summaryJson.description || '',
            text: truncate(summaryJson.extract, 400), url };
    }
    // Search snippets are deliberately never used, including their HTML.
    return searchJson?.query?.search?.[0]?.title || null;
}
export function pickWiktionary(extract, lang) {
    if (!extract) return '';
    const sections = [...extract.matchAll(/^==\s*([^=\n]+?)\s*==\s*$/gm)];
    const chosen = sections.find(s => s[1].trim() === (lang === 'nl' ? 'Nederlands' : 'English')) || sections[0];
    if (chosen) {
        const next = sections[sections.indexOf(chosen) + 1];
        extract = extract.slice(chosen.index + chosen[0].length, next?.index);
    }
    const lines = extract.split('\n').map(line => line.trim()).filter(Boolean);
    const meaning = lines.findIndex(line => /^=+\s*(betekenis|betekenissen|meaning|definitions?|noun|verb|adjective|adverb|zelfstandig naamwoord|werkwoord|bijvoeglijk naamwoord)\s*=+$/i.test(line));
    const content = meaning >= 0 ? lines.slice(meaning + 1) : lines;
    const end = content.findIndex(line => /^=/.test(line));
    const selected = meaning >= 0 && end >= 0 ? content.slice(0, end) : content;
    return truncate(selected.filter(line => !/^=/.test(line)).map(line => line.replace(/^[#*:;\s]+/, '')).join(' '), 300);
}
const LEMMA = String.raw`(?:\s+(?:het|de|een|'t|the|a|an|werkwoord|zelfstandig naamwoord|noun|verb|adjective))*\s+([\p{L}'-]+)`;
const inflection = (marker, link) => new RegExp(String.raw`\b(?:${marker})\b[^.]*?\b(?:${link})` + LEMMA, 'iu');
const INFLECTION = [
    inflection('plural|singular|comparative|superlative|past tense|past participle|present participle|gerund|third-person singular', 'of'),
    inflection("meervoud|enkelvoud|verkleinwoord|vergrotende trap|overtreffende trap|verleden tijd|voltooid deelwoord|tegenwoordig deelwoord|gebiedende wijs|vervoeging|persoonsvorm", 'van'),
];
// Returns the lemma when the text says nothing but "plural of X" / "meervoud van X".
export function inflectionOf(text, term) {
    if (!text || text.length > 120) return null;
    for (const pattern of INFLECTION) {
        const lemma = text.match(pattern)?.[1];
        if (lemma && lemma.toLowerCase() !== String(term).toLowerCase()) return lemma;
    }
    return null;
}
export function cancelLookup() { pending?.abort(); pending = null; }
export async function lookup(selection, lang, fetchImpl = fetch) {
    cancelLookup();
    const queries = buildQueries(selection, lang);
    if (!queries) return null;
    const key = queries.lang + ':' + queries.term;
    if (cache.has(key)) return cache.get(key);
    const controller = new AbortController(); pending = controller;
    const json = async (url, rest = false) => {
        const response = await fetchImpl(url, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]),
            ...(rest ? { headers: { 'Api-User-Agent': 'Leeslamp/1.0 (https://leeslamp.vercel.app)' } } : {}) });
        if (response.status === 404) return null;
        if (!response.ok) throw new Error('lookupNetwork');
        return response.json();
    };
    const wikipedia = async language => {
        const root = `https://${language}.wikipedia.org`;
        const summary = title => json(`${root}/api/rest_v1/page/summary/${encodeURIComponent(title)}`, true);
        const title = queries.term[0].toLocaleUpperCase(language) + queries.term.slice(1);
        let result = pickWikipedia(await summary(title));
        if (result) return result;
        const search = await json(`${root}/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(queries.wikipedia)}&format=json&origin=*`);
        const hit = pickWikipedia(null, search);
        return hit ? pickWikipedia(await summary(hit)) : null;
    };
    const entry = async (language, word) => {
        const response = await json(`https://${language}.wiktionary.org/w/api.php?action=query&prop=extracts&explaintext=1&titles=${encodeURIComponent(word)}&format=json&origin=*`);
        return pickWiktionary(Object.values(response?.query?.pages || {})[0]?.extract, language);
    };
    const wiktionary = async language => {
        let word = queries.wiktionary, title = queries.term;
        let text = await entry(language, word);
        // "passes: plural of pass" is a pointer, not a meaning: follow it once.
        const lemma = inflectionOf(text, word);
        if (lemma) {
            const better = await entry(language, lemma);
            if (better) { text = better; title = `${queries.term} · ${lemma}`; word = lemma; }
        }
        return text ? { kind: 'wiktionary', title, text,
            url: `https://${language}.wiktionary.org/wiki/${encodeURIComponent(word)}` } : null;
    };
    try {
        let failed = false;
        for (const language of queries.lang === 'en' ? ['en'] : [queries.lang, 'en']) {
            // A capitalised selection is a name: the encyclopedia answers it, the dictionary answers a plain word.
            const sources = !queries.wiktionary ? [wikipedia(language)]
                : /^\p{Lu}/u.test(queries.term) ? [wikipedia(language), wiktionary(language)]
                : [wiktionary(language), wikipedia(language)];
            const results = await Promise.allSettled(sources);
            controller.signal.throwIfAborted();
            const result = results.find(item => item.status === 'fulfilled' && item.value)?.value;
            failed ||= results.some(item => item.status === 'rejected');
            if (result) { cache.set(key, result); if (cache.size > 64) cache.delete(cache.keys().next().value); return result; }
            // A connection failure is not an empty language result.
            if (failed) throw new Error('lookupNetwork');
        }
        cache.set(key, null);
        if (cache.size > 64) cache.delete(cache.keys().next().value);
        return null;
    } finally { if (pending === controller) pending = null; }
}
