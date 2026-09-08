import Link from 'next/link';
import Evidence from '../evidence';
export default function Submission() {
  return (
    <main className="submission-page">
      <Link href="/lab" className="back-link">
        ← Open the replay lab
      </Link>
      <div className="eyebrow lime">
        SOMNIA × DREAMDEX · EVENT CONTRACTS HACKATHON
      </div>
      <h1>WindTunnel</h1>
      <p className="submission-intro">
        A crash-testing lab for Event Contract bots.
        <br />
        Reproduce the failure. Inspect the repair. Verify the integration.
      </p>
      <section className="panel prose">
        <h2>The problem</h2>
        <p>
          A trading bot can choose the correct direction and still operate
          incorrectly: record orders as fills, confuse successive markets, or
          credit an unconfirmed redemption. Ordinary forecast backtests do not
          test these integration failures.
        </p>
        <h2>What works</h2>
        <p>
          Three deterministic fault scenarios, deliberately faulty and repaired
          references, an independent event oracle, parameterized replay, a local
          strategy adapter and integrity-hashed report exports. Live market
          discovery and a controlled testnet lifecycle anchor the integration in
          real DreamDEX contracts.
        </p>
        <h2>Original contribution</h2>
        <p>
          The replay engine, failure fixtures, ledger invariants, browser
          comparison interface and CLI are original WindTunnel code. The
          protocol integration follows the MIT-licensed DreamDEX starter and SDK
          documentation, with a separate maker wallet to produce genuine fills.
        </p>
      </section>
      <Evidence />
      <section className="panel prose"><h2>2:30 project walkthrough</h2><p>A captioned visualization of actual replay reports and testnet receipts.</p><video controls preload="metadata" style={{width:"100%",borderRadius:8}} aria-label="WindTunnel captioned report walkthrough"><source src="/demo/windtunnel-demo.mp4" type="video/mp4"/></video><p>Captions are included in the video. See DEMO_SCRIPT.md in the repository for the text outline.</p></section>
      <section className="panel prose">
        <h2>Architecture</h2>
        <pre>
          Event tape → Strategy reducer → Observed ledger{'\n'}Event tape →
          Independent oracle → Expected ledger{'\n'} ↓{'\n'} Invariants + report
          {'\n\n'}Same TypeScript engine: browser + CLI{'\n'}Separate SDK
          adapter: public reads + local signing
        </pre>
        <h2>Scope and limitations</h2>
        <p>
          Synthetic scenarios test application behavior. They are not full
          matching-engine replays, security audits or profitability claims. The
          testnet run uses two controlled wallets; public liquidity can also match the take order.
          External user adoption has not yet been validated.
        </p>
        <h2>Reproduce</h2>
        <pre>
          npm ci{'\n'}npm test{'\n'}npm run lab -- --all --out
          reports/suite.json{'\n'}npm run dev
        </pre>
        <p>
          Testnet evidence includes transaction hashes and successful receipt
          status. See the repository documentation for signing setup and
          recovery behavior.
        </p>
        <a
          href="https://github.com/IronicDeGawd/ec-dreamdex-hackathon-template"
          target="_blank"
          rel="noreferrer"
        >
          Starter attribution and protocol references ↗
        </a>
      </section>
    </main>
  );
}
