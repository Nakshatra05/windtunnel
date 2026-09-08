import { readFile, writeFile } from 'node:fs/promises';
import { erc20Abi, parseEther, formatEther, formatUnits, type Hex } from 'viem';
import {
  owner,
  pub,
  ex,
  ownerWallet,
  balances,
  token,
  ONE,
  fixtureMaker,
} from './wallet';
import { discover } from '../lib/testnet';
import { persist, record, type Evidence } from './evidence';
let evidence: Evidence | undefined,
  maker: ReturnType<typeof fixtureMaker> | undefined;
try {
  if ((await pub.getChainId()) !== 50312)
    throw Error('Only Shannon testnet is allowed.');
  const b = await balances(owner.address);
  console.log(
    `Wallet ${owner.address}: ${formatEther(b.native)} STT / ${formatUnits(b.collateral, 6)} tUSDC`,
  );
  if (b.native < parseEther('4') || b.collateral < 5n * ONE)
    throw Error(
      'Need at least 4 STT and 5 tUSDC for this bounded fixture run.',
    );
  try {
    const previous = JSON.parse(
      await readFile('public/evidence/lifecycle.json', 'utf8'),
    ) as Evidence;
    if (previous.steps.every((s) => s.status === 'reverted')) {
      await writeFile(
        'public/evidence/failed-attempt.json',
        JSON.stringify(previous, null, 2),
      );
    } else if (previous.state !== 'redeemed')
      throw Error(
        'An earlier lifecycle needs recovery/redemption. Preserve it before starting another run.',
      );
  } catch (e) {
    if (!(e && typeof e === 'object' && 'code' in e && e.code === 'ENOENT'))
      throw e;
  }
  let observation: Awaited<ReturnType<typeof discover>>;
  try {
    observation = JSON.parse(
      await readFile('public/evidence/observation.json', 'utf8'),
    );
  } catch {
    observation = await discover(40);
  }
  let market = observation.markets
    .filter((m) => Date.parse(m.expiry) > Date.now() + 180000)
    .sort((a, b) => Date.parse(a.expiry) - Date.parse(b.expiry))[0];
  if (!market) {
    observation = await discover(40);
    market = observation.markets
      .filter((m) => Date.parse(m.expiry) > Date.now() + 180000)
      .sort((a, b) => Date.parse(a.expiry) - Date.parse(b.expiry))[0];
  }
  if (!market)
    throw Error(
      'No live funded-collateral window with three minutes of headroom.',
    );
  const mo = await ex.client.getMarketOnchain(market.marketId);
  if (mo.status !== 1 || mo.finalized)
    throw Error('Selected window is no longer trading.');
  maker = fixtureMaker();
  evidence = {
    schema: 'windtunnel.lifecycle.v1',
    provenance: 'controlled-testnet-fixture',
    chainId: 50312,
    sdk: '0.28.1',
    createdAt: new Date().toISOString(),
    owner: owner.address,
    maker: maker.account.address,
    market,
    marketState: mo,
    before: b,
    steps: [],
    state: 'started',
  };
  await persist(evidence);
  const mb = await balances(maker.account.address);
  if (mb.native < parseEther('1')) {
    const hash = await ownerWallet.sendTransaction({
      to: maker.account.address,
      value: parseEther('2'),
      gas:
        ((await pub.estimateGas({
          account: owner.address,
          to: maker.account.address,
          value: parseEther('2'),
        })) *
          12n) /
        10n,
    });
    await record(evidence, 'fund-fixture-maker-STT', {
      hash,
      receipt: await pub.waitForTransactionReceipt({ hash }),
    });
  }
  if (mb.collateral < 2n * ONE) {
    const hash = await ownerWallet.writeContract({
      address: token,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [maker.account.address, 3n * ONE],
      gas: 3000000n,
    });
    await record(evidence, 'fund-fixture-maker-tUSDC', {
      hash,
      receipt: await pub.waitForTransactionReceipt({ hash }),
    });
  }
  const fresh = await ex.client.getMarketOnchain(market.marketId);
  if (fresh.status !== 1 || Date.parse(market.expiry) < Date.now() + 120000)
    throw Error(
      'Window changed while funding. Recover balances, then select a new window.',
    );
  await record(
    evidence,
    'mint-complete-set',
    await maker.exchange.trader.mintSet({
      pool: market.pool,
      amount: 2n * ONE,
    }),
  );
  const bids = await ex.client.getAllOpenOrdersOnchain(market.pool, {
    isBid: true,
  });
  const bestBid = (bids.orders || []).reduce(
    (n, o) => (o.price > n ? o.price : n),
    0n,
  );
  if (bestBid >= 950000n)
    throw Error('Book is too close to one for a bounded maker fixture.');
  const price = bestBid + 50000n > 600000n ? bestBid + 50000n : 600000n;
  const expireTimestampNs =
    BigInt(
      Math.floor(
        Math.min(Date.now() / 1000 + 90, Date.parse(market.expiry) / 1000),
      ),
    ) * 1000000000n;
  const makerOrder = await maker.exchange.trader.placeOrder({
    pool: market.pool,
    side: 'SELL_YES',
    price,
    quantity: 2n * ONE,
    orderType: 3,
    expireTimestampNs,
  });
  await record(evidence, 'place-maker', makerOrder, {
    orderId: makerOrder.orderId,
    price,
    quantity: 2n * ONE,
  });
  try {
    const fill = await ex.trader.placeOrder({
      pool: market.pool,
      side: 'BUY_YES',
      price,
      quantity: ONE,
      orderType: 2,
      expireTimestampNs,
    });
    const total = fill.fills.reduce((sum, f) => sum + f.quantityFilled, 0n);
    await record(evidence, 'take-liquidity', fill, {
      requested: ONE,
      filled: total,
      fills: fill.fills,
    });
    if (total === 0n)
      throw Error(
        'No actual fill occurred; transaction alone is not fill evidence.',
      );
  } finally {
    if (makerOrder.orderId)
      await record(
        evidence,
        'cancel-maker-remainder',
        await maker.exchange.trader.cancelOrder({
          pool: market.pool,
          orderId: makerOrder.orderId,
        }),
      );
  }
  evidence.after = {
    owner: await balances(owner.address),
    maker: await balances(maker.account.address),
  };
  evidence.state = 'awaiting-settlement';
  await persist(evidence);
  console.log(`Lifecycle verified. Redeem after ${market.expiry}.`);
} catch (e) {
  const message =
    e instanceof Error
      ? e.message.split('\n')[0]
      : 'Testnet verification failed';
  if (evidence) {
    evidence.error = message;
    evidence.state = 'needs-recovery';
    await persist(evidence);
  }
  console.error(message);
  process.exitCode = 1;
} finally {
  await ex.close();
  if (maker) await maker.exchange.close();
}
process.exit(process.exitCode || 0);
