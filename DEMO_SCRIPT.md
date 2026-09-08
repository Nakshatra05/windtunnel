# WindTunnel — 2:58 full-HD app walkthrough

Recorded from the actual browser UI at 1920 × 1080 with real mouse actions. The highlighted presentation cursor follows those mouse events. No application results or network responses are mocked. Narration is synthetic (Microsoft Guy Neural), synchronized to the capture, with word-timed captions.

The onchain segment rechecks existing transaction receipts live; it does not submit a new trade or show MetaMask approvals.

## 0:00 — The problem

This is WindTunnel: a crash-testing lab for DreamDEX Event Contract bots. A correct prediction can still become a broken trade. Let's use the actual app to find out why.

## 0:12 — Partial fills and the repair

We start with ten requested contracts and only three available. Watch the cursor as I run the comparison. Both implementations receive identical events. The reference records ten contracts, while the repaired bot records the three confirmed fills. The independent oracle flags the mismatch. Scroll down to see the repair: credit actual fills, then track the unfilled remainder separately.

## 0:40 — Change the inputs

Now I change available liquidity to ten and run the same scenario. This time the entire order fills, and both bots pass. The result is computed from the inputs. Testing only a fully filled order would hide the accounting bug.

## 0:58 — Market rollover

Next is market rollover. A pool is reused for a successor window, but the reference keeps the old market identity. After execution, its window is A while the correct window is B. The repaired implementation refreshes the binding instead of treating the pool address as permanent identity.

## 1:18 — Crash and redemption recovery

The recovery scenario exposes a different failure. A redemption is broadcast, the process crashes, and a receipt is delivered again after restart. The reference credits too early and repeats the credit, ending at thirty units. The repaired bot waits for confirmation and records the receipt once, ending at ten. Jump to the first failure to see exactly when the ledger first diverged.

## 1:46 — Reproduce and share

Run all three scenarios together to inspect the whole suite. Share replay creates a link that restores the active inputs and selected event. Export report downloads the actual event tape and ledgers with a SHA two fifty-six integrity hash, ready for debugging.

## 2:04 — Real onchain evidence

These scenarios are synthetic. Here is the real testnet evidence. Recorded payouts match: one test U S D C for the owner, two for the maker. Now I verify the receipts against the public Somnia RPC. This checks the status and block number of all eight recorded transactions, spanning minting, order placement, taking liquidity, cancellation, and redemption.

## 2:29 — Inspectable transactions

All eight receipts match. Each links to the explorer. We verified recorded transactions, without submitting a new trade.

## 2:38 — Build on WindTunnel

The integration guide shows how to run the same engine locally and test your own trusted strategy reducer. Seventeen automated tests cover the engine and replay links. WindTunnel is open source, with documented limits and SDK feedback. Reproduce the failure. Inspect the repair. Verify the evidence.

## Reproduce the video

Install Playwright in the ignored `work/video-tools` folder, use the installed Edge browser, and install Playwright’s FFmpeg encoder. Run `node scripts/record_demo.cjs`, then `python scripts/build_screen_demo.py` with edge-tts 7.2.8 and imageio-ffmpeg installed. Captured API results, screenshots and timing metadata stay under ignored `work/screen-demo`. The final MP4 and poster live under `public/demo`.

