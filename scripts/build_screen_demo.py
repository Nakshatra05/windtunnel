"""Narrate and caption the real 1080p browser recording. Requires edge-tts 7.2.8
and imageio-ffmpeg. Run record_demo.cjs first; output remains under three minutes.
"""
import asyncio, json, subprocess, wave, textwrap
from pathlib import Path
import edge_tts, imageio_ffmpeg
ROOT=Path(__file__).resolve().parents[1]
WORK=ROOT/'work/screen-demo'
FF=imageio_ffmpeg.get_ffmpeg_exe()
RATE=24000; LENGTH=178
scenes=json.loads((ROOT/'scripts/screen-narration.json').read_text(encoding='utf-8'))
def ff(*args):subprocess.run([FF,'-hide_banner','-loglevel','error','-y',*map(str,args)],check=True)
def ass_time(t):
 cent=round(t*100);return f'{cent//360000}:{cent//6000%60:02d}:{cent//100%60:02d}.{cent%100:02d}'
async def main():
 timeline=bytearray(LENGTH*RATE*2);captions=[];timings=[]
 for i,scene in enumerate(scenes):
  audio=WORK/f'voice-{i}.mp3';wav=WORK/f'voice-{i}.wav';words=[]
  with audio.open('wb') as f:
   async for chunk in edge_tts.Communicate(scene['text'],'en-US-GuyNeural',boundary='WordBoundary').stream():
    if chunk['type']=='audio':f.write(chunk['data'])
    elif chunk['type']=='WordBoundary':words.append(chunk)
  ff('-i',audio,'-ar',RATE,'-ac',1,'-c:a','pcm_s16le',wav)
  with wave.open(str(wav),'rb') as f:duration=f.getnframes()/RATE
  available=scene['end']-scene['start']-.8;speed=max(1,duration/available)
  if speed>1.2:raise ValueError(f'Shorten scene {i+1}: {speed:.3f} speed needed')
  if speed>1:
   fitted=WORK/f'voice-{i}-fit.wav';ff('-i',wav,'-af',f'atempo={speed:.6f}',fitted);wav=fitted
  with wave.open(str(wav),'rb') as f:pcm=f.readframes(f.getnframes())
  start=scene['start']+.4;offset=round(start*RATE)*2
  if offset+len(pcm)>scene['end']*RATE*2:raise ValueError('Narration crosses a scene boundary')
  timeline[offset:offset+len(pcm)]=pcm
  for j in range(0,len(words),9):
   group=words[j:j+9];a=start+group[0]['offset']/1e7/speed;b=start+(group[-1]['offset']+group[-1]['duration'])/1e7/speed
   text=' '.join(w['text'] for w in group).replace('{','').replace('}','')
   text=r'\N'.join(textwrap.wrap(text,76))
   captions.append(f'Dialogue: 0,{ass_time(a)},{ass_time(b)},Default,,0,0,0,,{text}')
  timings.append({'scene':scene['title'],'seconds':len(pcm)/RATE/2,'speed':speed});print(timings[-1],flush=True)
 voice=WORK/'voiceover.wav'
 with wave.open(str(voice),'wb') as f:
  f.setnchannels(1);f.setsampwidth(2);f.setframerate(RATE);f.writeframes(timeline)
 header='''[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 0
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,30,&H00FFFFFF,&H00FFFFFF,&H00202020,&H80202020,0,0,0,0,100,100,0,0,3,2,0,2,60,60,26,1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
'''
 (WORK/'captions.ass').write_text(header+'\n'.join(captions),encoding='utf-8')
 raw=WORK/'walkthrough.webm';reader=imageio_ffmpeg.read_frames(str(raw));meta=next(reader);reader.close()
 content=json.loads((WORK/'capture.json').read_text())['contentSeconds']
 trim=max(0,meta['duration']-content)
 output=ROOT/'public/demo/windtunnel-demo.mp4'
 ff('-ss',f'{trim:.3f}','-i',raw,'-i',voice,'-map','0:v:0','-map','1:a:0','-vf','fps=30,ass=work/screen-demo/captions.ass','-c:v','libx264','-preset','medium','-crf','21','-pix_fmt','yuv420p','-af','loudnorm=I=-16:TP=-1.5:LRA=11','-c:a','aac','-ar','48000','-b:a','128k','-t',LENGTH,'-movflags','+faststart',output)
 ff('-ss','25','-i',output,'-frames:v','1',ROOT/'public/demo/replay-report.png')
 (WORK/'narration-timings.json').write_text(json.dumps(timings,indent=2))
 print('Completed',output, 'trim offset',trim,flush=True)
asyncio.run(main())
