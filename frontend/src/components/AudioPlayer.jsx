import { useRef, useEffect } from 'react';

export default function AudioPlayer({ audioBase64, autoPlay = true, onEnded }) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (!audioBase64) return;

    try {
      const byteCharacters = atob(audioBase64);
      const byteNumbers = Array.from(byteCharacters, (c) => c.charCodeAt(0));
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);

      const audio = audioRef.current;
      audio.src = url;

      if (autoPlay) {
        audio.play().catch(() => {
          // Auto-play blocked by browser — user will see manual play button
        });
      }

      return () => URL.revokeObjectURL(url);
    } catch (err) {
      console.error('AudioPlayer error:', err);
    }
  }, [audioBase64, autoPlay]);

  if (!audioBase64) return null;

  return (
    <div className="audio-player">
      <audio
        ref={audioRef}
        onEnded={onEnded}
        controls
        style={{
          width: '100%',
          height: '36px',
          borderRadius: 'var(--radius-full)',
          outline: 'none',
        }}
      />
    </div>
  );
}
