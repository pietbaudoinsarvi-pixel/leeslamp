import assert from 'node:assert/strict';
import { ADAPTERS, PROVIDERS, buildRequest, passageContext, parseStream, describeError, ask, cancelAsk } from '../ask.js';

const options = { before: 'A person spoke.', passage: 'This is the passage.', after: 'They left.', question: 'What does it mean?', book: { title: 'A book', author: 'An author' }, chapter: 'Chapter 1', language: 'nl', model: 'exact-model', key: 'test-secret-1234' };
assert.deepEqual(Object.keys(ADAPTERS), ['openai', 'anthropic']);
for (const adapter of Object.keys(ADAPTERS)) {
    const provider = { adapter, baseUrl: 'https://provider.example/v1' };
    const request = buildRequest(provider, options);
    assert.equal(request.body.model, options.model);
    assert.equal(request.body.max_tokens, 2000);
    assert.equal(request.body.stream, true);
    assert.ok(JSON.stringify(request.body).includes(options.passage));
    assert.ok(JSON.stringify(request.body).includes(options.question));
    assert.ok(JSON.stringify(request.body).includes(options.book.author));
    assert.ok(!JSON.stringify(request.body).includes(options.key));
    assert.ok(!request.url.includes(options.key));
    assert.ok(JSON.stringify(request.headers).includes(options.key));
    const content = body => JSON.parse(body.messages.find(message => message.role === 'user').content);
    assert.deepEqual(content(request.body), { title: options.book.title, author: options.book.author, chapter: options.chapter,
        before: options.before, passage: options.passage, after: options.after, question: options.question });
    const system = request.body.system || request.body.messages[0].content;
    assert.match(system, /reader selected passage/);
    assert.match(system, /before and after are surrounding text provided only to resolve references/);
    assert.match(system, /answer about passage and do not summarise the context/);
    assert.match(system, /Answer in Dutch/);
    for (const blank of ['', undefined]) {
        const body = buildRequest(provider, { ...options, before: blank, after: blank }).body;
        assert.deepEqual(content(body), { ...content(request.body), before: '', after: '' });
        assert.ok(!JSON.stringify(body).includes(options.key));
    }
    assert.equal(request.headers['anthropic-dangerous-direct-browser-access'], adapter === 'anthropic' ? 'true' : undefined);
    const delta = text => 'data: ' + JSON.stringify(adapter === 'openai' ? { choices: [{ delta: { content: text } }] } : { type: 'content_block_delta', delta: { type: 'text_delta', text } }) + '\r\n\r\n';
    const stream = delta('hel') + delta('lo café') + 'data: [DONE]\n\n';
    const state = {};
    let text = '';
    for (const char of stream) text += parseStream(adapter, char, state).text;
    assert.equal(text, 'hello café'); assert.equal(state.done, true); assert.equal(state.buffer, '');
    assert.deepEqual(parseStream(adapter, delta('ignored'), state), { text: '', done: true });
    const received = [];
    const result = await ask({ ...options, provider, onText: part => received.push(part) }, async (url, init) => {
        assert.equal(init.redirect, 'error'); assert.equal(init.credentials, 'omit');
        const bytes = new TextEncoder().encode(stream);
        return new Response(new ReadableStream({ start(controller) {
            for (const byte of bytes) controller.enqueue(new Uint8Array([byte]));
            controller.close();
        } }));
    });
    assert.equal(result, 'hello café'); assert.equal(received.join(''), result);
}
const opus = buildRequest(PROVIDERS.find(p => p.id === 'anthropic'), { ...options, model: 'claude-opus-5' });
assert.deepEqual(opus.body.output_config, { effort: 'low' });
assert.equal(opus.body.thinking, undefined); assert.equal(opus.body.budget_tokens, undefined);
assert.equal(describeError(200, { stop_reason: 'refusal' }), 'askRefusal');
assert.equal(describeError(401), 'askKeyError'); assert.equal(describeError(403), 'askKeyError');
assert.equal(describeError(429), 'askRateLimit'); assert.equal(describeError(400), 'askNoAnswer');
assert.equal(describeError(500), 'askNoAnswer'); assert.equal(describeError(0), 'askNetwork');
const refused = {};
assert.throws(() => parseStream('anthropic', 'data: {"type":"message_delta","delta":{"stop_reason":"refusal"}}\n\n', refused), { key: 'askRefusal' });
assert.equal(refused.buffer, ''); assert.equal(refused.done, true);
const provider = PROVIDERS[0];

