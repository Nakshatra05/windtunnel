import {
  SomniaMarkets,
  SOMNIA_TESTNET_ADDRESSES,
} from '@somnia-chain/markets-sdk';
import { createPublicClient, http, parseAbiItem, type Hex } from 'viem';
import { somniaTestnet } from 'viem/chains';
export const RPC = 'https://dream-rpc.somnia.network';
export const TESTNET_CHAIN = {
  ...somniaTestnet,
  rpcUrls: { default: { http: [RPC] } },
};
export const creationEvent = parseAbiItem(
  'event MarketCreated(bytes32 indexed marketId, address indexed market, address indexed pool, uint256 yesId, uint256 noId, address collateral, string asset, uint256 strike, uint64 tradingStart, uint64 expiry, uint256 oracleQuestionId, string question, uint64 intervalSec)',
);
export function exchange(privateKey?: Hex) {
  return new SomniaMarkets({
    chain: TESTNET_CHAIN,
    addresses: SOMNIA_TESTNET_ADDRESSES,
    indexerUrl: 'https://dev.smk.somnia.host/v1/graphql',
    wsRpcUrl: 'wss://api.infra.testnet.somnia.network/ws',
    ...(privateKey ? { privateKey } : {}),
  });
}
export function publicClient() {
  return createPublicClient({
    chain: TESTNET_CHAIN,
    transport: http(RPC, { timeout: 10000, retryCount: 1 }),
  });
}
export async function discover(scanWindows = 8) {
  const pub = publicClient(),
    ex = exchange();
  try {
    const [chainId, head] = await Promise.all([
      pub.getChainId(),
      pub.getBlockNumber(),
    ]);
    if (chainId !== 50312)
      throw Error('Unexpected chain. Only Somnia Shannon is supported.');
    const records = new Map<
      string,
      {
        marketId: Hex;
        pool: Hex;
        asset: string;
        expiry: string;
        status: number;
        intervalSec: number;
      }
    >();
    let failedRanges = 0;
    for (let batch = 0; batch < scanWindows; batch += 4) {
      const results = await Promise.allSettled(
        Array.from(
          { length: Math.min(4, scanWindows - batch) },
          async (_, j) => {
            const to = head - BigInt((batch + j) * 1000);
            return pub.getLogs({
              event: creationEvent,
              fromBlock: to > 999n ? to - 999n : 0n,
              toBlock: to,
            });
          },
        ),
      );
      for (const result of results) {
        if (result.status === 'rejected') {
          failedRanges++;
          continue;
        }
        for (const log of result.value) {
          const a = log.args;
          if (
            !a.marketId ||
            !a.pool ||
            !a.expiry ||
            Number(a.expiry) <= Date.now() / 1000 ||
            a.collateral?.toLowerCase() !==
              SOMNIA_TESTNET_ADDRESSES.testUsdc?.toLowerCase()
          )
            continue;
          records.set(a.marketId, {
            marketId: a.marketId,
            pool: a.pool,
            asset: a.asset || 'Unknown',
            expiry: new Date(Number(a.expiry) * 1000).toISOString(),
            status: 0,
            intervalSec: Number(a.intervalSec),
          });
        }
      }
    }
    if (failedRanges === scanWindows)
      throw Error(
        'RPC connected, but every market log range failed. Retry the bounded scan.',
      );
    const verified = await Promise.allSettled(
      [...records.values()]
        .slice(0, 12)
        .map(async (m) => ({
          ...m,
          status: (await ex.client.getMarketOnchain(m.marketId)).status,
        })),
    );
    return {
      schema: 'windtunnel.observation.v1',
      provenance: 'live-testnet-read',
      observedAt: new Date().toISOString(),
      chainId,
      block: String(head),
      source: RPC,
      scanBlocks: scanWindows * 1000,
      failedRanges,
      markets: verified.flatMap((r) =>
        r.status === 'fulfilled' && r.value.status === 1 ? [r.value] : [],
      ),
    };
  } finally {
    await ex.close();
  }
}
