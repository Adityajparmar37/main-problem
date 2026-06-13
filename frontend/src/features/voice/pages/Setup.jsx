import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../../hooks/useSession';
import AudioPlayer from '../../../components/AudioPlayer';

const MOODS = [
  { value: 'great', label: 'Great', emoji: '😄' },
  { value: 'good', label: 'Good', emoji: '🙂' },
  { value: 'okay', label: 'Okay', emoji: '😐' },
  { value: 'stressed', label: 'Stressed', emoji: '😰' },
  { value: 'overwhelmed', label: 'Overwhelmed', emoji: '😵' },
  { value: 'anxious', label: 'Anxious', emoji: '😟' },
  { value: 'sad', label: 'Sad', emoji: '😢' },
  { value: 'angry', label: 'Angry', emoji: '😤' },
];

// Map 'angry' to nearest valid enum value for backend
const MOOD_MAP = { angry: 'stressed' };

export default function Setup() {
  const navigate = useNavigate();
  const { startSession, isLoading, error } = useSession();

  const [form, setForm] = useState({
    mood: '',
    stress: 5,
    sleepHours: 7,
    studyHours: 4,
    goal: '',
  });
  const [firstAudio, setFirstAudio] = useState(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  const handleMoodSelect = (mood) => setForm((f) => ({ ...f, mood }));

  const handleSlider = (e) => setForm((f) => ({ ...f, [e.target.name]: Number(e.target.value) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.mood) return;

    try {
      const context = { ...form, mood: MOOD_MAP[form.mood] || form.mood };
      const { audioBase64 } = await startSession(context);
      setFirstAudio(audioBase64);
      setSessionStarted(true);
    } catch (err) {
      // error shown via store
    }
  };

  const handleGoToConversation = () => navigate('/voice/conversation');

  if (sessionStarted) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-lg)' }}>
        <div className="card animate-slide-up" style={{ maxWidth: 500, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>✅</div>
          <h2 style={{ marginBottom: 'var(--space-sm)' }}>Session started!</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)', fontSize: '0.9rem' }}>
            MindMate is ready to listen. Your first question is playing below.
          </p>
          {firstAudio && (
            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <AudioPlayer audioBase64={firstAudio} autoPlay />
            </div>
          )}
          <button id="go-to-conversation" className="btn btn-primary btn-lg w-full" onClick={handleGoToConversation}>
            Start Conversation →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-2xl) var(--space-lg)', maxWidth: 600, margin: '0 auto' }}>
      <div className="animate-fade-in">
        <div className="page-header" style={{ padding: 0, marginBottom: 'var(--space-xl)' }}>
          <h1 className="page-title">How are you today? 🌱</h1>
          <p className="page-subtitle">Share a bit about your current state and we'll personalise your check-in.</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-lg)' }}>{error}</div>}

          {/* Mood */}
          <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-md)' }}>
              Select your mood <span style={{ color: 'var(--color-danger)' }}>*</span>
            </h3>
            <div className="mood-grid">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  id={`mood-${m.value}`}
                  className={`mood-btn${form.mood === m.value ? ' selected' : ''}`}
                  onClick={() => handleMoodSelect(m.value)}
                >
                  <span className="mood-emoji">{m.emoji}</span>
                  {m.label}
                </button>
              ))}
            </div>
            {!form.mood && (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginTop: 'var(--space-sm)' }}>
                Please select a mood to continue
              </p>
            )}
          </div>

          {/* Sliders */}
          <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
              {/* Stress */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xs)' }}>
                  <label className="form-label" htmlFor="stress-slider">😰 Stress Level</label>
                  <span style={{
                    background: form.stress > 7 ? 'var(--color-danger-soft)' : form.stress > 4 ? 'var(--color-accent-soft)' : 'var(--color-secondary-soft)',
                    color: form.stress > 7 ? 'var(--color-danger)' : form.stress > 4 ? 'var(--color-accent)' : 'var(--color-secondary)',
                    padding: '2px 10px', borderRadius: 'var(--radius-full)', fontWeight: 700, fontSize: '0.85rem',
                  }}>
                    {form.stress}/10
                  </span>
                </div>
                <input
                  id="stress-slider" name="stress" type="range"
                  min="1" max="10" step="1"
                  value={form.stress} onChange={handleSlider}
                  className="range-input"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                  <span>Calm</span><span>Extreme</span>
                </div>
              </div>

              {/* Sleep */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xs)' }}>
                  <label className="form-label" htmlFor="sleep-slider">😴 Sleep Last Night</label>
                  <span className="badge badge-primary">{form.sleepHours}h</span>
                </div>
                <input
                  id="sleep-slider" name="sleepHours" type="range"
                  min="0" max="12" step="0.5"
                  value={form.sleepHours} onChange={handleSlider}
                  className="range-input"
                />
              </div>

              {/* Study */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xs)' }}>
                  <label className="form-label" htmlFor="study-slider">📚 Study Hours Today</label>
                  <span className="badge badge-primary">{form.studyHours}h</span>
                </div>
                <input
                  id="study-slider" name="studyHours" type="range"
                  min="0" max="16" step="0.5"
                  value={form.studyHours} onChange={handleSlider}
                  className="range-input"
                />
              </div>
            </div>
          </div>

          {/* Goal */}
          <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="goal-input">🎯 What's your goal today? (optional)</label>
              <input
                id="goal-input" name="goal" type="text"
                className="form-input"
                placeholder="e.g. Finish revision for chapter 5..."
                value={form.goal}
                onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
                maxLength={300}
              />
            </div>
          </div>

          <button
            id="start-session-btn"
            type="submit"
            className="btn btn-primary btn-lg w-full"
            disabled={isLoading || !form.mood}
          >
            {isLoading ? (
              <><div className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> Starting session...</>
            ) : '🎙️ Start Voice Check-in'}
          </button>
        </form>
      </div>
    </div>
  );
}