// Minimal DOM fake: TreeWalker navigation follows document order, can start at
// text or element endpoints, and records visited text nodes to catch book scans.
const textNode = data => ({ nodeType: 3, nodeName: '#text', data, get length() { return this.data.length; },
    // Guards that the walker stays bounded by the budget instead of reading the whole document.
    substringData(offset, count) { assert.ok(count <= 4001, 'reads stay within the context budget'); return this.data.slice(offset, offset + count); }, childNodes: [] });
const element = (name, ...children) => {
    const node = { nodeType: 1, nodeName: name.toUpperCase(), childNodes: children,
        contains(other) { for (; other; other = other.parentNode) if (other === this) return true; return false; },
        closest(selector) { return selector.split(',').includes(name) ? this : this.parentElement?.closest(selector); } };
    children.forEach((child, i) => Object.assign(child, { parentNode: node, parentElement: node,
        previousSibling: children[i - 1] || null, nextSibling: children[i + 1] || null }));
    return node;
};
function dom(root) {
    const visited = [];
    const doc = { createTreeWalker(scope, show) {
        assert.equal(show, 4);
        const nodes = [];
        const flatten = node => { nodes.push(node); node.childNodes.forEach(flatten); };
        flatten(scope);
        return { currentNode: scope,
            move(direction) {
                for (let i = nodes.indexOf(this.currentNode) + direction; i >= 0 && i < nodes.length; i += direction) {
                    if (nodes[i].nodeType === 3) { visited.push(nodes[i]); return this.currentNode = nodes[i]; }
                }
                return null;
            },
            nextNode() { return this.move(1); }, previousNode() { return this.move(-1); },
            lastChild() {
                const found = nodes.findLast(node => node.nodeType === 3 && this.currentNode.contains(node));
                if (found) { visited.push(found); this.currentNode = found; }
                return found || null;
            },
        };
    } };
    const attach = node => { node.ownerDocument = doc; node.childNodes.forEach(attach); };
    attach(root);
    return { root, visited };
}
const range = (startContainer, startOffset, endContainer = startContainer, endOffset = startContainer.length) =>
    ({ startContainer, startOffset, endContainer, endOffset });
const only = textNode('Selected sentence.');
let fixture = dom(element('article', only));
assert.deepEqual(passageContext(range(only, 0), fixture.root), { before: '', after: '' });
assert.deepEqual(passageContext(range(fixture.root, 0, fixture.root, 1), fixture.root), { before: '', after: '' });
const same = textNode('Before. SELECTED After.');
fixture = dom(element('article', same));
assert.deepEqual(passageContext(range(same, 8, same, 16), fixture.root), { before: 'Before. ', after: ' After.' });
assert.deepEqual(passageContext(range(same, 0, same, 8), fixture.root), { before: '', after: 'SELECTED After.' });
assert.deepEqual(passageContext(range(same, 16), fixture.root), { before: 'Before. SELECTED', after: '' });

const before = textNode('Preceding sentence.');
const start = textNode('SELECTED '), end = textNode('PASSAGE');
const after = textNode('Following sentence.');
const selectedBlock = element('p', element('em', start), end);
fixture = dom(element('article', element('p', before), selectedBlock, element('p', after)));
assert.deepEqual(passageContext(range(start, 0, end, end.length), fixture.root),
    { before: 'Preceding sentence.\n', after: '\nFollowing sentence.' });
assert.deepEqual(passageContext(range(fixture.root, 1, fixture.root, 2), fixture.root),
    { before: 'Preceding sentence.', after: 'Following sentence.' });
assert.deepEqual(passageContext(range(selectedBlock, 0, selectedBlock, 2), fixture.root),
    { before: 'Preceding sentence.', after: 'Following sentence.' });

// Inline markup can split a word; do not insert spaces into it.
const inline = textNode('SELECTED');
fixture = dom(element('article', element('p', textNode('Refer'), element('em', textNode('ence ')), inline, textNode(' af'), element('em', textNode('ter.')))));
assert.deepEqual(passageContext(range(inline, 0), fixture.root), { before: 'Reference ', after: ' after.' });

