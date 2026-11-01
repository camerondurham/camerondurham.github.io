#!/usr/bin/env node

import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function parseOptions(argv) {
  const options = {
    dataset: process.env.CLOUDFLARE_ANALYTICS_DATASET || 'u64_page_requests',
    hours: 24,
    limit: 20,
    healthMaxAgeMinutes: undefined,
  };

  for (const argument of argv) {
    const [name, value] = argument.split('=', 2);
    if (name === '--dataset') options.dataset = value;
    else if (name === '--hours') options.hours = Number(value);
    else if (name === '--limit') options.limit = Number(value);
    else if (name === '--health-max-age-minutes') options.healthMaxAgeMinutes = Number(value);
    else throw new Error(`Unknown option: ${argument}`);
  }

  if (!IDENTIFIER.test(options.dataset)) throw new Error('Dataset must be a SQL identifier');
  for (const [name, value] of [['hours', options.hours], ['limit', options.limit]]) {
    if (!Number.isInteger(value) || value < 1 || value > 1000) {
      throw new Error(`${name} must be an integer from 1 to 1000`);
    }
  }
  if (options.healthMaxAgeMinutes !== undefined &&
      (!Number.isInteger(options.healthMaxAgeMinutes) || options.healthMaxAgeMinutes < 1)) {
    throw new Error('health-max-age-minutes must be a positive integer');
  }
  return options;
}

export function buildQueries({ dataset, hours, limit }) {
  const window = `timestamp >= NOW() - INTERVAL '${hours}' HOUR`;
  return {
    latest: `SELECT timestamp, index1 AS route_category, blob1 AS path, blob3 AS user_agent, double1 AS status FROM ${dataset} WHERE ${window} ORDER BY timestamp DESC LIMIT 1`,
    routes: `SELECT index1 AS route_category, sum(_sample_interval) AS requests FROM ${dataset} WHERE ${window} GROUP BY route_category ORDER BY requests DESC LIMIT ${limit}`,
    clients: `SELECT blob3 AS user_agent, blob7 AS network, blob13 AS bot_class, sum(_sample_interval) AS requests FROM ${dataset} WHERE ${window} GROUP BY user_agent, network, bot_class ORDER BY requests DESC LIMIT ${limit}`,
    canaries: `SELECT blob1 AS path, blob3 AS user_agent, blob4 AS referrer_origin, sum(_sample_interval) AS requests FROM ${dataset} WHERE ${window} AND index1='canary' GROUP BY path, user_agent, referrer_origin ORDER BY requests DESC LIMIT ${limit}`,
  };
}

export function latestAgeMinutes(timestamp, now = Date.now()) {
  if (!timestamp) return Infinity;
  const parsed = Date.parse(`${timestamp.replace(' ', 'T')}Z`);
  return Number.isFinite(parsed) ? Math.max(0, (now - parsed) / 60_000) : Infinity;
}

async function query(accountId, token, sql) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/analytics_engine/sql`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'text/plain',
      },
      body: sql,
    },
  );
  const body = await response.text();
  if (!response.ok) throw new Error(`Analytics Engine query failed (${response.status}): ${body}`);
  const parsed = JSON.parse(body);
  return parsed.data ?? [];
}

async function main() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !token) {
    throw new Error('Set CLOUDFLARE_ACCOUNT_ID and a CLOUDFLARE_API_TOKEN with Account Analytics Read permission');
  }

  const options = parseOptions(process.argv.slice(2));
  const queries = buildQueries(options);
  const results = {};
  for (const [name, sql] of Object.entries(queries)) {
    results[name] = await query(accountId, token, sql);
    console.log(`\n== ${name} ==`);
    console.table(results[name]);
  }

  if (options.healthMaxAgeMinutes !== undefined) {
    const age = latestAgeMinutes(results.latest[0]?.timestamp);
    if (age > options.healthMaxAgeMinutes) {
      throw new Error(`No edge analytics event within ${options.healthMaxAgeMinutes} minutes (latest age: ${Number.isFinite(age) ? age.toFixed(1) : 'unknown'})`);
    }
    console.log(`\nHealth check passed: latest event is ${age.toFixed(1)} minutes old.`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
