'use client';
import { useRef, useState } from 'react';
import { Maximize, Play } from 'lucide-react';
const chapters = [
  [0, 'Overview'],
  [12, 'Partial fills'],
  [40, 'Change liquidity'],
  [58, 'Market rollover'],
  [78, 'Recovery'],
  [106, 'Share & export'],
  [124, 'Onchain evidence'],
  [158, 'Developer guide'],
] as const;
export default function DemoVideo() {
  const video = useRef<HTMLVideoElement>(null);
  const [message, setMessage] = useState('');
  async function fullscreen() {
    const player = video.current;
    if (!player) return;
    try {
      await player.requestFullscreen();
      await player.play();
    } catch {
      setMessage(
        'Use the video player’s full-screen control, or open the video directly.',
      );
    }
  }
  async function seek(time: number) {
    if (video.current) {
      video.current.currentTime = time;
      try {
        await video.current.play();
      } catch {
        setMessage('Press play to start the selected chapter.');
      }
    }
  }
  return (
    <div className="demo-player">
      <video
        ref={video}
        controls
        playsInline
        preload="metadata"
        poster="/demo/replay-report.png?v=screen-2"
        aria-label="WindTunnel full-HD app walkthrough with cursor, narration and captions"
      >
        <source src="/demo/windtunnel-demo.mp4?v=screen-2" type="video/mp4" />
      </video>
      <div className="video-actions">
        <button className="button primary" onClick={fullscreen}>
          <Maximize size={17} /> Watch full-screen
        </button>
        <a
          href="/demo/windtunnel-demo.mp4?v=screen-2"
          target="_blank"
          rel="noreferrer"
        >
          Open video ↗
        </a>
        <span>1080p · 2:58 · narrated & captioned</span>
      </div>
      <div className="video-chapters" aria-label="Video chapters">
        {chapters.map(([time, title]) => (
          <button key={time} onClick={() => seek(time)}>
            <Play size={12} />
            <b>
              {Math.floor(time / 60)}:{String(time % 60).padStart(2, '0')}
            </b>{' '}
            {title}
          </button>
        ))}
      </div>
      {message && <p role="status">{message}</p>}
    </div>
  );
}