const long = textNode('word '.repeat(1000) + 'SELECTED' + ' after'.repeat(1000));
fixture = dom(element('article', long));
let context = passageContext(range(long, 5000, long, 5008), fixture.root);
assert.equal(context.before, 'word '.repeat(800));
assert.equal(context.after, ' after'.repeat(250));
assert.ok(context.before.length <= 4000 && context.after.length <= 1500);
assert.ok(!context.before.includes('SELECTED') && !context.after.includes('SELECTED'));

// Cut words spanning inline nodes, and stop before visiting distant content.
const chosen = textNode('SELECTED');
const distant = textNode('OUTSIDE BUDGET');
fixture = dom(element('article', distant, element('p', textNode('word '.repeat(1200) + 'pre'), textNode('fix '), chosen,
    textNode(' next '), textNode('tail '.repeat(500))), textNode('OUTSIDE BUDGET')));
context = passageContext(range(chosen, 0), fixture.root);
assert.ok(context.before.endsWith('prefix '));
assert.ok(context.before.startsWith('word '));
assert.ok(context.after.startsWith(' next '));
assert.ok(context.after.length <= 1500);
assert.ok(!/tai|tai$/.test(context.after), 'the trailing context ends on a word boundary');
assert.ok(context.before.length <= 4000);
assert.ok(fixture.visited.length <= 5, 'walk only neighbouring nodes, not the whole document');
assert.ok(!fixture.visited.includes(distant));

// A text article, Foliate body, or PDF text layer is a hard boundary.
for (const name of ['article', 'body', 'div']) {
    const selected = textNode('SELECTED');
    const scope = element(name, textNode('Local before. '), selected, textNode(' Local after.'));
    dom(element('main', textNode('OTHER SECTION/PAGE'), scope, textNode('OTHER SECTION/PAGE')));
    assert.deepEqual(passageContext(range(selected, 0), scope), { before: 'Local before. ', after: ' Local after.' });
    assert.deepEqual(passageContext(range(selected, 0, scope.nextSibling, 1), scope), { before: '', after: '' });
}
assert.deepEqual(passageContext(null, null), { before: '', after: '' });
assert.deepEqual(passageContext(range(only, 0), { contains() { throw new Error('unavailable document'); } }), { before: '', after: '' });
console.log('PASS: separate context fields, prompt roles, empty context, bounded TreeWalker, word boundaries, range endpoints and reader roots.');

for (const baseUrl of ['http://insecure.example', 'https://user:pass@example.com', 'https://example.com/?key=secret', 'invalid']) {
    await assert.rejects(ask({ ...options, provider: { ...provider, baseUrl } }, () => assert.fail('insecure request sent')), { key: 'askHttps' });
}
for (const status of [401, 403, 429, 400, 500]) {
    await assert.rejects(ask({ ...options, provider }, async () => new Response('private provider details', { status })), { key: describeError(status) });
}
await assert.rejects(ask({ ...options, provider }, async () => { throw new TypeError('network private details'); }), { key: 'askNetwork' });
await assert.rejects(ask({ ...options, provider: PROVIDERS.find(p => p.id === 'anthropic') }, async () => Response.json({ stop_reason: 'refusal' })), { key: 'askRefusal' });
let cancelled = false, opened;
const ready = new Promise(resolve => { opened = resolve; });
const pending = ask({ ...options, provider }, async () => new Response(new ReadableStream({ start(controller) {
    controller.enqueue(new TextEncoder().encode('data: {"choices":')); opened();
}, cancel() { cancelled = true; } })));
await ready;
// Allow the reader to enter its pending read before aborting.
await new Promise(resolve => setImmediate(resolve));
cancelAsk();
await assert.rejects(pending, { name: 'AbortError' });
assert.ok(cancelled, 'underlying stream is cancelled');
assert.equal(await ask({ ...options, provider }, async () => new Response('data: {"choices":[{"delta":{"content":"fresh"}}]}\n\ndata: [DONE]\n\n')), 'fresh', 'aborted stream leaves no pending parse state');
console.log('PASS: both adapters, secret isolation, SSE/UTF-8 boundaries, refusal, errors, HTTPS, redirect protection and abort cleanup.');
