import { mkdirSync, readFileSync, writeFileSync, cpSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';

// Pages requires a standard config filename; stage an isolated local root rather
// than rename or edit the production wrangler.jsonc.
export function prepareLocalRuntime(directory = '.wrangler/guestbook-pages') {
  const root = resolve(directory);
  mkdirSync(root, { recursive: true });
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'u64-guestbook-local', private: true, type: 'module' }));
  const config = JSON.parse(readFileSync('wrangler.local.jsonc', 'utf8'));
  config.pages_build_output_dir = './dist';
  config.d1_databases[0].migrations_dir = resolve('migrations');
  writeFileSync(join(root, 'wrangler.jsonc'), JSON.stringify(config, null, 2));
  // Keep real local paths: Pages resolves config relative to the output directory.
  for (const directory of ['dist', 'functions']) {
    rmSync(join(root, directory), { recursive: true, force: true });
    cpSync(resolve(directory), join(root, directory), { recursive: true });
  }
  return root;
}
