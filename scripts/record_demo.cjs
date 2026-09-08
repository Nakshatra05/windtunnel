/* Full-frame recording of real UI actions. No mocked APIs or synthetic wallet UI.
   Recording tooling: npm install --prefix work/video-tools playwright
   Uses installed Edge and Playwright's video encoder (playwright install ffmpeg).
   A presentation-only pointer follows actual mouse events; it never changes app state. */
const { chromium } = require('../work/video-tools/node_modules/playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'work', 'screen-demo');
const BASE = process.env.DEMO_URL || 'https://windtunnel-silk.vercel.app';
(async () => {
  await fs.mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, recordVideo: { dir: OUT, size: { width: 1920, height: 1080 } }, permissions:['clipboard-write','clipboard-read'] });
  await context.addInitScript(() => {
    addEventListener('DOMContentLoaded', () => {
      const pointer = document.createElement('div');
      pointer.id = 'demo-presentation-pointer';
      pointer.style.cssText = 'position:fixed;left:0;top:0;width:48px;height:55px;z-index:2147483647;pointer-events:none;transform:translate(960px,540px);filter:drop-shadow(0 2px 3px #0005)';
      pointer.innerHTML = '<svg viewBox="0 0 48 55" width="48" height="55"><circle cx="17" cy="17" r="16" fill="#d8f36a" opacity=".55"/><path d="M12 8 13 39 21 31 28 45 35 41 28 28 39 27Z" fill="white" stroke="#20211d" stroke-width="2.5"/></svg>';
      document.documentElement.appendChild(pointer);
      addEventListener('mousemove', e => {pointer.style.transform=`translate(${e.clientX-12}px,${e.clientY-8}px)`;});
      addEventListener('mousedown', () => {pointer.style.filter='drop-shadow(0 0 12px #6a47dc)';});
      addEventListener('mouseup', () => {pointer.style.filter='drop-shadow(0 2px 3px #0005)';});
    });
  });
  const page = await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(BASE); await page.waitForLoadState('networkidle');
  await page.getByRole('heading',{name:/Break your bot/}).waitFor();
  const start=Date.now(); const cues=[];
  async function at(t,label){const remaining=t*1000-(Date.now()-start);if(remaining>0) await page.waitForTimeout(remaining);cues.push({label,time:(Date.now()-start)/1000});console.log(label,((Date.now()-start)/1000).toFixed(1));}
  async function point(locator){await locator.scrollIntoViewIfNeeded();const b=await locator.boundingBox();if(!b)throw Error('Missing target');await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:35});}
  async function click(locator){await point(locator);await page.waitForTimeout(220);await locator.click();}
  async function shot(name){await page.screenshot({path:path.join(OUT,name+'.png')});}
  try {
    await at(0,'intro');await point(page.getByRole('heading',{name:/Break your bot/}));await shot('intro');
    await at(8,'enter lab');await click(page.getByRole('link',{name:'Crash-test a bot',exact:true}));await page.getByRole('button',{name:'Run comparison',exact:false}).waitFor();
    await at(13,'partial fill');await click(page.getByRole('button',{name:'Run comparison',exact:false}));
    await at(20,'reference and repair');await point(page.locator('.bot.broken .readout strong'));await shot('partial');
    await at(25,'confirmed fills');await point(page.locator('.repaired-bot .readout strong'));
    await at(31,'repair code');await point(page.locator('.code-pair'));await shot('repair');
    await at(40,'liquidity experiment');await point(page.getByRole('slider').nth(1));await page.getByRole('slider').nth(1).press('Home');for(let i=0;i<10;i++)await page.getByRole('slider').nth(1).press('ArrowRight');
    await at(44,'run full liquidity');await click(page.getByRole('button',{name:'Run comparison',exact:false}));
    await at(51,'both pass');await point(page.locator('.bots'));if(await page.locator('.bots .fail').count())throw Error('Full-liquidity comparison did not pass');await shot('full-liquidity');
    await at(58,'rollover');await click(page.getByRole('button',{name:/Market rollover/}));await click(page.getByRole('button',{name:'Run comparison',exact:false}));
    await at(65,'stale identity');await point(page.locator('.bot.broken .readout strong'));
    await at(70,'current identity');await point(page.locator('.repaired-bot .readout strong'));await shot('rollover');
    await at(78,'recovery');await click(page.getByRole('button',{name:/Redemption recovery/}));await click(page.getByRole('button',{name:'Run comparison',exact:false}));
    await at(87,'duplicate credits');await point(page.locator('.bot.broken .readout strong'));
    await at(93,'credit once');await point(page.locator('.repaired-bot .readout strong'));await shot('recovery');
    await at(101,'first mismatch');await click(page.getByRole('button',{name:'Jump to first failure',exact:false}));
    await at(106,'suite');await click(page.getByRole('button',{name:'Run all scenarios',exact:false}));await point(page.locator('.suite-results'));await shot('suite');
    await at(113,'share replay');await click(page.getByRole('button',{name:'Close suite results'}));await click(page.getByRole('button',{name:'Share replay',exact:true}));await point(page.getByLabel('Reproduce this exact replay'));
    await at(118,'export report');const download=page.waitForEvent('download');await click(page.getByRole('button',{name:'Export report',exact:false}));await (await download).saveAs(path.join(OUT,'recorded-export.json'));await shot('share');
    await at(124,'real evidence');await click(page.getByRole('tab',{name:'Testnet evidence'}));await point(page.locator('.reconciliation'));await shot('balances');
    await at(134,'verify live');const response=page.waitForResponse(r=>r.url().endsWith('/api/verify'));await click(page.getByRole('button',{name:'Verify receipts live',exact:false}));const verified=await (await response).json();await fs.writeFile(path.join(OUT,'live-verification.json'),JSON.stringify(verified,null,2));if(verified.verified!==8)throw Error('Live receipt recheck incomplete');await page.getByText('8/8 receipts match the recorded evidence').waitFor();
    await at(143,'verified receipts');await point(page.locator('.verification-result'));await shot('verified');
    await at(149,'transaction trail');await point(page.locator('.receipt-list'));await shot('receipts');
    await at(158,'integration guide');await click(page.getByRole('tab',{name:'Integration guide'}));await point(page.getByRole('heading',{name:'3. Bring your own reducer'}));await shot('guide');
    await at(170,'close');await point(page.getByRole('heading',{name:'Make failures part of your test suite.'}));
    await at(178,'end');
    const contentSeconds=(Date.now()-start)/1000;
    const video=page.video();await context.close();await video.saveAs(path.join(OUT,'walkthrough.webm'));
    await fs.writeFile(path.join(OUT,'capture.json'),JSON.stringify({contentSeconds,cues,errors},null,2));
    console.log('RECORDING COMPLETE',contentSeconds,'seconds');
  } catch(e){await shot('failure').catch(()=>{});console.error(e);await context.close();process.exitCode=1;}
  finally {await browser.close();}
})();
