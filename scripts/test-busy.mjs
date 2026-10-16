// The wait line from busy() in app.js: timing, the seconds counter and who owns the toast or the place.
// Runs the real toast/busy block from app.js against a fake clock and fake elements; no browser needed.
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';

const source = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const start = source.indexOf('let toastTimer');
const end = source.indexOf('\nconst failureMessage', start);
assert.ok(start >= 0 && end > start, 'toast/busy block not found in app.js');

let clock = 0, timers = [], seq = 0;
const toastEl = { hidden: true, textContent: '' }, placeEl = { hidden: true, textContent: '' };
const env = {
    Date: { now: () => clock },
    setTimeout: (fn, ms = 0) => { timers.push({ id: ++seq, at: clock + ms, fn }); return seq; },
    clearTimeout: id => { timers = timers.filter(timer => timer.id !== id); },
    t: (key, params) => key === 'busySeconds' ? `${params.label} ${params.seconds} s` : key,
    $: selector => ({ '#toast': toastEl, '#r-status': placeEl })[selector],
};
const { toast, busy } = runInNewContext(`${source.slice(start, end)}; ({ toast, busy })`, env);
const flush = () => new Promise(resolve => setImmediate(resolve));
async function to(ms) {
    for (;;) {
        timers.sort((a, b) => a.at - b.at || a.id - b.id);
        if (!timers.length || timers[0].at > ms) break;
        const next = timers.shift(); clock = next.at; next.fn(); await flush();
    }
    clock = ms; await flush();
}
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const reset = () => { clock = 0; timers = []; toastEl.hidden = placeEl.hidden = true; toastEl.textContent = placeEl.textContent = ''; };
const toastText = () => toastEl.hidden ? null : toastEl.textContent;

// Under 300 ms nothing shows.
reset(); { const work = deferred(); busy(work.promise, 'busySaving'); await to(250); work.resolve(); await to(1000); assert.equal(toastText(), null); }

// Line at 300 ms, counter exactly at 3 s, gone on settle; a button is busy meanwhile.
reset(); {
    const work = deferred(), attrs = {};
    const button = { disabled: false, setAttribute: (k, v) => { attrs[k] = v; }, removeAttribute: k => { delete attrs[k]; } };
    busy(work.promise, 'busySaving', { button });
    assert.equal(button.disabled, true); assert.equal(attrs['aria-busy'], 'true');
    await to(299); assert.equal(toastText(), null);
    await to(300); assert.equal(toastText(), 'busySaving');
    await to(2999); assert.equal(toastText(), 'busySaving');
    await to(3000); assert.equal(toastText(), 'busySaving 3 s');
    await to(4000); assert.equal(toastText(), 'busySaving 4 s');
    work.resolve(); await flush();
    assert.equal(toastText(), null); assert.equal(button.disabled, false); assert.equal(attrs['aria-busy'], undefined);
}

// Keurder repro: an error toast at 100 ms is not covered at 300 ms and not hidden on settle.
reset(); {
    const work = deferred();
    busy(work.promise, 'busySaving');
    await to(100); toast('error');
    await to(400); assert.equal(toastText(), 'error');
    work.resolve(); await flush(); assert.equal(toastText(), 'error');
}

// A message after the line showed wins; settling leaves it alone. Once it expires, a running action shows again.
reset(); {
    const work = deferred();
    busy(work.promise, 'busySaving');
    await to(500); assert.equal(toastText(), 'busySaving');
    toast('other', 2000);
    await to(1500); assert.equal(toastText(), 'other');
    await to(3000); assert.equal(toastText(), 'busySaving 3 s');
    work.resolve(); await flush(); assert.equal(toastText(), null);
}
reset(); {
    const work = deferred();
    busy(work.promise, 'busySaving');
    await to(500); toast('other');
    work.resolve(); await flush(); assert.equal(toastText(), 'other');
}

// Place: a later action owns it; the earlier one settling does not hide the later line. Abort clears.
reset(); {
    const first = deferred(), second = deferred();
    busy(first.promise, 'busyPage', { place: placeEl });
    await to(400); assert.equal(placeEl.hidden, false);
    busy(second.promise, 'busyPage', { place: placeEl });
    first.resolve(); await flush(); assert.equal(placeEl.hidden, false);
    second.resolve(); await flush(); assert.equal(placeEl.hidden, true);
    const controller = new AbortController();
    busy(new Promise(() => {}), 'busyPage', { place: placeEl, signal: controller.signal });
    await to(1000); assert.equal(placeEl.hidden, false);
    controller.abort(); assert.equal(placeEl.hidden, true);
    await to(5000); assert.equal(placeEl.hidden, true);
}

console.log('PASS: busy() waits 300 ms, counts from 3 s, never covers or hides a later message, clears on settle and abort.');
