import { readFile } from 'node:fs/promises';
import { owner, ex, balances, fixtureMaker } from './wallet';
import { persist, record, type Evidence } from './evidence';
const maker = fixtureMaker();
try {
  const e = JSON.parse(
    await readFile('public/evidence/lifecycle.json', 'utf8'),
  ) as Evidence;
  if (
    e.owner.toLowerCase() !== owner.address.toLowerCase() ||
    e.maker?.toLowerCase() !== maker.account.address.toLowerCase()
  )
    throw Error('Evidence wallets do not match local signers.');
  const m = await ex.client.getMarketOnchain(e.market.marketId);
  if (!m.isResolved && !m.isVoided && !m.finalized)
    throw Error(
      `Window has not settled. Expiry: ${e.market.expiry}. Retry after settlement.`,
    );
  const outcomes: (0 | 1)[] = m.isVoided
    ? [0, 1]
    : [Number(m.winningOutcome) as 0 | 1];
  if (outcomes.some((v) => v !== 0 && v !== 1))
    throw Error('Unknown winning outcome.');
  const result = [];
  for (const [name, account, exchange] of [
    ['owner', owner, ex],
    ['fixture-maker', maker.account, maker.exchange],
  ] as const) {
    const before = await balances(account.address);
    let expected = 0n;
    for (const idx of outcomes) {
      const id = BigInt(idx === 0 ? m.yesId : m.noId);
      const amount = await exchange.client.getOutcomeBalance({
        outcomeToken: m.outcomeToken,
        account: account.address,
        id,
      });
      if (amount === 0n) continue;
      expected += m.isVoided ? amount / 2n : amount;
      await record(
        e,
        `redeem-${name}-${idx}`,
        await exchange.trader.redeem({
          marketId: e.market.marketId,
          outcomeIdx: idx,
          amount,
          outcomeToken: m.outcomeToken,
        }),
        { amount, voided: m.isVoided },
      );
    }
    const after = await balances(account.address),
      actual = after.collateral - before.collateral;
    if (actual !== expected)
      throw Error(
        `${name}: redemption balance delta does not match expected payout.`,
      );
    result.push({
      wallet: account.address,
      expected: String(expected),
      actual: String(actual),
      matched: true,
    });
  }
  e.state = 'redeemed';
  delete e.error;
  e.reconciliation = result;
  e.after = {
    owner: await balances(owner.address),
    maker: await balances(maker.account.address),
  };
  await persist(e);
  console.log(
    'Redemption reconciled against both wallets. Re-running cannot credit an already burned position.',
  );
} catch (err) {
  console.error(
    err instanceof Error ? err.message.split('\n')[0] : 'Redemption failed',
  );
  process.exitCode = 1;
} finally {
  await ex.close();
  await maker.exchange.close();
}
process.exit(process.exitCode || 0);
