import evidence from '@/data/lifecycle.json';
import { publicClient } from '@/lib/testnet';
import type { Hex } from 'viem';

export const dynamic = 'force-dynamic';
export async function GET() {
  const client = publicClient();
  try {
    if ((await client.getChainId()) !== 50312)
      throw new Error('Unexpected network. Expected Somnia Shannon.');
    const results = await Promise.allSettled(
      evidence.steps.map(async (step) => {
        const receipt = await client.getTransactionReceipt({
          hash: step.hash as Hex,
        });
        return {
          hash: step.hash,
          action: step.action,
          status: receipt.status,
          block: receipt.blockNumber.toString(),
          matched:
            receipt.status === step.status &&
            receipt.blockNumber.toString() === step.block,
        };
      }),
    );
    const receipts = results.map((result, i) =>
      result.status === 'fulfilled'
        ? result.value
        : {
            hash: evidence.steps[i].hash,
            action: evidence.steps[i].action,
            status: 'unavailable',
            block: null,
            matched: false,
          },
    );
    return Response.json(
      {
        chainId: 50312,
        observedAt: new Date().toISOString(),
        receipts,
        verified: receipts.filter((r) => r.matched).length,
        total: receipts.length,
        scope:
          'Receipt status and block number checked against the recorded evidence. This does not independently recompute historical token balances.',
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return Response.json(
      {
        error:
          'Could not verify the Shannon connection. Retry the check or inspect the explorer links below.',
      },
      { status: 503 },
    );
  }
}
