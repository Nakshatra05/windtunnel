"""Add scene-aligned synthetic narration to the existing 150-second MP4.
Requires edge-tts==7.2.8 and imageio-ffmpeg. Run after render_demo.py.
Only the public narration text is sent to the speech service.
"""
import asyncio
import json
import subprocess
import wave
from pathlib import Path
import edge_tts
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / 'work' / 'narration'
WORK.mkdir(parents=True, exist_ok=True)
SCENES = json.loads((ROOT / 'scripts/narration.json').read_text(encoding='utf-8'))
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
RATE = 24000

def ffmpeg(*args):
    subprocess.run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', *map(str,args)], check=True)

async def main():
    timeline = bytearray(150 * RATE * 2)
    timings = []
    for i, scene in enumerate(SCENES):
        mp3 = WORK / f'{i}.mp3'
        wav = WORK / f'{i}.wav'
        await edge_tts.Communicate(scene['text'], 'en-US-GuyNeural', rate='+0%').save(str(mp3))
        ffmpeg('-i', mp3, '-ar', RATE, '-ac', 1, '-c:a', 'pcm_s16le', wav)
        with wave.open(str(wav), 'rb') as source:
            duration = source.getnframes() / RATE
        available = scene['end'] - scene['start'] - 0.8
        speed = max(1.0, duration / available)
        if speed > 1.22:
            raise ValueError(f'Scene {i} needs a shorter script: speed={speed:.3f}')
        if speed > 1:
            adjusted = WORK / f'{i}-fit.wav'
            ffmpeg('-i', wav, '-af', f'atempo={speed:.6f}', adjusted)
            wav = adjusted
        with wave.open(str(wav), 'rb') as source:
            pcm = source.readframes(source.getnframes())
        offset = round((scene['start'] + 0.4) * RATE) * 2
        if offset + len(pcm) > round(scene['end'] * RATE) * 2:
            raise ValueError(f'Scene {i} overlaps the next scene')
        timeline[offset:offset + len(pcm)] = pcm
        timings.append({'scene': i + 1, 'start': scene['start'] + .4, 'spokenSeconds': round(len(pcm)/2/RATE,2), 'speed': round(speed,3)})
        print(timings[-1], flush=True)
    audio = WORK / 'narration.wav'
    with wave.open(str(audio), 'wb') as output:
        output.setnchannels(1); output.setsampwidth(2); output.setframerate(RATE)
        output.writeframes(timeline)
    video = ROOT / 'public/demo/windtunnel-demo.mp4'
    merged = WORK / 'narrated.mp4'
    ffmpeg('-i', video, '-i', audio, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy',
           '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-c:a', 'aac', '-ar', '48000', '-b:a', '128k',
           '-t', '150', '-movflags', '+faststart', merged)
    merged.replace(video)
    (WORK / 'timings.json').write_text(json.dumps(timings, indent=2))
    print('Narrated MP4 ready:', video)

asyncio.run(main())
