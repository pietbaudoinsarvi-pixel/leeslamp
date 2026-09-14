import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const timestamp = new Date().toISOString().replace(/\D/g, '').slice(0, 12);
let version = timestamp;
try {
    const hash = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (/^[a-f0-9]+$/i.test(hash)) version = `${hash}-${timestamp}`;
} catch { /* Outside a Git checkout, the timestamp identifies the deployment. */ }
writeFileSync(new URL('../version.js', import.meta.url), `self.LEESLAMP_VERSION = '${version}';\n`);
