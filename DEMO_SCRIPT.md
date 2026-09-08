# 2:30 narrated and captioned report walkthrough

The generated MP4 visualizes actual engine outputs and recorded receipts. It is not a screen recording of browser interaction. An optional live presentation can follow the same sequence in the app.

0:00–0:14 — A bot can predict correctly and still operate incorrectly. Explain WindTunnel's execution focus.

0:14–0:52 — Partial-fill replay, event by event: request 10, fill 3, record 10 incorrectly, cancel 7. Compare repaired bookkeeping.

0:52–1:10 — Change liquidity to 10. Both references now pass. Results respond to inputs.

1:10–1:34 — Replay pool reuse and reveal stale execution identity. Refreshing the binding fixes it.

1:34–2:02 — Interrupt confirmation, restart, redeliver a receipt. Credit only a confirmed receipt, once.

2:02–2:23 — Show actual testnet receipt hashes and lifecycle status. Clearly disclose the controlled two-wallet fixture.

2:23–2:30 — Local reproduction commands, repository, and the scope limitation.

## Voiceover transcript

Synthetic narration: Microsoft Guy Neural (en-US). Captions remain visible in the video.

### 0:00–0:14

A correct prediction can still become a broken trade. WindTunnel crash-tests the execution behind DreamDEX bots, so you can reproduce a failure, understand it, and verify the repair.

### 0:14–0:52

Start with the phantom position. Both bots receive the same synthetic event tape: an order for ten contracts, but only three contracts actually fill. The reference bot mistakes the requested quantity for an owned position. Its ledger says ten. The repaired bot records the confirmed fill, so its position is three. When the remaining seven contracts are cancelled, the repaired ledger stays consistent. An independent oracle checks the expected state at every step, showing exactly where the reference implementation goes wrong.

### 0:52–1:10

These results are computed, not hard-coded. Change available liquidity to ten and run the comparison again. Now the whole order fills, and both implementations pass. You can adjust the inputs, replay each event, and export the report.

### 1:10–1:34

Next, market rollover. An event window ends, and the same pool is reused for a successor market. A bot that treats the pool address as a permanent identity can execute against a stale market. The repair refreshes the market binding before execution, then checks it against the current snapshot.

### 1:34–2:02

Finally, recovery. Broadcasting a redemption is not the same as confirming it. The reference bot credits the balance too early. After a crash and restart, a repeated receipt can credit it again. The repaired implementation waits for confirmation and records each receipt only once. Replaying the same event therefore leaves the ledger unchanged. The oracle makes both premature credit and duplicate credit visible.

### 2:02–2:23

The synthetic scenarios are separate from real integration evidence. On Somnia Shannon, the recorded run mints, places, takes, cancels, and redeems through DreamDEX. Two controlled fixture wallets are used. Every receipt is inspectable, and the final token balance changes reconcile with the expected payouts.

### 2:23–2:30

Break your bot here. Fix it before going live. WindTunnel.

To regenerate: run `scripts/render_demo.py`, then `scripts/narrate_demo.py` with Python, Pillow, imageio-ffmpeg and edge-tts 7.2.8 installed. The narration script sends only the public script text to the speech service and checks each segment fits its scene.
