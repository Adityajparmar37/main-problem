import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSessionStore } from '../../../store/sessionStore';
import { sessionApi } from '../../../api/sessionApi';
import { useState } from 'react';

const EMOTION_EMOJI = {
  anxious: '😟', overwhelmed: '😵', stressed: '😰', sad: '😢',
  hopeful: '🌟', calm: '😌', confused: '😕', tired: '😴', undetermined: '🤔',
};

export default function Report() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { report: storeReport, reset } = useSessionStore();

  const [report, setReport] = useState(storeReport || null);
  const [isLoading, setIsLoading] = useState(!storeReport);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (storeReport) { setReport(storeReport); return; }
    // Fetch from API if navigated directly
    const fetchSession = async () => {
      if (!id) { navigate('/voice/setup'); return; }
      try {
        const res = await sessionApi.getSession(id);
        if (res.data.session?.report) {
          setReport(res.data.session.report);
        } else {
          setError('Report not found. The session may still be processing.');
        }
      } catch (err) {
        setError('Failed to load report.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSession();
  }, [id, storeReport, navigate]);

  const handleStartNew = () => {
    reset();
    navigate('/voice/setup');
  };

  if (isLoading) {
    return (
      <div className="loading-wrapper">
        <div className="spinner spinner-lg" />
        <p>Generating your wellness report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 500, margin: '60px auto', padding: 'var(--space-lg)', textAlign: 'center' }}>
        <div className="alert alert-error" style={{ marginBottom: 'var(--space-lg)' }}>{error}</div>
        <button className="btn btn-primary" onClick={handleStartNew}>Start New Session</button>
      </div>
    );
  }

  if (!report) return null;

  const emotionKey = (report.emotion || 'undetermined').toLowerCase().split(' ')[0];
  const emoji = EMOTION_EMOJI[emotionKey] || '🧠';
  const stressColor = report.stressScore > 7 ? 'danger' : report.stressScore > 4 ? 'warning' : 'success';
  const stressLabel = report.stressScore > 7 ? 'High' : report.stressScore > 4 ? 'Moderate' : 'Low';

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 'var(--space-xl) var(--space-lg)' }}>
      <div className="animate-slide-up">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 'var(--space-md)' }}>{emoji}</div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 'var(--space-xs)' }}>
            Session Complete
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            Here's your personalised wellness report
          </p>
        </div>

        {/* Overview Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
          <div className="card" style={{ textAlign: 'center', borderColor: '#c7d2fe' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: 4 }}>
              {report.emotion || 'N/A'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Primary Emotion
            </div>
          </div>

          <div className={`card`} style={{
            textAlign: 'center',
            borderColor: stressColor === 'danger' ? '#fecaca' : stressColor === 'warning' ? '#fde68a' : '#a7f3d0',
          }}>
            <div style={{
              fontSize: '1.5rem', fontWeight: 700, marginBottom: 4,
              color: stressColor === 'danger' ? 'var(--color-danger)' : stressColor === 'warning' ? 'var(--color-accent)' : 'var(--color-secondary)',
            }}>
              {report.stressScore}/10
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Stress Score — {stressLabel}
            </div>
          </div>
        </div>

        {/* Trigger */}
        {report.trigger && (
          <div className="card card-flat" style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <div style={{ fontSize: '1.5rem' }}>🎯</div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>
                Main Trigger Identified
              </div>
              <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{report.trigger}</div>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-sm)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            📋 Session Summary
          </h3>
          <p style={{ color: 'var(--color-text-primary)', lineHeight: 1.7, fontSize: '0.95rem' }}>
            {report.summary}
          </p>
        </div>

        {/* Recommendations */}
        {report.recommendations?.length > 0 && (
          <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-md)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              💡 Recommendations
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {report.recommendations.map((rec, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 'var(--space-sm)',
                  padding: '10px 14px', background: 'var(--color-primary-soft)',
                  borderRadius: 'var(--radius-md)', fontSize: '0.875rem',
                }}>
                  <span style={{ fontSize: '1rem', flexShrink: 0 }}>✨</span>
                  <span style={{ color: 'var(--color-text-primary)' }}>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
          <button
            id="new-session-btn"
            className="btn btn-primary btn-lg"
            onClick={handleStartNew}
            style={{ flex: 1 }}
          >
            🎙️ New Check-in
          </button>
          <button
            id="view-analytics-btn"
            className="btn btn-ghost btn-lg"
            onClick={() => navigate('/analytics')}
            style={{ flex: 1 }}
          >
            📊 View Analytics
          </button>
        </div>
      </div>
    </div>
  );
}
