import { mkdir, writeFile } from 'node:fs/promises';
import { discover } from '../lib/testnet';
try {
  const observation = await discover(40);
  await mkdir('public/evidence', { recursive: true });
  await writeFile(
    'public/evidence/observation.json',
    JSON.stringify(observation, null, 2) + '\n',
  );
  console.log(JSON.stringify(observation, null, 2));
} catch (e) {
  console.error(e instanceof Error ? e.message : String(e));
  process.exitCode = 1;
}
