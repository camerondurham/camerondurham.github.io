import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { prepareLocalRuntime } from './guestbook-local-runtime.mjs';

const cli = process.env.WRANGLER_BIN || resolve('node_modules/.bin/wrangler');
const env = { ...process.env, WRANGLER_LOG_PATH: resolve('.wrangler/logs'), WRANGLER_SEND_METRICS: 'false' };
mkdirSync(env.WRANGLER_LOG_PATH, { recursive: true });
const version = spawnSync(cli, ['--version'], { env, encoding: 'utf8' });
if (version.status !== 0 || !/^4\.156\.0\s*$/m.test(version.stdout)) throw new Error('Wrangler 4.156.0 required. Set WRANGLER_BIN to that installed binary.');
const [mode, ...extra] = process.argv.slice(2);
const port = Number(process.env.GUESTBOOK_PORT || '8094');
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('GUESTBOOK_PORT must be 1024..65535.');
const config = ['--config', 'wrangler.local.jsonc'];
const state = ['--persist-to', resolve(process.env.GUESTBOOK_STATE_DIR || '.wrangler/guestbook')];
const commands = {
  migrate: ['d1', 'migrations', 'apply', 'guestbook-local', '--local', ...config, ...state],
  start: ['pages', 'dev', '--local', '--ip', '127.0.0.1', '--port', String(port), '--inspector-port', '0', ...state],
  inbox: ['d1', 'execute', 'guestbook-local', '--local', ...config, ...state, '--command', "SELECT id, created_at, name, note, model, referrer FROM guestbook_submissions WHERE status = 'pending' ORDER BY id DESC LIMIT 20"],
  sql: ['d1', 'execute', 'guestbook-local', '--local', ...config, ...state],
};
if (!commands[mode] || (mode === 'sql' ? !(extra[0] === '--command' && typeof extra[1] === 'string' && (extra.length === 2 || (extra.length === 3 && extra[2] === '--json'))) : extra.length !== 0)) throw new Error('Use migrate|start|inbox|sql. Local operations only.');
if (mode === 'start') {
  const { createServer } = await import('node:net');
  await new Promise((resolvePort, reject) => {
    const probe = createServer();
    probe.once('error', () => reject(new Error(`Port ${port} is occupied; choose another GUESTBOOK_PORT.`)));
    probe.listen(port, '127.0.0.1', () => probe.close(resolvePort));
  });
}
const runtime = mode === 'start' ? prepareLocalRuntime() : process.cwd();
const child = spawnSync(cli, [...commands[mode], ...(mode === 'start' ? ['--cwd', runtime] : []), ...extra], { env, stdio: 'inherit', cwd: runtime });
process.exit(child.status ?? 1);
