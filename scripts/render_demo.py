"""Captioned 150-second walkthrough rendered from actual engine reports and receipts.
This is a report visualization, not a recording of mouse interaction with the website.
Requires Pillow and imageio-ffmpeg; these are production-artifact tools, not app dependencies.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json, textwrap, imageio_ffmpeg

ROOT=Path(__file__).resolve().parents[1]
reports=json.loads((ROOT/'public/evidence/synthetic-suite.json').read_text())['payload']['reports']
runs={r['report']['scenario']:r['report'] for r in reports}
evidence=json.loads((ROOT/'public/evidence/lifecycle.json').read_text())
W,H=1280,720
BG='#101512'; PANEL='#1b2519'; EDGE='#35452c'; FG='#eff3e8'; MUTED='#a6b699'; GREEN='#c3ef82'; RED='#e9a587'
font_root=Path('C:/Windows/Fonts')
def font(size,bold=False,mono=False):return ImageFont.truetype(str(font_root/('consola.ttf' if mono else 'arialbd.ttf' if bold else 'arial.ttf')),size)
def txt(d,pos,text,size=22,color=FG,bold=False,mono=False):d.text(pos,str(text),font=font(size,bold,mono),fill=color)
def wrap(d,pos,text,width=85,size=22,color=MUTED):
 for i,line in enumerate(textwrap.wrap(text,width)):txt(d,(pos[0],pos[1]+i*(size+10)),line,size,color)
def base(section,caption,second):
 im=Image.new('RGB',(W,H),BG);d=ImageDraw.Draw(im)
 txt(d,(42,27),'WindTunnel.',27,GREEN,True);txt(d,(860,33),'DREAMDEX / SOMNIA SHANNON',16,MUTED,mono=True)
 d.line((40,76,1240,76),fill=EDGE,width=1);txt(d,(48,103),section.upper(),15,GREEN,mono=True)
 d.rectangle((40,618,1240,691),fill=PANEL);wrap(d,(58,632),caption,100,20,FG)
 d.rectangle((40,709,1240,712),fill=EDGE);d.rectangle((40,709,40+int(1200*second/150),712),fill=GREEN)
 return im,d
def draw_run(id,local,duration,second):
 r=runs[id];frames=r['reference']['frames'];idx=min(len(frames)-1,int(local/duration*len(frames)));a=frames[idx];b=r['repaired']['frames'][idx]
 names={'partial-fill':'The phantom position','rollover':'Same pool. Different market.','recovery':'One receipt. One credit.'}
 im,d=base('Synthetic fixture · '+id,a['event']['detail'],second)
 txt(d,(48,140),names[id],38,FG,True);txt(d,(48,193),f"Event {idx+1}/{len(frames)}  |  T + {a['event']['time']/1000:.3f}s  |  Seed 42",18,MUTED,mono=True)
 for x,frame,name,color in [(48,a,'Reference bot',RED),(664,b,'Repaired bot',GREEN)]:
  d.rounded_rectangle((x,240,x+568,516),radius=10,fill=PANEL,outline=EDGE,width=2)
  txt(d,(x+24,263),name,24,FG,True);txt(d,(x+432,269),'FAIL' if frame['violations'] else 'PASS',18,RED if frame['violations'] else GREEN,mono=True)
  field='credits' if id=='recovery' else 'market' if id=='rollover' else 'position';value=frame['ledger'][field];expected=frame['expected'][field]
  if field=='market':value=value[-1:];expected=expected[-1:]
  txt(d,(x+24,306),'RECORDED '+field.upper(),15,MUTED,mono=True);txt(d,(x+24,333),value,66,color,True)
  txt(d,(x+24,418),f'Expected: {expected}',20,MUTED);wrap(d,(x+24,457),frame['violations'][0] if frame['violations'] else 'Ledger matches observed events',43,17,color)
 txt(d,(48,548),a['event']['label'],24,FG,True)
 txt(d,(48,585),'Identical event tape. Independent oracle. Actual reducer output.',17,MUTED)
 return im
def render(second):
 if second<14:
  im,d=base('Reproducible execution testing','This walkthrough visualizes actual replay reports and recorded testnet receipts.',second)
  txt(d,(48,190),'A correct prediction can still',49,FG,True);txt(d,(48,251),'become a broken trade.',49,GREEN,True)
  wrap(d,(48,345),'WindTunnel catches phantom positions, stale market identities and duplicate credits before you deploy.',65,27)
  txt(d,(48,495),'REPRODUCE  →  DIAGNOSE  →  REPAIR  →  VERIFY',23,GREEN,mono=True)
  return im
 if second<52:return draw_run('partial-fill',second-14,38,second)
 if second<70:
  im,d=base('Change the inputs','The report is computed. Full liquidity removes the partial-fill failure.',second)
  txt(d,(48,167),'10 requested. 10 available.',43,FG,True);txt(d,(48,232),'Both implementations pass.',43,GREEN,True)
  wrap(d,(48,340),'Set available liquidity to 10 in the app, then run the comparison. The same faulty reference now records the correct position because the order filled completely.',75,25)
  txt(d,(48,515),'npm run lab -- --scenario partial-fill --liquidity 10',21,GREEN,mono=True);return im
 if second<94:return draw_run('rollover',second-70,24,second)
 if second<122:return draw_run('recovery',second-94,28,second)
 if second<143:
  im,d=base('Recorded real testnet evidence','Controlled two-wallet fixture. These trades are integration evidence, not organic user activity.',second)
  txt(d,(48,148),'Real transactions. Inspectable receipts.',38,FG,True)
  txt(d,(48,205),'Shannon 50312  ·  SDK 0.28.1  ·  '+evidence['state'],19,GREEN,mono=True)
  steps=[s for s in evidence['steps'] if not s['action'].startswith('fund-')]
  for i,s in enumerate(steps[:7]):
   y=257+i*43;txt(d,(48,y),s['action'],19,FG);txt(d,(610,y),s['hash'][:20]+'…'+s['hash'][-8:],18,MUTED,mono=True);txt(d,(1120,y),s['status'],18,GREEN)
  txt(d,(48,578),'Full hashes, block numbers and balance reconciliation: /evidence/lifecycle.json',17,MUTED);return im
 im,d=base('Open source · reproducible locally','Passing a fixture is not a security audit or a profitability claim.',second)
 txt(d,(48,184),'Break it here. Fix it before live.',46,GREEN,True)
 txt(d,(48,292),'npm ci  →  npm test  →  npm run lab -- --all',25,FG,mono=True)
 txt(d,(48,388),'github.com/Nakshatra05/windtunnel',28,FG)
 wrap(d,(48,462),'Three scenarios. An independent oracle. A reusable runner for DreamDEX builders.',70,25)
 return im

out=ROOT/'public'/'demo';out.mkdir(parents=True,exist_ok=True)
writer=imageio_ffmpeg.write_frames(str(out/'windtunnel-demo.mp4'),(W,H),fps=8,codec='libx264',quality=8,pix_fmt_in='rgb24',output_params=['-movflags','+faststart'])
writer.send(None)
for frame in range(150*8):writer.send(render(frame/8).tobytes())
writer.close()
render(30).save(out/'replay-report.png')
print(f'Created {out / "windtunnel-demo.mp4"}: 150 seconds, 1280×720, captioned report walkthrough.')
