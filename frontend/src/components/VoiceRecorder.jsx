import { useVoice } from '../hooks/useVoice';

export default function VoiceRecorder({ onRecordingComplete, disabled = false }) {
  const { isRecording, isProcessing, error, startRecording, stopRecording, setError } = useVoice();

  const handleClick = async () => {
    if (disabled || isProcessing) return;

    if (isRecording) {
      try {
        const { blob, mimeType } = await stopRecording();
        if (blob.size > 0) {
          onRecordingComplete(blob, mimeType);
        } else {
          setError('Recording was empty. Please try again.');
        }
      } catch (err) {
        setError('Failed to stop recording.');
      }
    } else {
      await startRecording();
    }
  };

  const getIcon = () => {
    if (isProcessing) return '⏳';
    if (isRecording) return '⏹';
    return '🎙️';
  };

  const getLabel = () => {
    if (isProcessing) return 'Processing...';
    if (isRecording) return 'Tap to stop';
    return 'Tap to speak';
  };

  const stateClass = isProcessing ? 'processing' : isRecording ? 'recording' : 'idle';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-sm)' }}>
      <div style={{ position: 'relative' }}>
        <button
          id="voice-recorder-btn"
          className={`voice-button ${stateClass}`}
          onClick={handleClick}
          disabled={disabled || isProcessing}
          aria-label={getLabel()}
          title={getLabel()}
        >
          {getIcon()}
        </button>
        {isRecording && <div className="voice-ripple" />}
      </div>

      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
        {getLabel()}
      </span>

      {error && (
        <div className="alert alert-error" style={{ maxWidth: 280, textAlign: 'center', marginTop: 4 }}>
          {error}
        </div>
      )}
    </div>
  );
}
