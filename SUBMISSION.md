# WindTunnel

## Short description

WindTunnel is a deterministic crash-testing lab for DreamDEX Event Contract bots. Reproduce market-rollover, partial-fill and redemption-recovery failures, inspect the first broken invariant, compare repaired behavior and verify the protocol integration through real Somnia testnet transactions.

## Problem and solution

Forecast backtests do not catch phantom positions, stale window identities or premature redemption credits. WindTunnel makes these operational failures reproducible. The same typed engine powers the visual replay and local developer runner; the expected ledger is derived independently from the event tape.

## What is implemented

- Three parameterized synthetic scenarios with faulty and repaired references.
- Playback, before/after ledgers, repair explanations and hashed JSON exports.
- Local custom-strategy adapter and automated invariant tests.
- Live Shannon market discovery through public logs and DreamDEX SDK reads.
- Controlled maker/taker testnet integration with actual fill and cancellation receipts.
- Redemption adapter and wallet balance reconciliation.

## Differentiation

WindTunnel tests execution correctness, not forecast profitability. Its narrow deliverable is a reproducer developers can run locally, inspect, modify and use as a regression check. It does not claim to audit competitors or prove a bot safe.

## Ecosystem value

A reusable integration test runner can reduce repeated debugging for DreamDEX builders. The open-source core is the immediate distribution strategy. Hosted team reports and CI history are future possibilities; customer adoption and willingness to pay have not yet been validated.

## Honest demo framing

Synthetic fault scenarios are labeled. Testnet receipts come from a deliberately arranged two-wallet fixture. Do not claim those trades demonstrate demand, profit or independent usage. Check the current lifecycle evidence for settlement completion before recording the final narration.

## Final portal fields

Use the deployed public app URL, public GitHub repository and the supplied 2–3 minute demo video. These external publication/submission steps should use the user's chosen account. The app's `/submission` route is the public project brief once publication is enabled.
