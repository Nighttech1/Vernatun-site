import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import {
  BaseBoxShapeUtil,
  HTMLContainer,
  RecordProps,
  T,
  TLBaseShape,
  resizeBox,
} from 'tldraw';

export type AudioSnippetShape = TLBaseShape<
  'audio-snippet',
  {
    w: number;
    h: number;
    audioUrl: string;
    title: string;
    duration: number;
    authorName: string;
  }
>;

function AudioPlayer({
  url,
  title,
}: {
  url: string;
  title: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    return () => {
      const a = audioRef.current;
      if (a) {
        a.pause();
        a.src = '';
      }
    };
  }, []);

  const stop = (e: SyntheticEvent) => {
    e.stopPropagation();
  };

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const a = audioRef.current;
    if (!a || !url) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      void a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  };

  const cycleRate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = rate === 1 ? 0.75 : 1;
    setRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  return (
    <div className="as-player" onPointerDown={stop} onClick={stop}>
      {url ? (
        <audio
          ref={audioRef}
          src={url}
          preload="metadata"
          onTimeUpdate={() => {
            const a = audioRef.current;
            if (!a || !a.duration) return;
            setProgress(a.currentTime / a.duration);
          }}
          onEnded={() => setPlaying(false)}
        />
      ) : null}
      <p className="as-title">{title || 'Реплика'}</p>
      <div className="as-row">
        <button type="button" className="as-btn" onClick={toggle}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <div className="as-bar" aria-hidden>
          <div className="as-bar-fill" style={{ width: `${progress * 100}%` }} />
        </div>
        <button type="button" className="as-btn" onClick={cycleRate}>
          {rate.toFixed(2).replace(/0$/, '')}x
        </button>
      </div>
    </div>
  );
}

export class AudioSnippetShapeUtil extends BaseBoxShapeUtil<AudioSnippetShape> {
  static override type = 'audio-snippet' as const;
  static override props: RecordProps<AudioSnippetShape> = {
    w: T.number,
    h: T.number,
    audioUrl: T.string,
    title: T.string,
    duration: T.number,
    authorName: T.string,
  };

  getDefaultProps(): AudioSnippetShape['props'] {
    return {
      w: 280,
      h: 96,
      audioUrl: '',
      title: 'Аудио-реплика',
      duration: 0,
      authorName: '',
    };
  }

  component(shape: AudioSnippetShape) {
    const { w, h, audioUrl, title, authorName } = shape.props;
    return (
      <HTMLContainer
        style={{ width: w, height: h, pointerEvents: 'all' }}
        className="as-card"
      >
        <AudioPlayer url={audioUrl} title={title} />
        {authorName ? <p className="as-author">{authorName}</p> : null}
      </HTMLContainer>
    );
  }

  indicator(shape: AudioSnippetShape) {
    return (
      <rect width={shape.props.w} height={shape.props.h} rx={12} ry={12} />
    );
  }

  override onResize = (
    shape: AudioSnippetShape,
    info: Parameters<BaseBoxShapeUtil<AudioSnippetShape>['onResize']>[1],
  ) => resizeBox(shape, info);
}
