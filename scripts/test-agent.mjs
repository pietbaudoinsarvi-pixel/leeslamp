import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { runAgent, cancelAgent, executeTool, bookContextReader, TOOLS } from '../agent.js';
import { passageContext } from '../ask.js';

const options = { passage: 'SELECTED PASSAGE', before: 'Before.', after: 'After.', question: 'Explain?',
    book: { title: 'Fixture', author: 'Author' }, chapter: 'One', language: 'en', model: 'fixture', key: 'SECRET-HEADER-ONLY' };
const call = (id, name = 'read_wikipedia', input = { title: 'Frater Achad', language: 'en' }) => ({ id, name, input });
const pause = () => new Promise(resolve => setImmediate(resolve));
const stream = adapter => new Response('data: ' + JSON.stringify(adapter === 'openai'
    ? { choices: [{ delta: { content: 'Final answer.' } }] }
    : { type: 'content_block_delta', delta: { text: 'Final answer.' } }) + '\n\ndata: [DONE]\n\n');
const plain = (adapter, calls = [], text = '') => Response.json(adapter === 'openai'
    ? { choices: [{ message: { role: 'assistant', content: text || null,
        ...(calls.length ? { tool_calls: calls.map(c => ({ id: c.id, type: 'function', function: { name: c.name, arguments: JSON.stringify(c.input) } })) } : {}) } }] }
    : { stop_reason: calls.length ? 'tool_use' : 'end_turn', content: [...(text ? [{ type: 'text', text }] : []),
        ...calls.map(c => ({ type: 'tool_use', id: c.id, name: c.name, input: c.input }))] });
const article = title => Response.json({ query: { pages: { 1: { title, extract: 'Source text. '.repeat(500) } } } });
const results = (adapter, body) => adapter === 'openai'
    ? body.messages.filter(m => m.role === 'tool').map(m => ({ id: m.tool_call_id, result: JSON.parse(m.content) }))
    : body.messages.filter(m => m.role === 'user' && Array.isArray(m.content)).flatMap(m => m.content.map(b => ({ id: b.tool_use_id, result: JSON.parse(b.content) })));

