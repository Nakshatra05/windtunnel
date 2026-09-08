import { mkdir, writeFile, rename } from 'node:fs/promises';
import type { Hex } from 'viem';
import type { TxResult } from '@somnia-chain/markets-sdk';
export interface Evidence {
  schema: string;
  provenance: string;
  chainId: number;
  sdk: string;
  createdAt: string;
  owner: Hex;
  maker?: Hex;
  market: { marketId: Hex; pool: Hex; expiry: string; asset: string };
  marketState?: unknown;
  before?: unknown;
  after?: unknown;
  steps: {
    action: string;
    hash: Hex;
    block: string;
    status: string;
    gasUsed: string;
    details?: unknown;
  }[];
  state: string;
  error?: string;
  redemptions?: unknown[];
  reconciliation?: unknown;
}
export const json = (value: unknown) =>
  JSON.stringify(value, (_, v) => (typeof v === 'bigint' ? String(v) : v), 2) +
  '\n';
export async function persist(e: Evidence) {
  await mkdir('public/evidence', { recursive: true });
  const path = 'public/evidence/lifecycle.json';
  await writeFile(path + '.tmp', json(e));
  await rename(path + '.tmp', path);
  await mkdir('data', { recursive: true });
  await writeFile('data/lifecycle.json', json(e));
}
export async function record(
  e: Evidence,
  action: string,
  tx: TxResult,
  details?: unknown,
) {
  e.steps.push({
    action,
    hash: tx.hash,
    block: String(tx.receipt.blockNumber),
    status: tx.receipt.status,
    gasUsed: String(tx.receipt.gasUsed),
    ...(details ? { details } : {}),
  });
  await persist(e);
  if (tx.receipt.status !== 'success')
    throw Error(`${action} reverted; evidence saved.`);
  console.log(`${action}: ${tx.hash}`);
}
