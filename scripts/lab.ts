import { parseArgs } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  SCENARIOS,
  DEFAULT_PARAMETERS,
  runLab,
  createTape,
  runStrategy,
  type ScenarioId,
  type Strategy,
} from '../lib/engine';
const { values } = parseArgs({
  options: {
    scenario: { type: 'string', default: 'partial-fill' },
    seed: { type: 'string', default: '42' },
    requested: { type: 'string', default: '10' },
    liquidity: { type: 'string', default: '3' },
    'no-fault': { type: 'boolean' },
    all: { type: 'boolean' },
    out: { type: 'string' },
    strategy: { type: 'string' },
    'fail-on-reference': { type: 'boolean' },
  },
});
try {
  const ids = values.all
    ? SCENARIOS.map((s) => s.id)
    : [values.scenario as ScenarioId];
  if (ids.some((id) => !SCENARIOS.some((s) => s.id === id)))
    throw Error('Unknown scenario. Use partial-fill, rollover or recovery.');
  const params = {
    ...DEFAULT_PARAMETERS,
    seed: Number(values.seed),
    requested: Number(values.requested),
    liquidity: Number(values.liquidity),
    fault: !values['no-fault'],
  };
  let custom: Strategy | undefined;
  if (values.strategy) {
    custom = (await import(pathToFileURL(resolve(values.strategy)).href))
      .default;
    if (
      !custom ||
      typeof custom.reduce !== 'function' ||
      typeof custom.name !== 'string'
    )
      throw Error('Strategy must default-export { name, reduce }.');
  }
  const reports = ids.map((id) => ({
    report: runLab(id, params),
    ...(custom ? { custom: runStrategy(createTape(id, params), custom) } : {}),
  }));
  let revision = 'uncommitted';
  try {
    revision = execFileSync('git', ['rev-parse', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {}
  const payload = {
    schema: 'windtunnel.suite.v1',
    revision,
    sdk: '0.28.1',
    reports,
  };
  const artifact = {
    payload,
    sha256: createHash('sha256').update(JSON.stringify(payload)).digest('hex'),
    hashScope: 'UTF-8 JSON.stringify(payload)',
  };
  if (values.out) {
    await mkdir(dirname(resolve(values.out)), { recursive: true });
    await writeFile(
      resolve(values.out),
      JSON.stringify(artifact, null, 2) + '\n',
    );
  }
  for (const r of reports)
    console.log(
      `${r.report.scenario}: reference ${r.report.reference.passed ? 'PASS' : 'FAIL'} | repaired ${r.report.repaired.passed ? 'PASS' : 'FAIL'}${r.custom ? ` | ${r.custom.mode}: ${r.custom.passed ? 'PASS' : 'FAIL'}` : ''} | ${r.report.fingerprint}`,
    );
  console.log(`SHA-256 ${artifact.sha256}`);
  if (values.out) console.log(`Saved ${values.out}`);
  if (
    reports.some(
      (r) =>
        !r.report.repaired.passed ||
        (r.custom && !r.custom.passed) ||
        (values['fail-on-reference'] && !r.report.reference.passed),
    )
  )
    process.exitCode = 1;
} catch (e) {
  console.error(e instanceof Error ? e.message : String(e));
  process.exitCode = 2;
}