for (const adapter of ['openai', 'anthropic']) {
    const config = { ...options, provider: { adapter, baseUrl: 'https://fixture.invalid/v1' } };
    let requests, lookups;
    const fixture = (provider, wiki = url => article(new URL(url).searchParams.get('titles'))) => {
        requests = []; lookups = [];
        return async (url, init) => {
            assert.ok(init.signal instanceof AbortSignal);
            assert.equal(init.credentials, 'omit'); assert.equal(init.redirect, 'error');
            if (url.startsWith('https://fixture.invalid/')) {
                const body = JSON.parse(init.body); requests.push(body);
                assert.ok(!init.body.includes(options.key), 'key never appears in any body');
                assert.ok(JSON.stringify(init.headers).includes(options.key));
                return provider(body, requests.length, init.signal);
            }
            assert.match(new URL(url).hostname, /^(en|nl)\.(wikipedia|wiktionary)\.org$/);
            assert.ok(!JSON.stringify(init).includes(options.key));
            lookups.push(url); return wiki(url, init.signal);
        };
    };
    let fetcher = fixture(body => {
        assert.equal(body.stream, false);
        assert.equal(body.tools.length, 4);
        const names = body.tools.map(t => adapter === 'openai' ? t.function.name : t.name);
        assert.deepEqual(names, Object.keys(TOOLS));
        assert.ok(adapter === 'openai' ? body.tools[0].function.parameters : body.tools[0].input_schema);
        const first = body.messages.find(m => m.role === 'user');
        assert.deepEqual(JSON.parse(first.content), { title: 'Fixture', author: 'Author', chapter: 'One', before: options.before,
            passage: options.passage, after: options.after, question: options.question });
        return plain(adapter, [], 'Direct answer.');
    });
    let output = [];
    let result = await runAgent({ ...config, onText: text => output.push(text) }, fetcher);
    assert.deepEqual(result, { answer: 'Direct answer.', sources: [] });
    assert.equal(requests.length, 1); assert.equal(lookups.length, 0); assert.deepEqual(output, ['Direct answer.']);

    let statuses = [];
    fetcher = fixture((body, round) => {
        if (round === 1) return plain(adapter, [call('one')]);
        const returned = results(adapter, body);
        assert.equal(returned.length, 1); assert.equal(returned[0].id, 'one');
        assert.equal(returned[0].result.text.length, 4000);
        const assistant = body.messages.find(m => m.role === 'assistant');
        assert.ok(adapter === 'openai' ? assistant.tool_calls[0].id === 'one' : assistant.content[0].id === 'one');
        if (body.stream) { assert.equal(body.tools, undefined); return stream(adapter); }
        return plain(adapter, [], 'Ready to answer.');
    });
    result = await runAgent({ ...config, onStatus: (key, values) => statuses.push([key, values]) }, fetcher);
    assert.equal(result.answer, 'Final answer.'); assert.equal(requests.length, 3);
    assert.deepEqual(result.sources, [{ title: 'Frater Achad', url: 'https://en.wikipedia.org/wiki/Frater_Achad' }]);
    assert.ok(statuses.some(([key, value]) => key === 'agentRead' && value.term === 'Frater Achad'));

    // A gate can only open when both tools have started, proving parallel execution.
    let started = 0, release;
    const gate = new Promise(resolve => { release = resolve; });
    fetcher = fixture((body, round) => {
        if (round === 1) return plain(adapter, [call('a'), call('b', 'look_up_word', { word: 'passes', language: 'en' })]);
        assert.deepEqual(results(adapter, body).map(r => r.id), ['a', 'b']);
        return body.stream ? stream(adapter) : plain(adapter, [], 'Ready.');
    }, async url => {
        if (++started === 2) release();
        await gate;
        if (url.includes('wikipedia')) return article('Frater Achad');
        const extract = new URL(url).searchParams.get('titles') === 'passes' ? 'plural of pass' : 'A route through mountains.';
        return Response.json({ query: { pages: { 1: { extract } } } });
    });
    result = await runAgent(config, fetcher);
    assert.equal(lookups.length, 3); assert.equal(result.sources.length, 3, 'both dictionary pages actually read are listed');
    assert.ok(results(adapter, requests[1])[1].result.text.includes('mountains'));

    fetcher = fixture((body, round) => round === 1 ? plain(adapter, [call('search', 'search_wikipedia', { query: 'Achad', language: 'nl' })])
        : body.stream ? stream(adapter) : plain(adapter, [], 'Ready.'), () => Response.json({ query: { search: Array.from({ length: 7 }, () => ({ title: 'Hit', snippet: '<span>Plain</span> &amp; &#65;' })) } }));
    result = await runAgent(config, fetcher);
    assert.deepEqual(result.sources, [], 'search hits are never cited as read pages');
    assert.equal(results(adapter, requests[1])[0].result.length, 5);
    assert.equal(results(adapter, requests[1])[0].result[0].snippet, 'Plain & A');

    fetcher = fixture((body, round) => body.stream ? stream(adapter) : plain(adapter, [call('round-' + round)]));
    result = await runAgent(config, fetcher);
    assert.equal(requests.length, 5, 'four decision rounds and one final answer');
    assert.equal(lookups.length, 4); assert.equal(result.answer, 'Final answer.');
    assert.equal(result.sources.length, 1, 'sources deduplicated');

    fetcher = fixture((body, round) => {
        if (round === 1) return plain(adapter, Array.from({ length: 10 }, (_, i) => call('call-' + i)));
        assert.equal(body.stream, true); assert.equal(body.tools, undefined);
        const returned = results(adapter, body);
        assert.equal(returned.length, 10, 'even refused calls receive a tool result');
        assert.ok(returned[8].result.error && returned[9].result.error);
        return stream(adapter);
    });
    result = await runAgent(config, fetcher);
    assert.equal(lookups.length, 8); assert.equal(result.answer, 'Final answer.');

    fetcher = fixture((body, round) => {
        if (round === 1) return plain(adapter, [call('failure')]);
        assert.deepEqual(results(adapter, body)[0].result, { error: 'Lookup failed.' });
        return body.stream ? stream(adapter) : plain(adapter, [], 'Ready.');
    }, () => { throw new TypeError('private network details'); });
    result = await runAgent(config, fetcher);
    assert.equal(result.answer, 'Final answer.'); assert.deepEqual(result.sources, []);

    for (const [error, status] of [['tools not supported', 400], ['Missing required parameter: functions', 400], ['missing_parameter: tools', 422]]) {
        fetcher = fixture((body, round) => {
            if (round === 1) return new Response(error, { status });
            assert.equal(body.tools, undefined); assert.equal(body.stream, true);
            assert.equal(body.messages.length, adapter === 'openai' ? 2 : 1);
            return stream(adapter);
        });
        result = await runAgent(config, fetcher);
        assert.equal(result.answer, 'Final answer.'); assert.equal(requests.length, 2); assert.deepEqual(result.sources, []);
    }

    // Deadline interrupts either the provider decision or a tool fetch, leaving
    // reserved time for the final streamed answer within the overall deadline.
    for (const stage of ['provider', 'tool']) {
        let active = 0, aborted = 0;
        const hang = signal => new Promise((resolve, reject) => {
            active++;
            signal.addEventListener('abort', () => { active--; aborted++; reject(signal.reason); }, { once: true });
        });
        fetcher = fixture((body, round, signal) => body.stream ? stream(adapter)
            : stage === 'provider' ? hang(signal) : plain(adapter, [call('deadline')]), (url, signal) => hang(signal));
        result = await runAgent(config, fetcher, { deadlineMs: 200, finalReserveMs: 180 });
        assert.equal(result.answer, 'Final answer.'); assert.equal(active, 0); assert.equal(aborted, 1);
        assert.equal(requests.at(-1).stream, true);
    }

    for (const stage of ['provider', 'tool', 'stream']) {
        let active = 0, ready;
        const began = new Promise(resolve => { ready = resolve; });
        const hang = signal => new Promise((resolve, reject) => {
            active++; ready();
            signal.addEventListener('abort', () => { active--; reject(signal.reason); }, { once: true });
        });
        fetcher = fixture((body, round, signal) => {
            if (stage === 'provider') return hang(signal);
            if (body.stream) return new Response(new ReadableStream({ start() { active++; ready(); }, cancel() { active--; } }));
            return plain(adapter, stage === 'tool' || round === 1 ? [call('abort')] : [], 'Ready.');
        }, (url, signal) => stage === 'tool' ? hang(signal) : article('Read'));
        const running = runAgent(config, fetcher);
        await began; await pause(); cancelAgent();
        await assert.rejects(running, { name: 'AbortError' });
        assert.equal(active, 0, 'abort leaves no pending fetch or stream');
        const total = requests.length; await pause(); assert.equal(requests.length, total);
    }
    for (const action of ['session abort', 'new question']) {
        let active = 0, ready;
        const began = new Promise(resolve => { ready = resolve; });
        const controller = new AbortController();
        fetcher = fixture((body, round, signal) => new Promise((resolve, reject) => {
            active++; ready();
            signal.addEventListener('abort', () => { active--; reject(signal.reason); }, { once: true });
        }));
        const running = runAgent({ ...config, signal: controller.signal }, fetcher);
        const stopped = assert.rejects(running, { name: 'AbortError' });
        await began;
        if (action === 'session abort') controller.abort();
        else assert.equal((await runAgent(config, fixture(() => plain(adapter, [], 'New answer.')))).answer, 'New answer.');
        await stopped;
        assert.equal(active, 0, action + ' cancels the old request');
    }
    // Failed authentication on the fallback must not initiate another agent round.
    fetcher = fixture((body, round) => new Response(round === 1 ? 'tools unsupported' : 'unauthorized', { status: round === 1 ? 400 : 401 }));
    await assert.rejects(runAgent(config, fetcher), { key: 'askKeyError' });
    assert.equal(requests.length, 2);
    console.log(`PASS: ${adapter}: direct answer, tool shapes, parallel calls, sources, limits, deadline, failures, fallback, secrets and abort cleanup.`);
}

