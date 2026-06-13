import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const MOOD_SCORE = {
  great: 10, good: 8, okay: 6, stressed: 4, overwhelmed: 2, anxious: 3, sad: 3,
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', padding: '10px 14px', boxShadow: 'var(--shadow-md)',
      fontSize: '0.8rem',
    }}>
      <p style={{ fontWeight: 600, marginBottom: 6, color: 'var(--color-text-primary)' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

export default function TrendChart({ moodTrend = [], stressTrend = [], type = 'stress' }) {
  if (type === 'mood') {
    const data = moodTrend.map((d) => ({
      date: d.date?.slice(5), // MM-DD
      mood: MOOD_SCORE[d.mood] ?? 5,
      moodLabel: d.mood,
    }));

    if (!data.length) {
      return (
        <div className="empty-state" style={{ minHeight: 180 }}>
          <span className="empty-state-icon">📈</span>
          <p>No mood data yet. Complete a session to see trends.</p>
        </div>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
          <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone" dataKey="mood" stroke="var(--color-primary)"
            strokeWidth={2.5} dot={{ r: 4, fill: 'var(--color-primary)' }} name="Mood Score"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // Stress trend
  const data = stressTrend.map((d) => ({
    date: d.date?.slice(5),
    stress: d.avgStress,
    count: d.count,
  }));

  if (!data.length) {
    return (
      <div className="empty-state" style={{ minHeight: 180 }}>
        <span className="empty-state-icon">📊</span>
        <p>No stress data yet. Complete a session to see trends.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
        <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone" dataKey="stress" stroke="var(--color-danger)"
          strokeWidth={2.5} dot={{ r: 4, fill: 'var(--color-danger)' }} name="Avg Stress"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
