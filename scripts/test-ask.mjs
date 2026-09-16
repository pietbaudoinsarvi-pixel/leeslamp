import assert from 'node:assert/strict';
import { ADAPTERS, PROVIDERS, buildRequest, parseStream, describeError, ask, cancelAsk } from '../ask.js';

const options = { passage: 'This is the passage.', question: 'What does it mean?', book: { title: 'A book', author: 'An author' }, chapter: 'Chapter 1', language: 'nl', model: 'exact-model', key: 'test-secret-1234' };
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
