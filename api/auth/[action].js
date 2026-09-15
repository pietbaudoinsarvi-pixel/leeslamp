import { createHash, createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from 'node:crypto';

const scopes = 'openid email profile https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata';
const tokenURL = 'https://oauth2.googleapis.com/token';
const cookie = (name, value, age) => `${name}=${value}; HttpOnly; Secure; SameSite=Lax; Path=/api/auth; Max-Age=${age}`;
const allowedReturn = value => value === '/' || value === '/en';
function seal(value, key) {
    const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key, iv);
    const data = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    return 'v1.' + Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64url');
}
function open(value, key) {
    if (!value?.startsWith('v1.')) throw new Error('Invalid cookie');
    const data = Buffer.from(value.slice(3), 'base64url');
    const decipher = createDecipheriv('aes-256-gcm', key, data.subarray(0, 12));
    decipher.setAuthTag(data.subarray(12, 28));
    return Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString('utf8');
}

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    const { GOOGLE_CLIENT_ID: clientId, GOOGLE_CLIENT_SECRET: clientSecret, COOKIE_SECRET: secret } = process.env;
    if (!clientId || !clientSecret || !secret || secret.length < 32) return res.status(501).json({ error: 'Cloud unavailable' });
    const action = req.query?.action;
    const method = { login: 'GET', callback: 'GET', token: 'POST', logout: 'POST' }[action];
    if (!method) return res.status(404).json({ error: 'Not found' });
    if (req.method !== method) {
        res.setHeader('Allow', method);
        return res.status(405).json({ error: 'Method not allowed' });
    }
    const key = createHash('sha256').update(secret).digest();
    const cookies = Object.fromEntries((req.headers.cookie || '').split(';').map(value => {
        const i = value.indexOf('=');
        return [value.slice(0, i).trim(), value.slice(i + 1).trim()];
    }));
    const redirect = url => { res.setHeader('Location', url); return res.status(302).end(); };
    const clear = () => res.setHeader('Set-Cookie', cookie('leeslamp_rt', '', 0));
    // Production uses HTTPS; localhost also supports vercel dev.
    const host = req.headers.host;
    const protocol = host && /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host) ? 'http' : 'https';
    const redirectURI = `${protocol}://${host}/api/auth/callback`;
    function login(returnTo, consent = false) {
        const state = randomBytes(32).toString('base64url');
        res.setHeader('Set-Cookie', cookie('leeslamp_state', seal(JSON.stringify({ state, returnTo, consent, expires: Date.now() + 600000 }), key), 600));
        const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirectURI,
            response_type: 'code', scope: scopes, access_type: 'offline', include_granted_scopes: 'true', state });
        if (consent) params.set('prompt', 'consent');
        return redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
    }
    const exchange = body => fetch(tokenURL, { method: 'POST', signal: AbortSignal.timeout(8000),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, ...body }) });
    if (action === 'login') {
        const returnTo = req.query.return ?? '/';
        if (!allowedReturn(returnTo)) return res.status(400).json({ error: 'Invalid return' });
        return login(returnTo);
    }
    if (action === 'callback') {
        let saved;
        try {
            saved = JSON.parse(open(cookies.leeslamp_state, key));
            const actual = Buffer.from(typeof req.query.state === 'string' ? req.query.state : '');
            const expected = Buffer.from(saved.state);
            if (actual.length !== expected.length || !timingSafeEqual(actual, expected)
                || !allowedReturn(saved.returnTo) || saved.expires < Date.now()) throw new Error('Invalid state');
        } catch { return res.status(400).json({ error: 'Invalid state' }); }
        const clearState = cookie('leeslamp_state', '', 0);
        res.setHeader('Set-Cookie', clearState);
        if (req.query.error) return redirect(`${saved.returnTo}?auth=cancelled`);
        if (typeof req.query.code !== 'string' || !req.query.code) return res.status(400).json({ error: 'Missing code' });
        try {
            const response = await exchange({ grant_type: 'authorization_code', code: req.query.code, redirect_uri: redirectURI });
            if (!response.ok) throw new Error('Token exchange failed');
            const data = await response.json();
            if (!data.refresh_token) {
                if (!saved.consent) return login(saved.returnTo, true);
                return redirect(`${saved.returnTo}?auth=cancelled`);
            }
            res.setHeader('Set-Cookie', [clearState, cookie('leeslamp_rt', seal(data.refresh_token, key), 400 * 86400)]);
            return redirect(saved.returnTo);
        } catch { return res.status(502).json({ error: 'Authentication failed' }); }
    }
    let refreshToken;
    try { refreshToken = open(cookies.leeslamp_rt, key); }
    catch {
        clear();
        return action === 'logout' ? res.status(204).end() : res.status(401).json({ error: 'Signed out' });
    }
    if (action === 'logout') {
        // No Google revoke: that would drop the grant for every device. Clearing this device's cookie is enough.
        clear();
        return res.status(204).end();
    }
    try {
        const response = await exchange({ grant_type: 'refresh_token', refresh_token: refreshToken });
        const data = await response.json();
        if (data.error === 'invalid_grant') { clear(); return res.status(401).json({ error: 'Signed out' }); }
        if (!response.ok || !data.access_token || !data.id_token) throw new Error('Token refresh failed');
        const user = JSON.parse(Buffer.from(data.id_token.split('.')[1], 'base64url').toString('utf8'));
        if (typeof user.sub !== 'string' || !user.sub) throw new Error('Invalid user');
        return res.status(200).json({ accessToken: data.access_token, expiresIn: data.expires_in,
            user: { id: user.sub, email: user.email, name: user.name, picture: user.picture } });
    } catch { return res.status(502).json({ error: 'Authentication failed' }); }
}
