import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../../hooks/useSession';
import { useVoice } from '../../../hooks/useVoice';
import VoiceRecorder from '../../../components/VoiceRecorder';
import AudioPlayer from '../../../components/AudioPlayer';

export default function Conversation() {
  const navigate = useNavigate();
  const {
    sessionId, messages, questionNumber, maxQuestions,
    sessionEnded, isLoading, error,
    sendAudioMessage, sendTextMessage, endSession, resetSession,
  } = useSession();

  const { isRecording, isProcessing, setIsProcessing, startRecording, stopRecording } = useVoice();

  const [latestAudio, setLatestAudio] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [inputMode, setInputMode] = useState('voice'); // 'voice' | 'text'
  const chatEndRef = useRef(null);

  // Redirect if no session
  useEffect(() => {
    if (!sessionId) navigate('/voice/setup');
  }, [sessionId, navigate]);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleRecordingComplete = async (blob, mimeType) => {
    setIsProcessing(true);
    try {
      const result = await sendAudioMessage(blob, mimeType);
      if (result?.audioBase64) setLatestAudio(result.audioBase64);
    } catch {
      // error shown in store
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextSend = async (e) => {
    e.preventDefault();
    if (!textInput.trim() || isLoading) return;
    const text = textInput.trim();
    setTextInput('');
    try {
      const result = await sendTextMessage(text);
      if (result?.audioBase64) setLatestAudio(result.audioBase64);
    } catch {
      // error in store
    }
  };

  const progress = ((questionNumber - 1) / maxQuestions) * 100;

  if (!sessionId) return null;

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 65px)' }}>

      {/* Header */}
      <div style={{ marginBottom: 'var(--space-md)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
              🧠 MindMate Check-in
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Question {Math.min(questionNumber, maxQuestions)} of {maxQuestions}
            </p>
          </div>
          <button
            id="end-session-btn"
            className="btn btn-ghost btn-sm"
            onClick={endSession}
            disabled={isLoading}
          >
            End Session
          </button>
        </div>

        {/* Progress */}
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Chat */}
      <div className="chat-container" style={{ flex: 1, overflowY: 'auto', marginBottom: 'var(--space-md)', padding: 'var(--space-sm) 0' }}>
        {messages.map((msg, i) => (
          <div key={i} className={`chat-message ${msg.role}`}>
            <div className={`chat-avatar ${msg.role}`}>
              {msg.role === 'assistant' ? '🧠' : '👤'}
            </div>
            <div className="chat-bubble">{msg.content}</div>
          </div>
        ))}

        {isLoading && (
          <div className="chat-message assistant animate-fade-in">
            <div className="chat-avatar assistant">🧠</div>
            <div className="chat-bubble" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <div className="spinner" style={{ width: 14, height: 14 }} />
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Thinking...</span>
            </div>
          </div>
        )}

        {sessionEnded && !isLoading && (
          <div className="animate-fade-in" style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 'var(--space-sm)' }}>✨</div>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-md)' }}>
              Session complete! Let's generate your report.
            </p>
            <button
              id="view-report-btn"
              className="btn btn-primary"
              onClick={endSession}
              disabled={isLoading}
            >
              View Report →
            </button>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Latest TTS Audio */}
      {latestAudio && (
        <div style={{ marginBottom: 'var(--space-sm)', flexShrink: 0 }}>
          <AudioPlayer audioBase64={latestAudio} autoPlay key={latestAudio.slice(-20)} />
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 'var(--space-sm)', flexShrink: 0 }}>
          {error}
        </div>
      )}

      {/* Input Area */}
      {!sessionEnded && (
        <div style={{ flexShrink: 0, borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-md)' }}>
          {/* Mode Toggle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--space-md)', justifyContent: 'center' }}>
            <button
              id="mode-voice"
              className={`btn btn-sm ${inputMode === 'voice' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setInputMode('voice')}
            >
              🎙️ Voice
            </button>
            <button
              id="mode-text"
              className={`btn btn-sm ${inputMode === 'text' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setInputMode('text')}
            >
              ⌨️ Type
            </button>
          </div>

          {inputMode === 'voice' ? (
            <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 'var(--space-sm)' }}>
              <VoiceRecorder
                onRecordingComplete={handleRecordingComplete}
                disabled={isLoading || sessionEnded}
              />
            </div>
          ) : (
            <form onSubmit={handleTextSend} style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <input
                id="text-message-input"
                type="text"
                className="form-input"
                placeholder="Type your response..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                disabled={isLoading || sessionEnded}
                autoFocus
              />
              <button
                id="text-send-btn"
                type="submit"
                className="btn btn-primary"
                disabled={isLoading || !textInput.trim() || sessionEnded}
              >
                Send
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
