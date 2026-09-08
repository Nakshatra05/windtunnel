import Link from 'next/link';
import { ArrowDown, ArrowUpRight, Wind, Check, X, Code2, Play, ArrowRight } from 'lucide-react';
import { runLab, DEFAULT_PARAMETERS } from '@/lib/engine';
export default function Home() {
  const report = runLab('partial-fill', DEFAULT_PARAMETERS);
  return <div className="landing">
    <header className="landing-nav">
      <Link className="brand" href="/"><span className="brand-mark"><Wind size={25}/></span>WindTunnel</Link>
      <nav aria-label="Main navigation"><a href="#how-it-works">How it works</a><Link href="/submission">The evidence</Link><a href="https://github.com/Nakshatra05/windtunnel" aria-label="GitHub repository"><Code2 size={21}/></a></nav>
      <Link href="/lab" className="button primary">Enter the lab <ArrowUpRight size={18}/></Link>
    </header>
    <main>
      <section className="landing-hero">
        <div className="hero-copy"><span className="stamp">BUILT FOR DREAMDEX × SOMNIA</span>
          <h1>Break your bot.<br/><span>Before the<br/>market does.</span></h1>
          <p>Your prediction can be right. Your execution can still be wrong. Crash-test Event Contract bots against the failures a price chart won’t show you.</p>
          <div className="hero-actions"><Link href="/lab" className="button primary big-button">Crash-test a bot <ArrowUpRight size={23}/></Link><a href="#walkthrough" className="text-link"><Play size={17}/> Watch the 2:30 demo</a></div>
          <div className="hero-footnote"><Check size={16}/> No wallet needed. Reproducible by design.</div>
        </div>
        <div className="hero-demo" aria-label="Computed partial-fill example">
          <div className="demo-sticker">GOOD SIGNAL.<br/>BAD ACCOUNTING.</div>
          <div className="demo-window"><div className="window-bar"><span><i/><i/><i/></span><b>WT–001 / THE PHANTOM POSITION</b><ArrowUpRight size={17}/></div>
          <div className="demo-window-body"><div className="demo-input"><span>ORDER REQUESTED <b>10</b></span><ArrowRight/><span>ACTUALLY FILLED <b>3</b></span></div>
          <div className="demo-readouts"><div className="demo-reference"><span>REFERENCE BOT</span><strong>{report.reference.final.position}<small>contracts</small></strong><b><X size={17}/> Ledger mismatch</b></div><div className="demo-repaired"><span>REPAIRED BOT</span><strong>{report.repaired.final.position}<small>contracts</small></strong><b><Check size={17}/> Ledger reconciled</b></div></div>
          <div className="demo-tape"><span>REQUEST</span><i/><span>FILL</span><i/><span>CANCEL</span><i/><span>CHECK</span></div>
          <p>Same events. Different bookkeeping.<br/><strong>One bug you can catch before deployment.</strong></p>
          <Link href="/lab">Run this scenario yourself <ArrowRight size={18}/></Link></div></div>
          <span className="demo-note">↑ Actual engine output · synthetic fixture · seed 42</span>
        </div>
      </section>
      <div className="proof-strip"><span><b>03</b> failure scenarios</span><span><b>14</b> automated tests</span><span><b>08</b> successful testnet transactions</span><a href="#how-it-works">INSPECT. REPAIR. REPLAY. <ArrowDown size={19}/></a></div>
      <section id="how-it-works" className="landing-section">
        <div className="section-heading"><span className="eyebrow">01 / FIND THE BLIND SPOT</span><h2>A backtest won’t<br/>catch these.</h2><p>WindTunnel tests the bookkeeping between your strategy and the exchange. Three small failures. Three very different consequences.</p></div>
        <div className="failure-cards">{[
          ['01','The phantom position','You request ten contracts. Three fill. Your bot thinks it owns all ten.','PARTIAL-FILL ACCOUNTING'],
          ['02','The wrong market','A new window opens at the same pool. Your bot keeps trading the old identity.','MARKET ROLLOVER'],
          ['03','The double credit','A process restarts after redemption. Your bot credits the same receipt twice.','CRASH RECOVERY']
        ].map(([number,title,body,tag])=><Link href="/lab" className="failure-card" key={number}><div><span>{number}</span><ArrowUpRight size={27}/></div><h3>{title}</h3><p>{body}</p><small>{tag}</small></Link>)}</div>
      </section>
      <section className="method-section"><div><span className="eyebrow">02 / MAKE THE FAILURE USEFUL</span><h2>Don’t just spot a bug.<br/>Prove the repair.</h2><p>Two implementations receive the exact same event tape. An independent oracle checks both ledgers. Change the inputs, replay every step, then export the result.</p><Link href="/lab" className="button primary">Open the replay lab <ArrowUpRight size={20}/></Link></div><ol className="method-steps"><li><b>01</b><span><strong>Inject the fault</strong>Choose a scenario, set liquidity and seed.</span></li><li><b>02</b><span><strong>Compare every event</strong>See exactly when the ledger stops matching reality.</span></li><li><b>03</b><span><strong>Take it into your workflow</strong>Run a local strategy adapter. Export a hashed report.</span></li></ol></section>
      <section className="landing-section evidence-section"><div className="section-heading"><span className="eyebrow">03 / SHOW THE RECEIPTS</span><h2>Real contracts.<br/>Checkable evidence.</h2><p>The synthetic lab is backed by a separate, recorded DreamDEX testnet lifecycle: mint, place, take, cancel and redeem. Follow every transaction on Somnia Shannon.</p></div><div className="evidence-ticket"><div className="ticket-top"><span>TESTNET FIELD REPORT</span><Check size={25}/></div><h3>Redemption<br/>reconciled.</h3><div><span>Owner payout</span><b>1 tUSDC</b></div><div><span>Maker payout</span><b>2 tUSDC</b></div><p>Expected and observed balance changes match. Testnet evidence is separate from synthetic fault scenarios.</p><Link href="/submission" className="button secondary">Inspect the evidence <ArrowUpRight size={19}/></Link></div></section>
      <section id="walkthrough" className="walkthrough-section"><div><span className="eyebrow">04 / TWO MINUTES, THIRTY SECONDS</span><h2>See a failure.<br/>Understand the fix.</h2><p>A captioned walkthrough of computed replay reports and onchain receipts.</p><a className="text-link" href="https://github.com/Nakshatra05/windtunnel">Read the code <ArrowUpRight size={18}/></a></div><video controls preload="metadata" poster="/demo/replay-report.png" aria-label="WindTunnel captioned project walkthrough"><source src="/demo/windtunnel-demo.mp4" type="video/mp4"/></video></section>
      <section className="final-cta"><span className="stamp">OPEN SOURCE. TESTNET VERIFIED.</span><h2>Give your bot<br/>a bad day.</h2><Link className="button secondary big-button" href="/lab">Enter WindTunnel <ArrowUpRight size={24}/></Link><p>Find the failure while it’s still just a test.</p></section>
    </main><footer className="landing-footer"><Link className="brand" href="/"><Wind/>WindTunnel</Link><span>Built for the Event Contracts Hackathon · 2026</span><div><a href="https://github.com/Nakshatra05/windtunnel">GitHub ↗</a><Link href="/submission">Submission brief ↗</Link></div></footer>
  </div>;
}
