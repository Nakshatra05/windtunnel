# WindTunnel

**Reproduce an Event Contract integration failure, inspect the repair, and verify the lifecycle on Somnia Shannon.**

**[Live demo](https://windtunnel-silk.vercel.app) · [Replay lab](https://windtunnel-silk.vercel.app/lab) · [Evidence and video](https://windtunnel-silk.vercel.app/submission)**

Repository: https://github.com/Nakshatra05/windtunnel

Built for the Somnia × DreamDEX Event Contracts Hackathon. The landing page introduces the project; `/lab` opens the deterministic replay lab and `/submission` contains the project brief, walkthrough and real transaction trail.

## Run

Requires Node 22.13+ (tested with Node 24), npm, and no wallet for the replay lab.

```sh
npm ci
npm test
npm run typecheck
npm run dev
```

Open the Local URL printed by the development server. `npm run build` creates the Cloudflare Worker deployment. `npm run build:vercel` builds the same app with Next.js for Vercel; `vercel.json` selects this build automatically. The UI uses React and installed Shadcn controls. The public web app requires no signing secrets or environment variables.

## Reproduce a failure

```sh
npm run lab -- --scenario partial-fill --requested 10 --liquidity 3 --seed 42
npm run lab -- --all --out reports/suite.json
npm run lab -- --scenario partial-fill --liquidity 10
npm run lab -- --scenario rollover --no-fault
npm run lab -- --all --strategy ./examples/strategy.ts
```

The default faulty references are expected to fail. By default the CLI exits successfully when the repaired suite passes; `--fail-on-reference` also makes reference failures fail the command. A failing custom strategy exits 1; invalid inputs exit 2. Custom modules run locally with the caller's privileges: load only trusted code. The hosted app never executes uploaded code.

Three scenarios:

- **Partial fill:** requested quantity is incorrectly treated as owned quantity. Repair records actual fills and remaining quantity.
- **Rollover:** a reused pool keeps an old market identity. Repair refreshes the market binding before execution.
- **Recovery:** broadcast is incorrectly credited before confirmation, then a repeated receipt is credited again. Repair records confirmed receipts once. Turning off fault injection removes restart/duplicate delivery, but still exposes premature broadcast credit in this deliberately faulty reference.

All fixtures are explicitly synthetic. The seed controls reproducible event timing, not returns. The report's short FNV fingerprint is a convenience identifier, not cryptographic proof. Exporters include SHA-256 of the specified canonical JSON payload; it detects changes but does not authenticate an author or establish a trusted timestamp.

## Bring a strategy

Implement the `Strategy` interface from `lib/engine.ts`: `{ name, reduce(state, event) }`. It receives a cloned event and ledger, returns a new ledger, and cannot mutate the oracle's tape. The independent oracle derives expected quantities from venue events. The fixture reducers are deliberately small integration references, not trading alpha.

## Testnet integration

Pinned SDK: `@somnia-chain/markets-sdk` 0.28.1. Network is hard-scoped to Shannon chain 50312 and tUSDC with six decimals. The generic DreamDEX spot HTTP API is not used.

```sh
npm run testnet:discover
```

This reads MarketCreated logs and checks market status with the SDK. It saves `public/evidence/observation.json`. The app's `/api/testnet` performs a smaller bounded scan, caches observations for 30 seconds and returns timestamps and coverage. No markets in that scan does not prove there are none. Market status is checked at observation time, not atomically with the scan block.

For writes, copy `.env.example` to `.env.local`, set a dedicated funded testnet `PRIVATE_KEY` and its `EXPECTED_WALLET`. Never put a key in the UI or a public repository.

```sh
npm run testnet:verify
# After the chosen market resolves:
npm run testnet:redeem
```

The verifier checks network and signer identity, requires at least 4 STT and 5 tUSDC, generates a separate fixture-maker key in ignored `.env.local`, transfers 2 STT and 3 tUSDC to it if needed, mints two complete sets, rests an ask, buys one contract with the owner, and cancels the remainder. This is a controlled two-wallet demonstration, not organic demand. Native funding uses gas estimation because fresh-account creation is expensive on Somnia. Testnet token approval and protocol writes use SDK limits.

Evidence is saved after each confirmed transaction, with no signing secrets. A failed attempt is retained. A partially successful run stops for recovery instead of repeating trades blindly. Redemption checks the market and current token balances, claims eligible positions from both wallets, and checks the collateral delta. The fixture maker may retain testnet tokens and STT after the demo; its key remains in the local ignored environment file.

**Recovery boundary:** the SDK combines broadcast/confirmation. If the process dies inside that call, a returned hash may not yet have been journaled. Do not blindly rerun verification; inspect the wallet/pool and recover outstanding orders first. The synthetic replay demonstrates application idempotency; it does not claim durable transaction-broadcast recovery is fully solved by this SDK wrapper.

## Validation

The automated suite checks intentional failures, repaired outcomes, deterministic reruns, changed seeds, zero/full/excess liquidity, repeated receipts, recreated reducer state, invalid input rejection, mutation isolation and 930 quantity-conservation combinations. `npm run typecheck` validates the app and scripts. Tests exercise the pure engine; network and wallet operations are separate integration runs.

## Architecture

`lib/engine.ts` → fixture tapes, reference reducers, independent expected ledger, invariant comparisons.

`app/lab.tsx` → scenario controls, event playback, comparison and report download.

`lib/testnet.ts` → public discovery and pinned DreamDEX SDK configuration.

`scripts/` → local strategy CLI, discovery, funded lifecycle, evidence journal and redemption.

`public/evidence/` → recorded public chain observations/receipts. Synthetic reports are tagged separately.

## Limits

No claim of matching-engine parity, queue simulation, forecast accuracy, mainnet readiness or security certification. Passing a scenario only establishes its checked invariants for those inputs. No arbitrary remote code execution, pooled deposits, real-money trading, or claim of independent customer adoption.

## Attribution

Original replay engine, fixtures, CLI and interface: WindTunnel contributors (MIT).

Integration approach informed by [ec-dreamdex-hackathon-template](https://github.com/IronicDeGawd/ec-dreamdex-hackathon-template), MIT, and [DreamDEX documentation](https://app.dreamdex.io/docs/developers/event-contracts). The SDK and starter are dependencies/references; the deliberately faulty examples do not allege SDK defects. See `THIRD_PARTY_NOTICES.md`.
