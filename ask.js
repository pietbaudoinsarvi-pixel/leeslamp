export const ADAPTERS = {
    openai: {
        path: 'chat/completions',
        headers: key => ({ Authorization: `Bearer ${key}` }),
        body: (model, system, content) => ({ model, messages: [{ role: 'system', content: system }, { role: 'user', content }], max_tokens: 2000, stream: true }),
        delta: event => event.choices?.[0]?.delta?.content || '',
    },
    anthropic: {
        path: 'messages',
        headers: key => ({ 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }),
        body: (model, system, content) => ({ model, system, messages: [{ role: 'user', content }], max_tokens: 2000, stream: true,
            ...(model === 'claude-opus-5' ? { output_config: { effort: 'low' } } : {}) }),
        delta: event => event.type === 'content_block_delta' ? event.delta?.text || '' : '',
    },
};
// Prices are the supplied input/output USD per million tokens. Unknown prices stay blank.
export const PROVIDERS = [
    { id: 'deepseek', label: 'DeepSeek', adapter: 'openai', baseUrl: 'https://api.deepseek.com', models: [{ id: 'deepseek-chat', cheapest: true }], keyHint: 'https://platform.deepseek.com/api_keys' },
    { id: 'xai', label: 'xAI (Grok)', adapter: 'openai', baseUrl: 'https://api.x.ai/v1', models: [{ id: 'grok-4.6', price: [2, 6] }], keyHint: 'https://console.x.ai' },
    { id: 'openai', label: 'OpenAI', adapter: 'openai', baseUrl: 'https://api.openai.com/v1', models: [{ id: 'gpt-5.6-luna' }], keyHint: 'https://platform.openai.com/api-keys' },
    // Google's OpenAI-compatible endpoint; the free tier needs no billing details.
    { id: 'google', label: 'Google (Gemini)', adapter: 'openai', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', models: [
        { id: 'gemini-3.8-flash', free: true }, { id: 'gemini-3.5-flash-lite', free: true },
    ], keyHint: 'https://aistudio.google.com/apikey' },
    { id: 'openrouter', label: 'OpenRouter', adapter: 'openai', baseUrl: 'https://openrouter.ai/api/v1', models: [{ id: 'deepseek/deepseek-chat' }], keyHint: 'https://openrouter.ai/settings/keys' },
    { id: 'anthropic', label: 'Anthropic', adapter: 'anthropic', baseUrl: 'https://api.anthropic.com/v1', models: [
        { id: 'claude-opus-5', price: [5, 25] }, { id: 'claude-sonnet-5', price: [2, 10] }, { id: 'claude-haiku-4-5', price: [1, 5] },
    ], keyHint: 'https://platform.claude.com/settings/keys' },
    { id: 'custom', label: 'askOther', adapter: 'openai', baseUrl: '', models: [], keyHint: '' },
];
const failure = key => Object.assign(new Error(key), { key });
export function buildRequest(provider, { passage, question, book = {}, chapter, language, model, key }) {
    let base;
    try { base = new URL(provider.baseUrl); } catch { throw failure('askHttps'); }
    if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash) throw failure('askHttps');
    const adapter = ADAPTERS[provider.adapter];
    if (!adapter || !model || !key) throw failure('askNoAnswer');
    const system = `You help a reader understand a passage from a book. Answer in ${language === 'nl' ? 'Dutch' : 'English'}. Be concise: a short paragraph, no preamble, no bullet lists unless the passage is a list. If the passage is ambiguous, say what it most likely means and why.`;
    const content = JSON.stringify({ title: typeof book === 'string' ? book : book.title || '',
        author: book.author || '', chapter: chapter || '', passage, question });
    return { url: base.href.replace(/\/$/, '') + '/' + adapter.path,
        headers: { 'content-type': 'application/json', ...adapter.headers(key) }, body: adapter.body(model, system, content) };
}
export function describeError(status, body) {
    if (body?.stop_reason === 'refusal' || body?.delta?.stop_reason === 'refusal' || body?.message?.stop_reason === 'refusal') return 'askRefusal';
    if (status === 401 || status === 403) return 'askKeyError';
    if (status === 429) return 'askRateLimit';
    return !status ? 'askNetwork' : 'askNoAnswer';
}
export function parseStream(adapter, chunkText, state) {
    if (state.done) return { text: '', done: true };
    state.buffer = (state.buffer || '') + chunkText;
    let text = '', boundary;
    // Keep incomplete SSE frames, including CRLF and UTF-8 chunk boundaries.
    while ((boundary = /\r?\n\r?\n/.exec(state.buffer))) {
        const frame = state.buffer.slice(0, boundary.index);
        state.buffer = state.buffer.slice(boundary.index + boundary[0].length);
        const data = frame.split(/\r?\n/).filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
        if (!data) continue;
        if (data.trim() === '[DONE]') { state.done = true; break; }
        let event;
        try { event = JSON.parse(data); } catch { throw failure('askNoAnswer'); }
        if (describeError(200, event) === 'askRefusal') {
            state.done = true; state.buffer = ''; throw failure('askRefusal');
        }
        if (event.error || event.type === 'error') throw failure('askNoAnswer');
        text += ADAPTERS[adapter].delta(event);
        if (event.type === 'message_stop') { state.done = true; break; }
    }
    if (state.done) state.buffer = '';
    return { text, done: !!state.done };
}
let pending;
export function cancelAsk() { pending?.abort(); pending = null; }
export async function ask(options, fetchImpl = fetch) {
    cancelAsk();
    const request = buildRequest(options.provider, options);
    const controller = new AbortController(); pending = controller;
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(30000), ...(options.signal ? [options.signal] : [])]);
    const state = { buffer: '', done: false };
    let reader, answer = '';
    const abortReader = () => { void reader?.cancel().catch(() => {}); };
    try {
        signal.throwIfAborted();
        const response = await fetchImpl(request.url, { method: 'POST', headers: request.headers,
            body: JSON.stringify(request.body), signal, redirect: 'error', credentials: 'omit' });
        if (!response.ok) throw failure(describeError(response.status));
        // Some endpoints return a non-streamed refusal with HTTP 200.
        if (response.headers?.get('content-type')?.includes('application/json')) {
            throw failure(describeError(200, await response.json()));
        }
        if (!response.body) throw failure('askNoAnswer');
        reader = response.body.getReader();
        signal.addEventListener('abort', abortReader, { once: true });
        const decoder = new TextDecoder();
        while (!state.done) {
            signal.throwIfAborted();
            const chunk = await reader.read();
            signal.throwIfAborted();
            const part = parseStream(options.provider.adapter, chunk.done ? decoder.decode() + '\n\n' : decoder.decode(chunk.value, { stream: true }), state);
            if (part.text) { answer += part.text; options.onText?.(part.text); }
            if (chunk.done) break;
        }
        if (!answer) throw failure('askNoAnswer');
        return answer;
    } catch (error) {
        if (controller.signal.aborted || options.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
        throw failure(error.key || 'askNetwork');
    } finally {
        signal.removeEventListener('abort', abortReader);
        state.buffer = ''; state.done = true;
        try { await reader?.cancel(); } catch { /* Cancellation must always release the reader. */ }
        reader?.releaseLock();
        if (pending === controller) pending = null;
    }
}