// One text node is enough to prove the exact boundaries and repeated windows;
// test-ask also exercises multi-node, element, inline, chapter and PDF roots.
const before = 'before '.repeat(1400), selected = 'SELECTED PASSAGE', after = ' after'.repeat(1400);
const node = { nodeType: 3, data: before + selected + after, get length() { return this.data.length; }, substringData(start, count) { return this.data.slice(start, start + count); } };
const root = { contains: other => other === node, ownerDocument: { createTreeWalker: () => ({ previousNode: () => null, nextNode: () => null }) } };
const range = { startContainer: node, startOffset: before.length, endContainer: node, endOffset: before.length + selected.length };
const initial = passageContext(range, root), readMore = bookContextReader(range, root, initial);
const seen = { ...initial };
const env = { signal: new AbortController().signal, readMore };
for (const direction of ['before', 'after']) {
    for (let i = 0; i < 4; i++) {
        const { text } = await executeTool(call('book', 'read_more_of_the_book', { direction, characters: 9000 }), env);
        assert.ok(text.length <= 4000); assert.ok(!text.includes(selected));
        seen[direction] = direction === 'before' ? text + seen[direction] : seen[direction] + text;
    }
}
assert.deepEqual(seen, { before, after }, 'initial plus repeated windows reconstructs context exactly, with no duplicates or selected passage');
assert.deepEqual(bookContextReader(null, null)({ direction: 'after', characters: 100 }), { text: '' });
for (const bad of [call('unknown', '__proto__'), { id: 'bad', name: 'read_wikipedia', input: '{' }, call('bad', 'read_wikipedia', { title: 'X', language: '../../evil' }), call('bad', 'read_more_of_the_book', { direction: 'inside', characters: 5 })]) {
    assert.ok((await executeTool(bad, env)).error);
}
const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const start = app.indexOf('const STRINGS = '), end = app.indexOf('\n};', start);
const strings = runInNewContext(app.slice(start, end + 3) + '; STRINGS');
const privacy = readFileSync(new URL('../privacy.html', import.meta.url), 'utf8');
for (const lang of ['nl', 'en']) {
    for (const tool of Object.values(TOOLS)) assert.ok(strings[lang][tool.status]);
    assert.ok(strings[lang].agentSources); assert.ok(privacy.includes(strings[lang].agentPrivacy));
}
console.log('PASS: bounded additional book context excludes selection, repeated windows, invalid tools and NL/EN UI/privacy strings.');
