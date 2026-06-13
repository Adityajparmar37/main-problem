import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalytics } from '../../../hooks/useAnalytics';
import InsightCard from '../../../components/InsightCard';
import TrendChart from '../../../components/TrendChart';
import Heatmap from '../../../components/Heatmap';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';

const MOOD_COLORS = {
  great: '#10b981', good: '#34d399', okay: '#f59e0b',
  stressed: '#f97316', overwhelmed: '#ef4444', anxious: '#8b5cf6', sad: '#6366f1',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', padding: '10px 14px', boxShadow: 'var(--shadow-md)',
      fontSize: '0.8rem',
    }}>
      <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.fill || p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { overview, trends, report, isLoading, error, refetch } = useAnalytics();
  const [activeTab, setActiveTab] = useState('overview');

  if (isLoading) {
    return (
      <div className="loading-wrapper">
        <div className="spinner spinner-lg" />
        <p style={{ color: 'var(--color-text-muted)' }}>Loading your analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 500, margin: '60px auto', padding: 'var(--space-lg)', textAlign: 'center' }}>
        <div className="alert alert-error" style={{ marginBottom: 'var(--space-lg)' }}>{error}</div>
        <button className="btn btn-primary" onClick={refetch}>Try Again</button>
      </div>
    );
  }

  const weekly = report?.weeklyReport;
  const hasData = (overview?.sessionsCompleted || 0) > 0;

  return (
    <div style={{ padding: 'var(--space-xl) var(--space-lg)', maxWidth: 1100, margin: '0 auto' }}>

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-xl)' }}>
        <div>
          <h1 className="page-title">📊 Wellness Dashboard</h1>
          <p className="page-subtitle">Track your mental wellness patterns over time</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button className="btn btn-ghost btn-sm" id="refresh-btn" onClick={refetch}>↻ Refresh</button>
          <button className="btn btn-primary btn-sm" id="new-session-dashboard-btn" onClick={() => navigate('/voice/setup')}>
            + New Check-in
          </button>
        </div>
      </div>

      {!hasData ? (
        <div className="empty-state">
          <div className="empty-state-icon">🌱</div>
          <h3>No data yet</h3>
          <p>Complete your first voice check-in to start seeing analytics.</p>
          <button className="btn btn-primary" onClick={() => navigate('/voice/setup')}>
            🎙️ Start Check-in
          </button>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
            <InsightCard
              title="Sessions Completed"
              value={overview?.sessionsCompleted ?? 0}
              icon="🎙️" color="primary"
              subtitle="Total check-ins"
            />
            <InsightCard
              title="Average Stress"
              value={`${overview?.averageStress ?? 0}/10`}
              icon="😰"
              color={overview?.averageStress > 7 ? 'danger' : overview?.averageStress > 4 ? 'warning' : 'success'}
              subtitle="Across all sessions"
            />
            <InsightCard
              title="Avg Sleep"
              value={`${overview?.averageSleep ?? 0}h`}
              icon="😴" color="success"
              subtitle="Per night"
            />
            <InsightCard
              title="Recovery Score"
              value={`${weekly?.recoveryScore ?? '—'}`}
              icon="💪" color="primary"
              subtitle="This week"
            />
            {weekly?.commonTrigger && (
              <InsightCard
                title="Main Trigger"
                value={weekly.commonTrigger}
                icon="🎯" color="warning"
                subtitle="Most frequent this week"
              />
            )}
            <InsightCard
              title="This Week"
              value={weekly?.sessionsCompleted ?? 0}
              icon="📅" color="success"
              subtitle="Sessions in last 7 days"
            />
          </div>

          {/* Tab Navigation */}
          <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-sm)' }}>
            {[
              { key: 'overview', label: '📈 Trends' },
              { key: 'heatmap', label: '🗓️ Heatmap' },
              { key: 'triggers', label: '🎯 Triggers' },
              { key: 'mood', label: '😊 Mood' },
            ].map((tab) => (
              <button
                key={tab.key}
                id={`tab-${tab.key}`}
                className={`btn btn-sm ${activeTab === tab.key ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab: Trends */}
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-md)' }} className="animate-fade-in">
              <div className="card">
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 'var(--space-md)' }}>😰 Stress Trend</h3>
                <TrendChart type="stress" stressTrend={trends?.stressTrend || []} />
              </div>
              <div className="card">
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 'var(--space-md)' }}>😊 Mood Trend</h3>
                <TrendChart type="mood" moodTrend={trends?.moodTrend || []} />
              </div>
            </div>
          )}

          {/* Tab: Heatmap */}
          {activeTab === 'heatmap' && (
            <div className="card animate-fade-in">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 'var(--space-xs)' }}>🗓️ Emotional Activity Heatmap</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-lg)' }}>
                Average stress level by day and hour
              </p>
              <Heatmap data={report?.heatmap || []} />
            </div>
          )}

          {/* Tab: Triggers */}
          {activeTab === 'triggers' && (
            <div className="card animate-fade-in">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 'var(--space-md)' }}>🎯 Top Stress Triggers</h3>
              {!trends?.triggerFrequency?.length ? (
                <div className="empty-state" style={{ minHeight: 160 }}>
                  <span>🎯</span>
                  <p>No trigger data yet. Complete more sessions.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={trends.triggerFrequency}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                    <YAxis type="category" dataKey="trigger" tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} width={70} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Occurrences" radius={[0, 4, 4, 0]}>
                      {trends.triggerFrequency.map((_, i) => (
                        <Cell key={i} fill={i === 0 ? 'var(--color-danger)' : i === 1 ? 'var(--color-accent)' : 'var(--color-primary)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {/* Tab: Mood Distribution */}
          {activeTab === 'mood' && (
            <div className="card animate-fade-in">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 'var(--space-md)' }}>😊 Mood Distribution</h3>
              {!trends?.moodDistribution?.length ? (
                <div className="empty-state" style={{ minHeight: 160 }}>
                  <span>😊</span>
                  <p>Complete more sessions to see mood distribution.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 'var(--space-lg)', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    {trends.moodDistribution.map((item) => {
                      const total = trends.moodDistribution.reduce((s, d) => s + d.count, 0);
                      const pct = Math.round((item.count / total) * 100);
                      return (
                        <div key={item.mood} style={{ marginBottom: 'var(--space-sm)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.85rem' }}>
                            <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{item.mood}</span>
                            <span style={{ color: 'var(--color-text-muted)' }}>{item.count} ({pct}%)</span>
                          </div>
                          <div className="progress-bar">
                            <div className="progress-fill" style={{
                              width: `${pct}%`,
                              background: MOOD_COLORS[item.mood] || 'var(--color-primary)',
                            }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Weekly Insights */}
          {weekly?.insights?.length > 0 && (
            <div className="card" style={{ marginTop: 'var(--space-lg)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 'var(--space-md)' }}>💡 Weekly Insights</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {weekly.insights.map((insight, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 'var(--space-sm)', alignItems: 'flex-start',
                    padding: '10px 14px', background: 'var(--color-primary-soft)',
                    borderRadius: 'var(--radius-md)', fontSize: '0.875rem',
                  }}>
                    <span>✨</span>
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
