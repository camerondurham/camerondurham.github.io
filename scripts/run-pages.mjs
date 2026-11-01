#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'jsonc-parser';

const repoRoot = resolve(import.meta.dirname, '..');

export function buildVariables(config, environment) {
  const vars = config.env?.[environment]?.vars ?? config.vars;
  if (!vars || typeof vars !== 'object' || Array.isArray(vars)) return {};

  return Object.fromEntries(Object.entries(vars).map(([name, value]) => {
    if (!['string', 'number', 'boolean'].includes(typeof value)) {
      throw new Error(`wrangler.jsonc variable ${name} must be a string, number, or boolean`);
    }
    return [name, String(value)];
  }));
}

export function pagesBuildEnvironment(environment) {
  const branch = environment.CF_PAGES_BRANCH;
  const productionBranch = environment.CF_PAGES_PRODUCTION_BRANCH || 'main';
  return branch && branch !== productionBranch ? 'preview' : 'production';
}

export function parseWranglerConfig(source) {
  const errors = [];
  const config = parse(source, errors, { allowTrailingComma: true });
  if (errors.length > 0 || !config || typeof config !== 'object') {
    throw new Error('Could not parse wrangler.jsonc');
  }
  return config;
}

function run(command, args, options = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      stdio: 'inherit',
      ...options,
    });
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${command} ${args.join(' ')} exited with ${code ?? signal}`));
    });
  });
}

async function build(environment) {
  const source = await readFile(resolve(repoRoot, 'wrangler.jsonc'), 'utf8');
  const config = parseWranglerConfig(source);
  const env = { ...process.env, ...buildVariables(config, environment) };
  const npmCli = process.env.npm_execpath;
  if (npmCli) await run(process.execPath, [npmCli, 'run', 'build'], { env });
  else await run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], { env });
}

async function main() {
  const [command, ...extraArgs] = process.argv.slice(2);
  if (!['build-auto', 'build-production', 'build-preview', 'deploy', 'dev'].includes(command)) {
    throw new Error('Usage: node scripts/run-pages.mjs <build-auto|build-production|build-preview|deploy|dev> [wrangler args]');
  }

  const environment = command === 'build-auto'
    ? pagesBuildEnvironment(process.env)
    : command === 'build-preview' || command === 'dev'
      ? 'preview'
      : 'production';
  await build(environment);
  if (command.startsWith('build-')) return;

  const wranglerCli = resolve(repoRoot, 'node_modules/wrangler/bin/wrangler.js');
  const wranglerCommand = command === 'deploy'
    ? ['pages', 'deploy', 'dist', ...extraArgs]
    : ['pages', 'dev', 'dist', ...extraArgs];
  await run(process.execPath, [wranglerCli, ...wranglerCommand], { env: process.env });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
