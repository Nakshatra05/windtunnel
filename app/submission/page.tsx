import DemoVideo from '../demo-video';
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
        <h2>Start here: the judge’s quick path</h2>
        <p>
          Reproduce a failure, change its conditions, then inspect the real
          testnet evidence. No wallet or setup required.
        </p>
        <div className="judge-links">
          <a className="button primary" href="/lab?tour=1">
            Take the guided demo →
          </a>
          <a className="button secondary" href="/lab?tab=testnet">
            Inspect the receipts ↗
          </a>
          <a
            className="button secondary"
            href="https://github.com/Nakshatra05/windtunnel"
          >
            Read the source ↗
          </a>
        </div>
      </section>
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
          documentation, with controlled order placement and public-liquidity
          execution.
        </p>
      </section>
      <Evidence />
      <section className="panel prose">
        <h2>2:58 full-HD app walkthrough</h2>
        <p>
          A full-screen recording of the actual app: replay controls, repairs,
          report sharing and live verification of recorded testnet receipts.
        </p>
        <DemoVideo />
        <p>
          Captions are included in the video. See DEMO_SCRIPT.md in the
          repository for the text outline.
        </p>
      </section>
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
          testnet run uses two controlled wallets; public liquidity can also
          match the take order. External user adoption has not yet been
          validated.
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
