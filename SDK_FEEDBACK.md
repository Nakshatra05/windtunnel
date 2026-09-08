# DreamDEX SDK and documentation feedback

Tested with markets-sdk 0.28.1 on Somnia Shannon, September 9, 2026.

1. **Separate maker and taker wallets in the starter.** The referenced lifecycle example places an ask and then takes from the same signer. The SDK default self-matching behavior cancels the taker remainder. A demo can print a successful transaction without a fill. WindTunnel uses two fixture wallets and explicitly fails a zero-fill verification. Suggested documentation improvement: show this two-signer path or explain when external liquidity is necessary.

2. **Show native funding gas estimation.** Our first fresh-wallet transfer with a 210,000 gas cap reverted and consumed that cap. Estimating the transfer and adding headroom fixed it. This is an application mistake, not an SDK defect; it belongs prominently in the funding walkthrough. The failed receipt is preserved in public/evidence/failed-attempt.json.

3. **Make broadcast recovery visible.** A write returns a combined hash and confirmed receipt. An application interrupted before that return needs a durable broadcast hook or wallet/nonce reconciliation. A documented recovery recipe would help bot developers. WindTunnel's wrapper honestly records this gap rather than claiming complete crash recovery.

4. **Avoid overclaiming discovery completeness.** A bounded log scan is useful when the indexer is unavailable, but no discovered window is not proof of no markets. Include the scan range, failed ranges and observation timestamp in examples.

These observations are reproducible integration feedback. They are not security findings or claims against other projects.
